import { useState } from "react";
import { Tv, Sparkles } from "lucide-react";
import type { Bullet, Objecion, Producto } from "../types";
import { toNum, cordobas } from "../lib/format";
import { USD_TO_NIO, FINANCIAMIENTO_MIN_USD, FINANCIAMIENTO_PLAZOS } from "../config";
import { BackBtn } from "./BackBtn";

// Redondea córdobas al múltiplo de 10 más cercano (evita precios como C$4,436.67).
const round10 = (usd: number) => Math.round((usd * USD_TO_NIO) / 10) * 10;

const K = 45.17; // constante 16:9 validada contra ficha del fabricante

export function Ficha({
  p,
  objeciones,
  onBack,
  onObj,
  onDemo,
}: {
  p: Producto;
  objeciones: Objecion[];
  onBack: () => void;
  onObj: (o: Objecion) => void;
  onDemo: () => void;
}) {
  const [dist, setDist] = useState(2.5);
  const [size, setSize] = useState(100);
  const [showEfe, setShowEfe] = useState(false);

  const foto = p.media?.heroImage ?? p.media?.gallery?.[0] ?? p.media?.fotos?.[0];
  const tr = toNum(p.specs?.throwRatio);
  const dmin = toNum(p.specs?.distMinEnfoque);
  const pulg = Number.isNaN(tr) ? null : Math.round((dist / tr) * K);
  const distNec = Number.isNaN(tr) ? null : ((size * tr) / K).toFixed(1);
  const chico = !Number.isNaN(dmin) && dist < dmin;

  const reg = p.precio?.regular ?? 0;
  const act = p.precio?.actual ?? null; // null = precio no cargado → "Consultar"
  const efe = p.precio?.efectivo ?? 0;
  const hasDisc = (p.precio?.descEfectivoPct ?? 0) > 0 && efe > 0;

  return (
    <div>
      <BackBtn onClick={onBack} />
      <div className="grid grid-cols-2 gap-6 xl:gap-10">
        {/* Izquierda */}
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">{p.name}</h2>
          <p className="text-stone-500 mt-1 flex items-center gap-2">
            {p.beneficio}
            {p.disponible ? (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30 shrink-0">
                ● Disponible
              </span>
            ) : (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30 shrink-0">
                ● Agotado
              </span>
            )}
          </p>
          {/* Imagen cuadrada reducida para que los bullets quepan sin scroll. */}
          <div className="aspect-square w-[250px] mx-auto rounded-xl bg-gradient-to-br from-stone-100 to-stone-200 dark:from-zinc-700 dark:to-zinc-600 overflow-hidden flex items-center justify-center text-stone-400 dark:text-zinc-400 text-sm my-3">
            {foto ? (
              <img src={foto} alt={p.name} className="w-full h-full object-cover" />
            ) : (
              <span className="px-3 text-center">imagen / video {p.name}</span>
            )}
          </div>
          <p className="text-xs uppercase tracking-wide text-stone-400 dark:text-zinc-500 font-bold mb-2">
            Lo que le decís al cliente
          </p>
          <ul className="space-y-2">
            {(p.bullets || []).map((b: Bullet, i: number) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="text-cyan-500">✔</span>
                <span>
                  {b.etiqueta && (
                    <span className="block text-[10px] uppercase tracking-wide text-stone-400 font-semibold">
                      {b.etiqueta}
                    </span>
                  )}
                  {b.texto}
                </span>
              </li>
            ))}
          </ul>
          <button
            onClick={onDemo}
            disabled={!p.disponible}
            className={`mt-5 w-full border-2 border-dashed rounded-xl py-3.5 font-bold flex items-center justify-center gap-2 transition-colors ${
              p.disponible
                ? "border-cyan-500/50 dark:border-cyan-500/40 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-500/10"
                : "border-stone-200 dark:border-zinc-700 text-stone-300 dark:text-zinc-600 cursor-not-allowed"
            }`}
          >
            <Tv size={18} /> Mostrar demo al cliente
          </button>
        </div>

        {/* Derecha */}
        <div className="flex flex-col gap-4">
          {/* Precio y cierre — siempre primero */}
          <div>
          <p className="text-xs uppercase tracking-wide text-stone-400 dark:text-zinc-500 font-bold mb-2">
            Precio y cierre
          </p>
          <div className="bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl p-4">
            {act == null ? (
              // Sin precio cargado: nunca mostrar C$0 frente al cliente.
              <div className="flex justify-between items-baseline py-1.5">
                <span className="text-sm text-stone-600 dark:text-zinc-400">Precio</span>
                <span className="font-bold text-stone-400 dark:text-zinc-500">Consultar en caja</span>
              </div>
            ) : (
            <>
            {reg > act && (
              <div className="flex justify-between items-baseline py-1.5 border-b border-dashed border-stone-200 dark:border-zinc-600">
                <span className="text-sm text-stone-500 dark:text-zinc-400">Precio regular</span>
                <span className="text-stone-400 dark:text-zinc-500 line-through">{cordobas(reg)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline py-1.5">
              <span className="text-sm text-stone-600 dark:text-zinc-400">Precio {hasDisc ? "con tarjeta" : "firme"}</span>
              <span className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{cordobas(act)}</span>
            </div>
            {!p.disponible ? (
              <div className="mt-2 bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/30 rounded-lg p-3 text-[12.5px] text-red-700 dark:text-red-300">
                ● <b>Agotado.</b> Confirmá reposición en el POS antes de ofrecerlo.
              </div>
            ) : hasDisc ? (
              !showEfe ? (
                <button
                  onClick={() => setShowEfe(true)}
                  className="mt-2 w-full flex items-center justify-center gap-2 border-2 border-dashed border-emerald-400 dark:border-emerald-600 rounded-xl py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                >
                  <Sparkles size={15} /> Ver opciones de pago
                </button>
              ) : (
                <div
                  className="mt-2 bg-emerald-50 border-2 border-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500 rounded-xl p-4 cursor-pointer"
                  onClick={() => setShowEfe(false)}
                >
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <Sparkles size={14} /> Efectivo o transferencia
                    </span>
                    <span className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400">C${round10(efe).toLocaleString("es-NI")}</span>
                  </div>
                  <div className="text-xs text-stone-500 dark:text-zinc-400 mt-1">
                    Ahorro de C${(Math.round(act * USD_TO_NIO / 10) * 10 - round10(efe)).toLocaleString("es-NI")} — el precio para cerrar la venta.
                  </div>
                </div>
              )
            ) : (
              <div className="mt-2 bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30 rounded-lg p-3 text-[12.5px] text-amber-800 dark:text-amber-300">
                🔒 <b>Modelo sin descuento.</b> El precio mostrado es firme — no ofrecer rebaja.
              </div>
            )}

            {/* Financiamiento 0% — solo si precio con tarjeta >= umbral */}
            {act != null && act >= FINANCIAMIENTO_MIN_USD && (
              <div className="mt-3 border border-dashed border-stone-300 dark:border-zinc-600 rounded-xl p-4">
                <div className="flex items-center gap-2.5 mb-3">
                  <img src="/banpro.svg" alt="Banpro" style={{ height: 35 }} className="opacity-90 shrink-0" />
                  <p className="text-xs font-bold uppercase tracking-wide text-stone-400 dark:text-zinc-500">
                    Financiamiento sin intereses
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {FINANCIAMIENTO_PLAZOS.map((meses) => {
                    const cuotaNio = (act * USD_TO_NIO) / meses;
                    return (
                      <div
                        key={meses}
                        className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-700/40 rounded-xl px-4 py-4 text-center"
                      >
                        <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                          {meses} cuotas
                        </div>
                        <div className="text-2xl font-extrabold text-zinc-800 dark:text-zinc-100 leading-tight">
                          C${Math.round(cuotaNio).toLocaleString("es-NI")}
                        </div>
                        <div className="text-xs text-stone-400 dark:text-zinc-500 mt-1">/ mes · 0% interés</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            </>
            )}
          </div>
          </div>

          {/* Objeciones — con scroll interno para no desplazar precio */}
          <div>
            <p className="text-xs uppercase tracking-wide text-stone-400 dark:text-zinc-500 font-bold mb-2">
              Respuestas rápidas a objeciones
            </p>
            {objeciones.length === 0 ? (
              <p className="text-stone-400 text-sm">Sin objeciones cargadas todavía.</p>
            ) : (
              <div className="overflow-y-auto max-h-[260px] pr-1">
                <div className="grid grid-cols-2 gap-2">
                  {objeciones.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => onObj(o)}
                      className="min-h-[52px] text-left text-sm font-semibold text-slate-700 dark:text-zinc-200 bg-slate-100 dark:bg-zinc-700 border border-slate-300 dark:border-zinc-600 rounded-lg px-3 py-2.5 hover:bg-slate-200 dark:hover:bg-zinc-600 active:bg-slate-300 dark:active:bg-zinc-500 transition-colors"
                    >
                      {o.pregunta}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Calculadora — solo proyectores */}
          {p.categorySlug?.toLowerCase() === "projector" && (
          <div>
          <p className="text-xs uppercase tracking-wide text-stone-400 dark:text-zinc-500 font-bold mb-2">
            Calculadora de distancia
          </p>
          <div className="bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs text-stone-600 dark:text-zinc-400 w-28">Distancia a la pared</span>
              <input
                type="range"
                min="0.6"
                max="4"
                step="0.1"
                value={dist}
                onChange={(e) => setDist(+e.target.value)}
                className="flex-1 accent-cyan-500"
              />
              <span className="text-xs bg-stone-100 dark:bg-zinc-700 border border-stone-200 dark:border-zinc-600 rounded px-2 py-1 w-16 text-center">
                {dist.toFixed(1)} m
              </span>
            </div>
            <div className="text-sm bg-slate-50 dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 rounded-lg p-2.5 mt-1">
              {pulg !== null ? (
                <>
                  A <b>{dist.toFixed(1)} m</b> proyecta <b>{pulg}"</b>.
                </>
              ) : (
                "Throw ratio no cargado para este modelo."
              )}
            </div>
            {chico && (
              <div className="text-[12px] text-amber-800 bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30 rounded-lg p-2 mt-2">
                ⚠️ Cuarto muy chico: enfoca desde {dmin} m. Adviértalo para evitar devolución.
              </div>
            )}
            <div className="flex items-center gap-3 mt-4 mb-1">
              <span className="text-xs text-stone-600 dark:text-zinc-400 w-28">O: tamaño deseado</span>
              <input
                type="range"
                min="40"
                max="140"
                step="5"
                value={size}
                onChange={(e) => setSize(+e.target.value)}
                className="flex-1 accent-cyan-500"
              />
              <span className="text-xs bg-stone-100 dark:bg-zinc-700 border border-stone-200 dark:border-zinc-600 rounded px-2 py-1 w-16 text-center">
                {size}"
              </span>
            </div>
            <div className="text-sm bg-slate-50 dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 rounded-lg p-2.5">
              {distNec !== null ? (
                <>
                  Para <b>{size}"</b> colóquelo a <b>{distNec} m</b>.
                </>
              ) : (
                "—"
              )}
            </div>
          </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
