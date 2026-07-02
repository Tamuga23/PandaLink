import { useEffect, useState } from "react";
import { collection, onSnapshot } from "@firebase/firestore";
import { db, ensureAnonAuth } from "../lib/firebase";
import type { Objecion, Producto } from "../types";

export interface PandaData {
  catalogo: Producto[];
  universales: Objecion[];
  porCategoria: Objecion[];
  loading: boolean;
  error: string | null;
}

// El POS guarda slugs en español; la app filtra en inglés. Se aplica tanto a
// productos como a objeciones_categoria para que SIEMPRE coincidan entre sí.
const SLUG_MAP: Record<string, string> = { proyector: 'projector', camara: 'security-cam', parlante: 'speaker' };
const mapSlug = (s: string) => SLUG_MAP[s.toLowerCase()] ?? s;

// Normaliza campos alternativos del admin de PandaStore al schema que usa PandaLink.
// Esto permite que documentos con nomenclatura antigua/diferente se muestren igual.
function normalizarProducto(raw: Record<string, unknown>): Producto {
  const p = { ...raw } as Record<string, unknown>;

  // nombre: description → name
  if (!p.name && p.description) p.name = p.description;

  // disponibilidad: activo o publicar → disponible
  if (p.disponible === undefined) {
    if (p.activo !== undefined) p.disponible = p.activo;
    else if (p.publicar !== undefined) p.disponible = p.publicar;
  }

  // categoría: category → categorySlug
  if (!p.categorySlug && p.category) p.categorySlug = p.category;

  // normalizar slugs en español → inglés (POS guarda 'proyector', app filtra por 'projector')
  if (p.categorySlug) p.categorySlug = mapSlug(p.categorySlug as string);

  // precio: dos schemas posibles.
  // 1) Doc de catalogo_publico (backfill del POS): { precio: { lista, actual, efectivo, ... } }
  //    → la UI usa `regular`, así que mapeamos lista → regular.
  // 2) Campos sueltos estilo `products`: { price, precioPromo, descEfectivoPct, campania }.
  // NUNCA usar `cost`: es el costo interno del POS y jamás debe mostrarse como precio.
  if (p.precio && typeof p.precio === "object") {
    const pr = p.precio as Record<string, unknown>;
    if (pr.regular == null && pr.lista != null) pr.regular = pr.lista;
  }
  if (!p.precio) {
    if (p.precioPromo != null || p.price != null) {
      const regular = p.price as number | undefined;
      const actual = (p.precioPromo ?? regular) as number | undefined;
      const descPct = p.descEfectivoPct as number | undefined;
      const efectivo =
        actual != null && descPct != null
          ? actual * (1 - descPct / 100)
          : undefined;
      p.precio = {
        ...(regular != null && { regular }),
        ...(actual != null && { actual }),
        ...(efectivo != null && { efectivo }),
        ...(descPct != null && { descEfectivoPct: descPct }),
        ...(p.campania ? { campania: p.campania as string } : {}),
      };
    }
  }

  // specs: specsProyector (schema PandaStore) → specs
  if (!p.specs && p.specsProyector != null && typeof p.specsProyector === "object")
    p.specs = p.specsProyector;

  // specs: campos sueltos en raíz → specs (sin pisar lo que ya existe)
  const rootSpecMap: Record<string, string> = {
    ansi: "ansi",
    throwRatio: "throwRatio",
    throwratio: "throwRatio",
    distMinEnfoque: "distMinEnfoque",
    resolucion: "resolucion",
    autofoco: "autofoco",
    lumens: "ansi",
  };
  const rootSpecEntries = Object.entries(rootSpecMap).filter(([k]) => p[k] !== undefined);
  if (rootSpecEntries.length > 0) {
    const existing = (p.specs as Record<string, unknown>) ?? {};
    const fromRoot: Record<string, unknown> = {};
    for (const [src, dest] of rootSpecEntries) fromRoot[dest] = p[src];
    p.specs = { ...fromRoot, ...existing };
  }

  // media: imageBase64 en raíz → media.heroImage (si aún no hay heroImage)
  if (p.imageBase64) {
    const m = (p.media as Record<string, unknown>) ?? {};
    if (!m.heroImage) p.media = { ...m, heroImage: p.imageBase64 as string };
  }

  // bullets: respetar `order` si viene del POS y normalizar text → texto
  if (Array.isArray(p.bullets)) {
    p.bullets = (p.bullets as Record<string, unknown>[])
      .slice()
      .sort((a, b) => ((a.order as number) ?? 99) - ((b.order as number) ?? 99))
      .map((b) => ({ ...b, texto: b.texto ?? b.text }));
  }

  // objecionesOverride: objId → id; titulo → pregunta.
  // Si el override no trae texto de pregunta, queda vacía y la cascada
  // (objecionesDe) hereda la pregunta de la objeción base que reemplaza.
  if (Array.isArray(p.objecionesOverride)) {
    p.objecionesOverride = (p.objecionesOverride as Record<string, unknown>[]).map(
      (o) => ({
        ...o,
        id: o.id ?? o.objId,
        pregunta: o.pregunta ?? o.titulo ?? "",
      }),
    );
  }

  return p as unknown as Producto;
}

function traducirError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/permission|insufficient/i.test(msg)) {
    return "Sin permisos para leer las colecciones. Revisá las reglas de Firestore y la sesión anónima.";
  }
  return "No se pudo conectar con Firebase. " + msg;
}

// objeciones_universales llega con titulo (no pregunta) y order (no orden).
function normalizarUniversal(raw: Record<string, unknown>): Objecion {
  return {
    id: raw.id as string,
    pregunta: (raw.titulo ?? raw.pregunta ?? "") as string,
    respuesta: (raw.respuesta ?? "") as string,
    orden: (raw.order ?? raw.orden) as number | undefined,
  };
}

// objeciones_categoria ya tiene pregunta y orden. El categorySlug pasa por el
// MISMO SLUG_MAP que los productos: en Firestore está en español ('proyector')
// y los productos normalizados quedan en inglés ('projector') — sin esto,
// las objeciones por categoría jamás coinciden y no aparecen en la ficha.
function normalizarCategoria(raw: Record<string, unknown>): Objecion {
  return {
    id: raw.id as string,
    categorySlug: mapSlug((raw.categorySlug ?? "") as string),
    pregunta: (raw.pregunta ?? "") as string,
    respuesta: (raw.respuesta ?? "") as string,
    orden: raw.orden as number | undefined,
  };
}

// Suscripciones en vivo (onSnapshot) a tres colecciones de Firestore.
export function usePandaData(): PandaData {
  const [catalogo, setCatalogo] = useState<Producto[]>([]);
  const [universales, setUniversales] = useState<Objecion[]>([]);
  const [porCategoria, setPorCategoria] = useState<Objecion[]>([]);
  const [catReady, setCatReady] = useState(false);
  const [uniReady, setUniReady] = useState(false);
  const [catObjReady, setCatObjReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let unsubCat: () => void = () => {};
    let unsubUni: () => void = () => {};
    let unsubCatObj: () => void = () => {};

    ensureAnonAuth()
      .then(() => {
        if (!active) return;

        // Catálogo: traemos TODO y mostramos el estado (Disponible / Agotado).
        // Es la ÚNICA colección que bloquea la app si falla.
        unsubCat = onSnapshot(
          collection(db, "catalogo_publico"),
          (snap) => {
            const items = snap.docs.map((d) =>
              normalizarProducto({ ...d.data(), id: d.id }),
            );
            items.sort((a, b) => {
              const avail = (b.disponible ? 1 : 0) - (a.disponible ? 1 : 0);
              if (avail !== 0) return avail;
              return (b.precio?.actual ?? 0) - (a.precio?.actual ?? 0);
            });
            setCatalogo(items);
            setError(null);
            setCatReady(true);
          },
          (e) => { setError(traducirError(e)); setCatReady(true); },
        );

        // Universales: campos titulo→pregunta, order→orden.
        // Si falla, la app sigue (la ficha muestra "Sin objeciones cargadas").
        unsubUni = onSnapshot(
          collection(db, "objeciones_universales"),
          (snap) => {
            const items = snap.docs
              .map((d) => normalizarUniversal({ ...d.data(), id: d.id }))
              .sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99));
            setUniversales(items);
            setUniReady(true);
          },
          (e) => { console.warn("objeciones_universales:", e); setUniReady(true); },
        );

        // Por categoría: traemos TODO y filtramos en cliente (evita índice compuesto).
        // Igual que universales: si falla, no bloquea la app (solo warn).
        unsubCatObj = onSnapshot(
          collection(db, "objeciones_categoria"),
          (snap) => {
            const items = snap.docs.map((d) =>
              normalizarCategoria({ ...d.data(), id: d.id }),
            );
            setPorCategoria(items);
            setCatObjReady(true);
          },
          (e) => { console.warn("objeciones_categoria:", e); setCatObjReady(true); },
        );
      })
      .catch((e) => {
        setError(traducirError(e));
        setCatReady(true);
        setUniReady(true);
        setCatObjReady(true);
      });

    return () => {
      active = false;
      unsubCat();
      unsubUni();
      unsubCatObj();
    };
  }, []);

  return {
    catalogo,
    universales,
    porCategoria,
    loading: !(catReady && uniReady && catObjReady),
    error,
  };
}
