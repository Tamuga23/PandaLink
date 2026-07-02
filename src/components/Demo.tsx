import type { Bullet, Producto } from "../types";
import { cordobas } from "../lib/format";
import { CIERRE_DEMO } from "../config";

// Convierte URLs de YouTube (youtu.be/ID o ?v=ID) a URL de embed para iframe.
function toYouTubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return `https://www.youtube.com/embed${u.pathname}`;
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      // Soporta también youtube.com/shorts/ID y youtube.com/live/ID
      const m = u.pathname.match(/^\/(shorts|live)\/([\w-]+)/);
      if (m) return `https://www.youtube.com/embed/${m[2]}`;
    }
    return null;
  } catch {
    return null;
  }
}

export function Demo({ p, onClose, onHome }: { p: Producto; onClose: () => void; onHome: () => void }) {
  const foto = p.media?.heroImage ?? p.media?.gallery?.[0] ?? p.media?.fotos?.[0];
  const embedUrl = p.media?.videoUrl ? toYouTubeEmbed(p.media.videoUrl) : null;
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

      {/* Body: video izquierda, info derecha */}
      <div className="flex-1 flex gap-4 p-5 min-h-0">

        {/* Video / imagen principal */}
        <div className="flex-1 bg-black rounded-2xl overflow-hidden flex items-center justify-center text-zinc-600">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
              title={`Video ${p.name}`}
            />
          ) : foto ? (
            <img src={foto} alt={p.name} className="w-full h-full object-contain" />
          ) : (
            <span className="text-sm">Sin media cargada</span>
          )}
        </div>

        {/* Panel derecho */}
        <div className="w-72 lg:w-80 xl:w-96 flex flex-col gap-4 shrink-0">
          {/* Foto del producto */}
          {foto && (
            <div className="aspect-square w-full rounded-2xl bg-white overflow-hidden shrink-0">
              <img src={foto} alt={p.name} className="w-full h-full object-contain" />
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
