import type { Objecion, Producto } from "../types";

// Cascada de tres capas: universales < categoría < override del modelo.
// El más específico gana ante igual id.
export function objecionesDe(
  producto: Producto,
  universales: Objecion[],
  porCategoria: Objecion[],
): Objecion[] {
  const map = new Map<string, Objecion>();
  // 1. Universales
  universales.forEach((o) => map.set(o.id, o));
  // 2. De la categoría del producto
  porCategoria
    .filter((o) => o.categorySlug === producto.categorySlug)
    .forEach((o) => map.set(o.id, o));
  // 3. Override del modelo (más específico). Hereda de la objeción base lo
  // que el override no trae (pregunta y orden), para no perder el label del
  // botón cuando el POS solo manda { objId, respuesta }.
  (producto.objecionesOverride || []).forEach((o) => {
    const prev = map.get(o.id);
    map.set(o.id, {
      ...(prev ?? {}),
      ...o,
      pregunta: o.pregunta || prev?.pregunta || o.id,
      orden: o.orden ?? prev?.orden ?? 99,
    });
  });
  return Array.from(map.values()).sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99));
}
