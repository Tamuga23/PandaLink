import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Search,
  MessageSquare,
  ArrowLeft,
  Tv,
  Sparkles,
  ChevronRight,
  X,
  Sun,
  Moon,
  Building2,
  Popcorn,
  Loader2,
  WifiOff,
  PackageX,
} from "lucide-react";
import { usePandaData } from "./hooks/usePandaData";
import type { Bullet, Objecion, Producto } from "./types";

/* ============================================================================
   PandaLink — Panda Asesor (app de tablet, solo lectura)
   Lee catalogo_publico + objeciones_universales desde Firestore (onSnapshot).
   ========================================================================== */

// throwRatio puede venir número (1.0) o texto ("1.0:1"); distMin "0.9" o "0.9m".
const toNum = (v: unknown): number => {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const m = v.match(/[\d.]+/);
    return m ? parseFloat(m[0]) : NaN;
  }
  return NaN;
};

const USD_TO_NIO = 36.6243;
const cordobas = (n: number | null | undefined): string =>
  "C$" + Number((n ?? 0) * USD_TO_NIO).toLocaleString("es-NI", { maximumFractionDigits: 2 });

const K = 45.17; // constante 16:9 validada contra ficha del fabricante

// Mezcla universal + override por modelo (override gana).
function objecionesDe(producto: Producto, universales: Objecion[]): Objecion[] {
  const map = new Map<string, Objecion>(
    universales.map((o): [string, Objecion] => [o.id, o]),
  );
  (producto.objecionesOverride || []).forEach((o) => map.set(o.id, o));
  return Array.from(map.values()).sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99));
}

type Screen = "home" | "g1" | "g2" | "recos" | "catalog" | "ficha";
interface Recos {
  luz: string;
  list: Producto[];
}

export default function App() {
  const { catalogo, universales, loading, error } = usePandaData();
  const [screen, setScreen] = useState<Screen>("home");
  const [sel, setSel] = useState<Producto | null>(null);
  const [drawer, setDrawer] = useState<Objecion | null>(null);
  const [demo, setDemo] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("projector");

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };
  const [recos, setRecos] = useState<Recos | null>(null);
  const [empujon, setEmpujon] = useState(false);

  const openFicha = (p: Producto) => {
    setSel(p);
    setEmpujon(false);
    setScreen("ficha");
  };

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
    const list =
      luz === "luz"
        ? catalogo.filter((p) => (p.specs?.ansi || 0) >= 900)
        : catalogo.filter(
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

  const vacio = !loading && !error && catalogo.length === 0;

  return (
    <div className={`min-h-screen bg-stone-100 dark:bg-zinc-950 flex items-center justify-center p-3 font-sans${dark ? " dark" : ""}`}>
      <div className="w-full max-w-5xl bg-zinc-900 rounded-3xl p-3 shadow-2xl">
        <div
          className="relative bg-stone-50 dark:bg-zinc-900 rounded-2xl overflow-hidden"
          style={{ height: "740px" }}
        >
          {/* Top bar */}
          <div className="flex items-center gap-4 px-5 py-3 bg-white dark:bg-zinc-800 border-b border-stone-200 dark:border-zinc-700">
            <div className="flex items-center">
              <img src="/Logo Panda Store.png" alt="PandaStore" className="h-8 w-auto" />
            </div>
            <div className="flex gap-1.5 ml-2">
              {([
                { label: "Proyectores", slug: "projector" },
                { label: "Smartwatch", slug: "smartwatch" },
                { label: "Cámaras", slug: "security-cam" },
                { label: "Parlantes", slug: "speaker" },
              ] as { label: string; slug: string }[]).map(({ label, slug }) => (
                <button
                  key={slug}
                  onClick={() => { setCat(slug); setQuery(""); setScreen("catalog"); }}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
                    cat === slug
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                      : "bg-stone-100 dark:bg-zinc-700 text-stone-400 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-600"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="text-xs bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-lg font-medium">
                🎯 Mundial 2026
              </div>
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
          <div className="overflow-auto px-6 py-6 dark:text-zinc-100" style={{ height: "672px" }}>
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
                      <div className="grid grid-cols-4 gap-3">
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
                    objeciones={objecionesDe(sel, universales)}
                    onBack={() => setScreen("catalog")}
                    onObj={(o) => setDrawer(o)}
                    onDemo={() => setDemo(true)}
                    empujon={empujon}
                    setEmpujon={setEmpujon}
                  />
                )}
              </>
            )}
          </div>

          {/* Drawer objeciones */}
          {drawer && (
            <div
              className="absolute inset-0 bg-black/40 flex items-end"
              onClick={() => setDrawer(null)}
            >
              <div
                className="bg-white dark:bg-zinc-800 w-full rounded-t-2xl p-6 max-h-[78%] overflow-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{drawer.pregunta}</h3>
                  <button
                    onClick={() => setDrawer(null)}
                    className="shrink-0 border border-stone-200 dark:border-zinc-600 dark:text-zinc-300 rounded-lg px-3 py-1.5 text-sm"
                  >
                    <X size={16} />
                  </button>
                </div>
                <p className="text-xs text-stone-400 mt-1">
                  Respuesta lista para leerle al cliente · en la voz de Carlos
                </p>
                <div className="mt-3 bg-stone-50 dark:bg-zinc-700 border-l-4 border-zinc-800 dark:border-zinc-400 rounded-r-xl p-4 text-zinc-800 dark:text-zinc-100 leading-relaxed">
                  {drawer.respuesta}
                </div>
              </div>
            </div>
          )}

          {/* Modo demo */}
          {demo && sel && <Demo p={sel} onClose={() => setDemo(false)} />}
        </div>
      </div>
    </div>
  );
}

function Cargando() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-stone-400 gap-3">
      <Loader2 size={36} className="animate-spin" />
      <p className="text-sm">Cargando catálogo…</p>
    </div>
  );
}

function ErrorState({ msg }: { msg: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-8 gap-3">
      <WifiOff size={36} className="text-red-500" />
      <h3 className="text-lg font-bold text-zinc-900 dark:text-white">No se pudo cargar</h3>
      <p className="text-sm text-stone-500 max-w-md">{msg}</p>
    </div>
  );
}

function VacioState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-8 gap-3">
      <PackageX size={36} className="text-stone-400" />
      <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Catálogo vacío</h3>
      <p className="text-sm text-stone-500 max-w-md">
        La colección <code className="bg-stone-100 px-1 rounded">catalogo_publico</code> no
        tiene productos todavía.
      </p>
    </div>
  );
}

function Home({ onCatalog, onGuided }: { onCatalog: () => void; onGuided: () => void }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">¿Cómo llega el cliente?</h2>
      <p className="text-stone-500 dark:text-zinc-400 mb-6">Los dos caminos terminan en la misma ficha de cierre.</p>
      <div className="grid grid-cols-2 gap-5">
        <Choice
          icon={<Search size={28} />}
          title="Ya sabe qué quiere"
          desc={'"Vengo por el HY350 Max" o "el del anuncio". Buscá el modelo y mostrale la ficha.'}
          cta="Buscar modelo"
          onClick={onCatalog}
        />
        <Choice
          icon={<MessageSquare size={28} />}
          title="Busca uno pero no sabe cuál"
          desc="Te hago las preguntas correctas para recomendarle el ideal en 2 pasos."
          cta="Iniciar asistente"
          onClick={onGuided}
        />
      </div>
    </div>
  );
}

function Choice({
  icon,
  title,
  desc,
  cta,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-2xl p-6 hover:border-zinc-900 dark:hover:border-zinc-400 hover:shadow-lg transition-all min-h-[200px] flex flex-col"
    >
      <div className="text-zinc-900 dark:text-zinc-100">{icon}</div>
      <h3 className="text-lg font-bold text-zinc-900 dark:text-white mt-3 mb-1">{title}</h3>
      <p className="text-stone-500 dark:text-zinc-400 text-sm flex-1">{desc}</p>
      <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-3 flex items-center gap-1">
        {cta} <ChevronRight size={16} />
      </div>
    </button>
  );
}

function Guided({
  step,
  titulo,
  sub,
  children,
  onBack,
}: {
  step: number;
  titulo?: string;
  sub?: string;
  children: ReactNode;
  onBack: () => void;
}) {
  return (
    <div>
      <BackBtn onClick={onBack} />
      <p className="text-xs text-stone-400 mb-2">Asistente · paso {step} de 2</p>
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">
        {titulo || "¿Para qué lo va a usar?"}
      </h2>
      <p className="text-stone-500 dark:text-zinc-400 mb-5">
        {sub || "Esto define la pregunta clave del siguiente paso."}
      </p>
      <div className="grid grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function Opt({
  icon,
  title,
  sub,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl p-5 hover:border-zinc-900 dark:hover:border-zinc-400 hover:bg-stone-50 dark:hover:bg-zinc-700 transition-all"
    >
      <div className="text-zinc-900 dark:text-zinc-100 mb-2">{icon}</div>
      <div className="font-semibold text-zinc-900 dark:text-zinc-100">{title}</div>
      <div className="text-stone-500 text-sm mt-0.5">{sub}</div>
    </button>
  );
}

function PCard({ p, onClick }: { p: Producto; onClick: () => void }) {
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
      <div className="font-bold text-zinc-900 dark:text-white">
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

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-sm text-stone-600 dark:text-zinc-400 mb-4 hover:text-zinc-900 dark:hover:text-white"
    >
      <ArrowLeft size={16} /> Volver
    </button>
  );
}

function Ficha({
  p,
  objeciones,
  onBack,
  onObj,
  onDemo,
  empujon,
  setEmpujon,
}: {
  p: Producto;
  objeciones: Objecion[];
  onBack: () => void;
  onObj: (o: Objecion) => void;
  onDemo: () => void;
  empujon: boolean;
  setEmpujon: (v: boolean) => void;
}) {
  const [dist, setDist] = useState(2.5);
  const [size, setSize] = useState(100);

  const foto = p.media?.heroImage ?? p.media?.fotos?.[0];
  const tr = toNum(p.specs?.throwRatio);
  const dmin = toNum(p.specs?.distMinEnfoque);
  const pulg = Number.isNaN(tr) ? null : Math.round((dist / tr) * K);
  const distNec = Number.isNaN(tr) ? null : ((size * tr) / K).toFixed(1);
  const chico = !Number.isNaN(dmin) && dist < dmin;

  const reg = p.precio?.regular ?? 0;
  const act = p.precio?.actual ?? 0;
  const efe = p.precio?.efectivo ?? 0;
  const hasDisc = (p.precio?.descEfectivoPct ?? 0) > 0;

  return (
    <div>
      <BackBtn onClick={onBack} />
      <div className="grid grid-cols-2 gap-6">
        {/* Izquierda */}
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">{p.name}</h2>
          <p className="text-stone-500 mt-1 flex items-center gap-2">
            {p.beneficio}
            {p.disponible ? (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                ● Disponible
              </span>
            ) : (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 shrink-0">
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
          <p className="text-[11px] uppercase tracking-wide text-stone-400 font-bold mb-2">
            Lo que le decís al cliente
          </p>
          <ul className="space-y-2">
            {(p.bullets || []).map((b: Bullet, i: number) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="text-emerald-600">✔</span>
                <span>
                  <span className="block text-[10px] uppercase tracking-wide text-stone-400 font-semibold">
                    {b.etiqueta}
                  </span>
                  {b.texto}
                </span>
              </li>
            ))}
          </ul>
          <button
            onClick={onDemo}
            className="mt-5 w-full border-2 border-dashed border-stone-300 dark:border-zinc-600 rounded-xl py-3 font-bold text-zinc-800 dark:text-zinc-200 hover:bg-stone-50 dark:hover:bg-zinc-800 flex items-center justify-center gap-2"
          >
            <Tv size={18} /> Mostrar al cliente (girar tablet)
          </button>
        </div>

        {/* Derecha */}
        <div>
          <p className="text-[11px] uppercase tracking-wide text-stone-400 font-bold mb-2">
            Respuestas rápidas a objeciones
          </p>
          {objeciones.length === 0 ? (
            <p className="text-stone-400 text-sm">Sin objeciones cargadas todavía.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {objeciones.map((o) => (
                <button
                  key={o.id}
                  onClick={() => onObj(o)}
                  className="text-left text-[13px] font-semibold text-slate-700 dark:text-zinc-200 bg-slate-100 dark:bg-zinc-700 border border-slate-300 dark:border-zinc-600 rounded-lg px-3 py-2.5 hover:bg-slate-200 dark:hover:bg-zinc-600"
                >
                  {o.pregunta}
                </button>
              ))}
            </div>
          )}

          {/* Calculadora */}
          <p className="text-[11px] uppercase tracking-wide text-stone-400 font-bold mt-5 mb-2">
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
                className="flex-1 accent-zinc-900"
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
              <div className="text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2">
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
                className="flex-1 accent-zinc-900"
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

          {/* Precio y cierre */}
          <p className="text-[11px] uppercase tracking-wide text-stone-400 font-bold mt-5 mb-2">
            Precio y cierre
          </p>
          <div className="bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl p-4">
            {reg > act && (
              <div className="flex justify-between items-baseline py-1.5 border-b border-dashed border-stone-200 dark:border-zinc-600">
                <span className="text-sm text-stone-500">Precio regular</span>
                <span className="text-stone-400 line-through">{cordobas(reg)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline py-1.5">
              <span className="text-sm text-stone-600">Precio {hasDisc ? "con tarjeta" : "firme"}</span>
              <span className="text-lg font-bold text-zinc-900 dark:text-white">{cordobas(act)}</span>
            </div>
            {hasDisc ? (
              <div className="mt-2">
                {!empujon ? (
                  <button
                    onClick={() => setEmpujon(true)}
                    className="w-full bg-zinc-900 text-white rounded-lg py-3 font-bold flex items-center justify-center gap-2"
                  >
                    <Sparkles size={16} /> Empujón final — efectivo / transferencia
                  </button>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm text-emerald-800">Efectivo o transferencia</span>
                      <span className="text-xl font-extrabold text-emerald-700">{cordobas(efe)}</span>
                    </div>
                    <div className="text-xs text-stone-500 mt-1">
                      Ahorro de {cordobas(act - efe)}. Soltalo solo si duda en el precio.
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-[12.5px] text-amber-800">
                🔒 <b>Modelo sin descuento.</b> El precio mostrado es firme — no ofrecer rebaja.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Convierte URLs de YouTube (youtu.be/ID o ?v=ID) a URL de embed para iframe.
function toYouTubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return `https://www.youtube.com/embed${u.pathname}`;
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    return null;
  } catch {
    return null;
  }
}

function Demo({ p, onClose }: { p: Producto; onClose: () => void }) {
  const foto = p.media?.heroImage ?? p.media?.fotos?.[0];
  const embedUrl = p.media?.videoUrl ? toYouTubeEmbed(p.media.videoUrl) : null;
  return (
    <div className="absolute inset-0 bg-zinc-950 text-white flex flex-col">
      {/* Navbar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-zinc-800 shrink-0">
        <img src="/Logo Panda Store.png" alt="PandaStore" className="h-8 w-auto" />
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
        <div className="w-72 flex flex-col gap-4 shrink-0">
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
                    <span className="text-emerald-400 shrink-0">✔</span>
                    <span className="text-zinc-300">{b.texto}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Precio */}
            <div className="mt-auto pt-3 border-t border-zinc-800">
              <div className="text-2xl font-extrabold text-white">
                {cordobas(p.precio?.actual)}
              </div>
              <div className="text-xs text-zinc-500 mt-0.5">
                factura · garantía 3 meses · entrega inmediata
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
