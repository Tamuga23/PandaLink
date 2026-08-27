import type { Producto } from "../types";
import { cordobas } from "../lib/format";
import { USD_TO_NIO } from "../config";
import {
  calcularPlanes,
  planMasBajo,
  todosSinInteres,
  type ConfigFinanciamiento,
} from "../lib/financiamiento";

export function PCard({
  p,
  configFinanciamiento,
  onClick,
}: {
  p: Producto;
  configFinanciamiento: ConfigFinanciamiento;
  onClick: () => void;
}) {
  const foto = p.media?.heroImage ?? p.media?.gallery?.[0]?.url ?? p.media?.fotos?.[0];
  const agotado = !p.disponible;
  const act = p.precio?.actual ?? null;
  // El "0%" ya no es parejo: se muestra solo si este producto de verdad no
  // lleva recargo en ningún plazo.
  const planes = calcularPlanes(act, USD_TO_NIO, {
    config: configFinanciamiento,
    categoria: p.categorySlug,
    override: p.financiamientoOverride,
  });
  const cuotaMin = planMasBajo(planes);
  const sinInteres = todosSinInteres(planes);
  return (
    <button
      onClick={onClick}
      className={`text-left bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl p-3 transition-all ${
        agotado
          ? "opacity-60 saturate-50 hover:opacity-80"
          : "hover:border-cyan-500 dark:hover:border-cyan-500 hover:shadow-md"
      }`}
    >
      {/* Portada CUADRADA (aspect-square + object-cover), con fallback al nombre. */}
      <div className="relative aspect-square rounded-lg bg-gradient-to-br from-stone-100 to-stone-200 dark:from-zinc-700 dark:to-zinc-600 overflow-hidden flex items-center justify-center text-stone-400 dark:text-zinc-400 text-xs mb-2">
        {foto ? (
          <img src={foto} alt={p.name} className="w-full h-full object-cover" />
        ) : (
          <span className="px-2 text-center">{p.name}</span>
        )}
        {agotado && (
          <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
            <span className="text-white text-sm font-extrabold uppercase tracking-widest border-2 border-white/70 rounded-lg px-3 py-1">
              Agotado
            </span>
          </div>
        )}
      </div>
      <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{p.name}</div>
      <div className="font-bold text-cyan-600 dark:text-cyan-400">
        {p.precio?.actual != null ? (
          cordobas(p.precio.actual)
        ) : (
          <span className="text-stone-400 dark:text-zinc-500 font-normal text-xs">Sin precio</span>
        )}
      </div>
      {cuotaMin && (
        <div className="mt-0.5 text-[11px] text-stone-400 dark:text-zinc-500">
          desde C${cuotaMin.cuotaNio.toLocaleString("es-NI")} / mes
          {sinInteres && <span className="text-emerald-600 dark:text-emerald-400"> · 0%</span>}
        </div>
      )}
      <div className="mt-1.5 flex items-center gap-2">
        {p.disponible ? (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30">
            ● Disponible
          </span>
        ) : (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30">
            ● Agotado
          </span>
        )}
        {p.specs?.ansi != null && (
          <span className="text-[11px] text-stone-400 dark:text-zinc-500">{p.specs.ansi} ANSI</span>
        )}
      </div>
    </button>
  );
}
