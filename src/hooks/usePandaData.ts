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
  // El id del documento manda por sobre cualquier campo "id" interno.
  return snap.docs.map((d) => ({ ...d.data(), id: d.id })) as T[];
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
            const items = mapDocs<Producto>(snap);
            items.sort(
              (a, b) =>
                (a.precio?.actual ?? Number.POSITIVE_INFINITY) -
                (b.precio?.actual ?? Number.POSITIVE_INFINITY),
            );
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
