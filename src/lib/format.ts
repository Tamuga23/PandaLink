import { USD_TO_NIO } from "../config";

// throwRatio puede venir número (1.0) o texto ("1.0:1"); distMin "0.9" o "0.9m".
export const toNum = (v: unknown): number => {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const m = v.match(/[\d.]+/);
    return m ? parseFloat(m[0]) : NaN;
  }
  return NaN;
};

export const cordobas = (n: number | null | undefined): string =>
  "C$" + Number((n ?? 0) * USD_TO_NIO).toLocaleString("es-NI", { maximumFractionDigits: 2 });
