import type { Producto } from "../types";
import { cordobas } from "../lib/format";

export function PCard({ p, onClick }: { p: Producto; onClick: () => void }) {
  const foto = p.media?.heroImage ?? p.media?.fotos?.[0];
  return (
    <button
      onClick={onClick}
      className="text-left bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl p-3 hover:border-zinc-900 dark:hover:border-zinc-400 hover:shadow-md transition-all"
    >
      {/* Portada CUADRADA (aspect-square + object-cover), con fallback al nombre. */}
      <div className="aspect-square rounded-lg bg-gradient-to-br from-stone-100 to-stone-200 dark:from-zinc-700 dark:to-zinc-600 overflow-hidden flex items-center justify-center text-stone-400 dark:text-zinc-400 text-xs mb-2">
        {foto ? (
          <img src={foto} alt={p.name} className="w-full h-full object-cover" />
        ) : (
          <span className="px-2 text-center">{p.name}</span>
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
      <div className="mt-1.5 flex items-center gap-2">
        {p.disponible ? (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            ● Disponible
          </span>
        ) : (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
            ● Agotado
          </span>
        )}
        {p.specs?.ansi != null && (
          <span className="text-[11px] text-stone-400">{p.specs.ansi} ANSI</span>
        )}
      </div>
    </button>
  );
}
