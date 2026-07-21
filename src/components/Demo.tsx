import { useEffect, useState } from "react";
import type { Bullet, Producto } from "../types";
import { cordobas } from "../lib/format";
import { CIERRE_DEMO } from "../config";

// Extrae el ID de YouTube (youtu.be/ID, ?v=ID, /shorts/ID, /live/ID).
function toYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const m = u.pathname.match(/^\/(shorts|live)\/([\w-]+)/);
      if (m) return m[2];
    }
    return null;
  } catch {
    return null;
  }
}

// Diapositivas del visor: video de YouTube + foto real + complementarias.
type Slide =
  | { tipo: "video"; embed: string; thumb: string }
  | { tipo: "foto"; url: string; label?: string };

export function Demo({ p, onClose, onHome }: { p: Producto; onClose: () => void; onHome: () => void }) {
  // Foto "real" del producto: hero (o legacy fotos[0]). Las complementarias
  // vienen de media.gallery ({url, label} — normalizadas en usePandaData).
  const heroUrl = p.media?.heroImage ?? p.media?.fotos?.[0];
  const galeria = p.media?.gallery ?? [];
  const fotosSlides: Slide[] = [
    ...(heroUrl ? [{ tipo: "foto" as const, url: heroUrl, label: "Producto" }] : []),
    ...galeria
      .filter((g) => g.url !== heroUrl)
      .map((g) => ({ tipo: "foto" as const, url: g.url, label: g.label })),
  ];
  const ytId = p.media?.videoUrl ? toYouTubeId(p.media.videoUrl) : null;
  const slides: Slide[] = ytId
    ? [
        {
          tipo: "video",
          embed: `https://www.youtube.com/embed/${ytId}`,
          thumb: `https://i.ytimg.com/vi/${ytId}/mqdefault.jpg`,
        },
        ...fotosSlides,
      ]
    : fotosSlides;

  const [idx, setIdx] = useState(0);
  useEffect(() => setIdx(0), [p.id]); // por si cambia el producto con el demo abierto
  const activa = slides[Math.min(idx, slides.length - 1)];
  const fotoPanel = heroUrl ?? galeria[0]?.url;

  return (
    <div className="fixed inset-0 z-30 bg-zinc-950 text-white flex flex-col">
      {/* Navbar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-zinc-800 shrink-0">
        <button onClick={onHome} className="flex items-center">
          <img src="/Logo Panda Store.png" alt="PandaStore" className="h-8 w-auto" />
        </button>
        <button
          onClick={onClose}
          className="ml-auto text-xs bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg px-3 py-1.5 hover:bg-zinc-700"
        >
          ↩ Salir del modo demo
        </button>
      </div>

      {/* Body: visor + miniaturas izquierda, info derecha */}
      <div className="flex-1 flex gap-4 p-5 min-h-0">

        {/* Columna del visor */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <div className="flex-1 relative bg-black rounded-2xl overflow-hidden flex items-center justify-center text-zinc-600 min-h-0">
            {!activa ? (
              <span className="text-sm">Sin media cargada</span>
            ) : activa.tipo === "video" ? (
              <iframe
                src={activa.embed}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
                title={`Video ${p.name}`}
              />
            ) : (
              <>
                <img src={activa.url} alt={activa.label ?? p.name} className="w-full h-full object-contain" />
                {activa.label && (
                  <span className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-lg">
                    {activa.label}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Miniaturas: solo si hay más de una diapositiva */}
          {slides.length > 1 && (
            <div className="flex gap-2 shrink-0">
              {slides.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  title={s.tipo === "video" ? "Video" : s.label ?? p.name}
                  className={`relative w-24 h-16 rounded-lg overflow-hidden border-2 bg-black shrink-0 ${
                    i === idx ? "border-cyan-400" : "border-zinc-700 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={s.tipo === "video" ? s.thumb : s.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  {s.tipo === "video" && (
                    <span className="absolute inset-0 flex items-center justify-center text-white text-xl bg-black/30">
                      ▶
                    </span>
                  )}
                  {s.tipo === "foto" && s.label && (
                    <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] px-1 truncate text-center">
                      {s.label}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Panel derecho */}
        <div className="w-72 lg:w-80 xl:w-96 flex flex-col gap-4 shrink-0">
          {/* Foto del producto */}
          {fotoPanel && (
            <div className="aspect-square w-full rounded-2xl bg-white overflow-hidden shrink-0">
              <img src={fotoPanel} alt={p.name} className="w-full h-full object-contain" />
            </div>
          )}

          {/* Info */}
          <div className="flex flex-col gap-3 overflow-auto">
            <div>
              <h2 className="text-xl font-extrabold leading-tight">{p.name}</h2>
              <p className="text-zinc-400 text-sm mt-1">{p.beneficio}</p>
            </div>

            {/* Bullets */}
            {(p.bullets ?? []).length > 0 && (
              <ul className="space-y-2">
                {(p.bullets ?? []).slice(0, 4).map((b: Bullet, i: number) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="text-cyan-400 shrink-0">✔</span>
                    <span className="text-zinc-300">{b.texto}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Precio */}
            <div className="mt-auto pt-3 border-t border-zinc-800">
              {p.precio?.actual != null ? (
                <div className="text-2xl font-extrabold text-cyan-400">
                  {cordobas(p.precio.actual)}
                </div>
              ) : (
                <div className="text-lg font-bold text-zinc-400">Precio: consultar al asesor</div>
              )}
              <div className="text-xs text-zinc-500 mt-0.5">{CIERRE_DEMO}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
