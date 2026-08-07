import { useEffect, useMemo, useState } from "react";
import { Search, Sun, Moon, Building2, Popcorn } from "lucide-react";
import { usePandaData } from "./hooks/usePandaData";
import type { Objecion, Producto } from "./types";
import { PROMO } from "./config";
import { cordobas } from "./lib/format";
import { objecionesDe } from "./lib/objeciones";
import { Cargando, ErrorState, VacioState } from "./components/Estados";
import { Home } from "./components/Home";
import { Guided, Opt } from "./components/Guided";
import { PCard } from "./components/PCard";
import { BackBtn } from "./components/BackBtn";
import { Ficha } from "./components/Ficha";
import { Demo } from "./components/Demo";
import { ObjecionDrawer } from "./components/ObjecionDrawer";

/* ============================================================================
   PandaLink — Panda Asesor (app de tablet, solo lectura)
   Lee catalogo_publico + objeciones desde Firestore (onSnapshot).
   Este archivo solo orquesta pantallas y estado; la UI vive en src/components/.
   ========================================================================== */

type Screen = "home" | "g1" | "g2" | "recos" | "catalog" | "ficha";
interface Recos {
  luz: string;
  list: Producto[];
}

const SLUG_LABEL: Record<string, string> = {
  projector: "Proyectores",
  smartwatch: "Smartwatch",
  dashcam: "Dashcams",
  "security-cam": "Cámaras",
  smarthome: "Smart home",
  speaker: "Parlantes",
};
const SLUG_ORDER = ["projector", "smartwatch", "dashcam", "security-cam", "smarthome", "speaker"];

export default function App() {
  const { catalogo, universales, porCategoria, loading, error } = usePandaData();
  const [screen, setScreen] = useState<Screen>("home");
  const [sel, setSel] = useState<Producto | null>(null);
  const [drawer, setDrawer] = useState<Objecion | null>(null);
  const [demo, setDemo] = useState(false);
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    const isDark = saved !== "light"; // dark por defecto
    if (isDark) document.documentElement.classList.add("dark");
    return isDark;
  });
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("projector");

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  };
  const [recos, setRecos] = useState<Recos | null>(null);
  // Búsqueda global del header: 1 tap desde cualquier pantalla al producto.
  const [gq, setGq] = useState("");

  const openFicha = (p: Producto) => {
    setSel(p);
    setGq("");
    setScreen("ficha");
  };

  const gResults = useMemo(() => {
    const t = gq.trim().toLowerCase();
    if (t.length < 2) return [];
    return catalogo
      .filter((p) => (p.name || "").toLowerCase().includes(t))
      .slice(0, 8);
  }, [catalogo, gq]);

  const activeCats = useMemo(() => {
    const slugsConStock = new Set(
      catalogo
        .filter((p) => p.disponible && p.categorySlug)
        .map((p) => p.categorySlug!.toLowerCase()),
    );
    return SLUG_ORDER.filter((s) => slugsConStock.has(s))
      .concat(Array.from(slugsConStock).filter((s) => !SLUG_ORDER.includes(s)))
      .map((slug) => ({ slug, label: SLUG_LABEL[slug] ?? slug }));
  }, [catalogo]);

  // Si la categoría activa queda sin stock, cambiar a la primera disponible.
  useEffect(() => {
    if (activeCats.length > 0 && !activeCats.find((c) => c.slug === cat)) {
      setCat(activeCats[0].slug);
    }
  }, [activeCats, cat]);

  const filtered = useMemo(
    () =>
      catalogo
        .filter((p) => p.categorySlug?.toLowerCase() === cat)
        .filter((p) =>
          (p.name || "").toLowerCase().includes(query.toLowerCase()),
        ),
    [catalogo, cat, query],
  );

  const recommend = (luz: string) => {
    // Solo proyectores DISPONIBLES: nunca recomendar agotados ni otras categorías.
    const base = catalogo.filter(
      (p) => p.disponible && p.categorySlug?.toLowerCase() === "projector",
    );
    const list =
      luz === "luz"
        ? base.filter((p) => (p.specs?.ansi || 0) >= 900)
        : base.filter(
            (p) => (p.specs?.ansi || 0) >= 400 && (p.specs?.ansi || 0) < 900,
          );
    setRecos({ luz, list: list.slice(0, 2) });
    setScreen("recos");
  };

  // Si el producto abierto cambia en vivo (onSnapshot), refrescamos la ficha.
  useEffect(() => {
    if (!sel) return;
    const updated = catalogo.find((p) => p.id === sel.id);
    if (updated && updated !== sel) setSel(updated);
  }, [catalogo, sel]);

  // Reloj vivo: la tablet queda encendida días; refresca fecha y promo cada minuto.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const vacio = !loading && !error && catalogo.length === 0;
  const hoy = now.toLocaleDateString("es-NI", { weekday: "short", day: "numeric", month: "short" });
  const promoActiva = now <= new Date(PROMO.hasta + "T23:59:59");

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-zinc-900 flex flex-col font-sans">
          {/* Top bar */}
          <div className="sticky top-0 z-10 flex items-center gap-4 px-5 py-3 bg-white dark:bg-zinc-900 border-b border-stone-200 dark:border-zinc-800 shadow-sm dark:shadow-zinc-950">
            <button onClick={() => setScreen("home")} className="flex items-center">
              <img src="/Logo Panda Store.png" alt="PandaStore" className="h-8 w-auto" />
            </button>
            <div className="flex gap-1.5 ml-2">
              {activeCats.map(({ label, slug }) => (
                <button
                  key={slug}
                  onClick={() => { setCat(slug); setQuery(""); setScreen("catalog"); }}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
                    cat === slug
                      ? "bg-cyan-500 text-white shadow-sm"
                      : "bg-stone-100 dark:bg-zinc-700 text-stone-400 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-600"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {/* Búsqueda global: siempre a un tap, sin entrar al catálogo. */}
            <div className="relative flex-1 max-w-xs ml-1">
              <Search size={14} className="absolute left-2.5 top-2.5 text-stone-400 dark:text-zinc-500" />
              <input
                value={gq}
                onChange={(e) => setGq(e.target.value)}
                placeholder="Buscar modelo…"
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-stone-400 dark:placeholder:text-zinc-500 outline-none focus:border-cyan-500 dark:focus:border-cyan-500 transition-colors"
              />
              {gResults.length > 0 && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setGq("")} />
                  <div className="absolute left-0 right-0 top-10 z-20 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl shadow-xl overflow-hidden">
                    {gResults.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => openFicha(p)}
                        className="w-full min-h-[48px] text-left px-3 py-2.5 text-sm flex items-center justify-between gap-2 hover:bg-stone-100 dark:hover:bg-zinc-700 border-b last:border-b-0 border-stone-100 dark:border-zinc-700"
                      >
                        <span className={`truncate font-medium text-zinc-900 dark:text-zinc-100 ${!p.disponible ? "opacity-50" : ""}`}>
                          {p.name}
                        </span>
                        <span className="shrink-0 text-xs">
                          {!p.disponible ? (
                            <span className="text-red-500 dark:text-red-400 font-semibold">Agotado</span>
                          ) : p.precio?.actual != null ? (
                            <span className="text-cyan-600 dark:text-cyan-400 font-bold">{cordobas(p.precio.actual)}</span>
                          ) : null}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-stone-500 dark:text-zinc-400 font-medium capitalize">{hoy}</span>
              {promoActiva && (
                <div className="text-xs bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-lg font-medium">
                  {PROMO.texto}
                </div>
              )}
              <button
                onClick={toggleDark}
                className="p-1.5 rounded-lg bg-stone-100 dark:bg-zinc-700 text-stone-500 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-600 transition-colors"
                title={dark ? "Modo claro" : "Modo oscuro"}
              >
                {dark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-auto px-6 py-6 dark:text-zinc-100">
            {loading && <Cargando />}
            {!loading && error && <ErrorState msg={error} />}
            {vacio && <VacioState />}

            {!loading && !error && !vacio && (
              <>
                {screen === "home" && (
                  <Home
                    onCatalog={() => setScreen("catalog")}
                    onGuided={() => setScreen("g1")}
                  />
                )}

                {screen === "g1" && (
                  <Guided step={1} onBack={() => setScreen("home")}>
                    <Opt
                      icon={<Building2 size={26} />}
                      title="Profesional / Educativo"
                      sub="Iglesias, hoteles, bares, escuelas"
                      onClick={() => setScreen("g2")}
                    />
                    <Opt
                      icon={<Popcorn size={26} />}
                      title="Entretenimiento en casa"
                      sub="Cine, partidos, series"
                      onClick={() => setScreen("g2")}
                    />
                  </Guided>
                )}

                {screen === "g2" && (
                  <Guided
                    step={2}
                    titulo="¿Cómo es la luz del lugar?"
                    sub="La pregunta que evita la devolución #1."
                    onBack={() => setScreen("g1")}
                  >
                    <Opt
                      icon={<Moon size={26} />}
                      title="Se puede oscurecer"
                      sub="Cortinas, de noche, poca luz"
                      onClick={() => recommend("oscuro")}
                    />
                    <Opt
                      icon={<Sun size={26} />}
                      title="Con luz o ventanas"
                      sub="Abierto, de día, mucha claridad"
                      onClick={() => recommend("luz")}
                    />
                  </Guided>
                )}

                {screen === "recos" && recos && (
                  <div>
                    <BackBtn onClick={() => setScreen("home")} />
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">Recomendación</h2>
                    <p className="text-stone-500 dark:text-zinc-400 mb-5">
                      {recos.luz === "luz"
                        ? "El lugar tiene luz: solo modelos brillantes (≥900 ANSI), para evitar una devolución."
                        : "Cuarto que se oscurece: excelente imagen sin pagar de más por brillo que no necesita."}
                    </p>
                    {recos.list.length === 0 ? (
                      <p className="text-stone-400 text-sm">
                        No hay modelos cargados para este caso todavía. Probá el catálogo completo.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        {recos.list.map((p) => (
                          <PCard key={p.id} p={p} onClick={() => openFicha(p)} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {screen === "catalog" && (
                  <div>
                    <BackBtn onClick={() => setScreen("home")} />
                    <div className="relative mb-5">
                      <Search size={18} className="absolute left-3 top-3.5 text-stone-400" />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Buscar modelo… (ej. HY350)"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 outline-none focus:border-zinc-900 dark:focus:border-zinc-400"
                      />
                    </div>
                    {filtered.length === 0 ? (
                      <p className="text-stone-400 text-sm">
                        Sin resultados{query ? ` para "${query}"` : ""}.
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3">
                        {filtered.map((p) => (
                          <PCard key={p.id} p={p} onClick={() => openFicha(p)} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {screen === "ficha" && sel && (
                  <Ficha
                    p={sel}
                    objeciones={objecionesDe(sel, universales, porCategoria)}
                    onBack={() => setScreen("catalog")}
                    onObj={(o) => setDrawer(o)}
                    onDemo={() => setDemo(true)}
                  />
                )}
              </>
            )}
          </div>

          {/* Drawer objeciones */}
          {drawer && <ObjecionDrawer obj={drawer} onClose={() => setDrawer(null)} />}

          {/* Modo demo */}
          {demo && sel && <Demo p={sel} onClose={() => setDemo(false)} onHome={() => { setDemo(false); setScreen("home"); }} />}
    </div>
  );
}
