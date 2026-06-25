import { useEffect, useState } from "react";
import { collection, onSnapshot } from "@firebase/firestore";
import type { DocumentData, QuerySnapshot } from "@firebase/firestore";
import { db, ensureAnonAuth } from "../lib/firebase";
import type { Objecion, Producto } from "../types";

export interface PandaData {
  catalogo: Producto[];
  universales: Objecion[];
  loading: boolean;
  error: string | null;
}

function mapDocs<T>(snap: QuerySnapshot<DocumentData>): T[] {
  return snap.docs.map((d) => ({ ...d.data(), id: d.id })) as T[];
}

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

  // precio: varios schemas posibles
  // Schema A: { cost } → { actual: cost }
  // Schema B: { price, precioPromo, descEfectivoPct, campania }
  if (!p.precio) {
    if (p.precioPromo != null || p.price != null || p.cost != null) {
      const actual = (p.precioPromo ?? p.cost) as number | undefined;
      const regular = (p.price ?? actual) as number | undefined;
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

  // bullets: normalizar text → texto
  if (Array.isArray(p.bullets)) {
    p.bullets = (p.bullets as Record<string, unknown>[]).map((b) => ({
      ...b,
      texto: b.texto ?? b.text,
    }));
  }

  // objecionesOverride: objId → id y pregunta (schema PandaStore)
  if (Array.isArray(p.objecionesOverride)) {
    p.objecionesOverride = (p.objecionesOverride as Record<string, unknown>[]).map(
      (o) => ({
        ...o,
        id: o.id ?? o.objId,
        pregunta: o.pregunta ?? o.objId,
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

// Suscripciones en vivo (onSnapshot) a catalogo_publico y objeciones_universales.
export function usePandaData(): PandaData {
  const [catalogo, setCatalogo] = useState<Producto[]>([]);
  const [universales, setUniversales] = useState<Objecion[]>([]);
  const [catReady, setCatReady] = useState(false);
  const [objReady, setObjReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let unsubCat: () => void = () => {};
    let unsubObj: () => void = () => {};

    ensureAnonAuth()
      .then(() => {
        if (!active) return;

        // Catálogo: traemos TODO y mostramos el estado (Disponible / Agotado).
        // Orden estable por precio asc; los que no tengan precio quedan al final.
        unsubCat = onSnapshot(
          collection(db, "catalogo_publico"),
          (snap) => {
            const items = snap.docs.map((d) =>
              normalizarProducto({ ...d.data(), id: d.id }),
            );
            items.sort((a, b) => {
              const avail = (b.disponible ? 1 : 0) - (a.disponible ? 1 : 0);
              if (avail !== 0) return avail;
              return (a.precio?.actual ?? Number.POSITIVE_INFINITY) -
                (b.precio?.actual ?? Number.POSITIVE_INFINITY);
            });
            setCatalogo(items);
            setCatReady(true);
          },
          (e) => {
            setError(traducirError(e));
            setCatReady(true);
          },
        );

        // Objeciones universales: ordenadas por "orden" en el cliente, así no
        // se pierden documentos que no tengan ese campo cargado.
        unsubObj = onSnapshot(
          collection(db, "objeciones_universales"),
          (snap) => {
            const items = mapDocs<Objecion>(snap);
            items.sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99));
            setUniversales(items);
            setObjReady(true);
          },
          (e) => {
            setError(traducirError(e));
            setObjReady(true);
          },
        );
      })
      .catch((e) => {
        setError(traducirError(e));
        setCatReady(true);
        setObjReady(true);
      });

    return () => {
      active = false;
      unsubCat();
      unsubObj();
    };
  }, []);

  return { catalogo, universales, loading: !(catReady && objReady), error };
}
