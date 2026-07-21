// Tipos del catálogo. Casi todo es opcional a propósito: en producción solo
// HY310X tiene todos los campos cargados; la app no debe romper si a otros
// productos les faltan specs, media, bullets, precio u objecionesOverride.
export interface Bullet {
  etiqueta?: string;
  texto?: string;
}

export interface Objecion {
  id: string;
  pregunta: string;
  respuesta: string;
  orden?: number;
  categorySlug?: string;
}

export interface Specs {
  ansi?: number;
  throwRatio?: number | string;
  distMinEnfoque?: number | string;
  resolucion?: string;
  autofoco?: boolean;
}

export interface Precio {
  regular?: number;
  actual?: number;
  descEfectivoPct?: number;
  efectivo?: number;
  campania?: string;
}

/** Foto complementaria con etiqueta corta (ej. "A oscuras", "Con luz"). */
export interface FotoGaleria {
  url: string;
  label?: string;
}

export interface Media {
  fotos?: string[];
  videos?: string[];
  heroImage?: string;
  /**
   * Galería de fotos (campo del POS: TabletMedia.gallery). El POS nuevo manda
   * {url, label}; docs viejos traen strings — el normalizador unifica a
   * FotoGaleria[], la UI puede asumir SIEMPRE objetos.
   */
  gallery?: FotoGaleria[];
  videoUrl?: string;
}

export interface Producto {
  id: string;
  name: string;
  categorySlug?: string;
  disponible?: boolean;
  precio?: Precio;
  beneficio?: string;
  specs?: Specs;
  bullets?: Bullet[];
  objecionesOverride?: Objecion[];
  media?: Media;
}
