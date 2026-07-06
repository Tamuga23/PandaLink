// Config de negocio editable — un solo lugar para tocar textos y valores.

// Tipo de cambio para mostrar precios en córdobas (los docs traen USD).
export const USD_TO_NIO = 36.6243;

// Badge de promo del top bar. Se oculta solo pasada la fecha `hasta` (inclusive).
export const PROMO = { texto: "🎯 Mundial 2026", hasta: "2026-07-19" };

// Financiamiento 0% interés: umbral mínimo en USD y plazos disponibles.
export const FINANCIAMIENTO_MIN_USD = 100;
export const FINANCIAMIENTO_PLAZOS = [3, 6]; // meses

// Pie del precio en modo demo.
export const CIERRE_DEMO = "factura · garantía 3 meses · entrega inmediata";

// Nombre del asesor que "firma" las respuestas del drawer de objeciones.
export const VOZ_ASESOR = "Carlos";
