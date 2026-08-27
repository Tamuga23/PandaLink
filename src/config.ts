// Config de negocio editable — un solo lugar para tocar textos y valores.

// Tipo de cambio para mostrar precios en córdobas (los docs traen USD).
export const USD_TO_NIO = 36.6243;

// Badge de promo del top bar. Se oculta solo pasada la fecha `hasta` (inclusive).
export const PROMO = { texto: "🎯 Mundial 2026", hasta: "2026-07-19" };

// El financiamiento ya NO se configura acá. El umbral, los plazos y el recargo
// por categoría viven en Firestore (`config/financiamiento`, editable desde
// Configuración del POS) y los calcula src/lib/financiamiento.ts, el mismo
// módulo que usa PandaWEB. El respaldo, si Firestore no responde, es
// CONFIG_FINANCIAMIENTO_DEFAULT en ese archivo.

// Pie del precio en modo demo.
export const CIERRE_DEMO = "factura · garantía 3 meses · entrega inmediata";

// Nombre del asesor que "firma" las respuestas del drawer de objeciones.
export const VOZ_ASESOR = "Carlos";
