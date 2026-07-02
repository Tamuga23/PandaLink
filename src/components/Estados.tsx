import { Loader2, WifiOff, PackageX, RefreshCw } from "lucide-react";

export function Cargando() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-stone-400 gap-3">
      <Loader2 size={36} className="animate-spin" />
      <p className="text-sm">Cargando catálogo…</p>
    </div>
  );
}

export function ErrorState({ msg }: { msg: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-8 gap-3">
      <WifiOff size={36} className="text-red-500" />
      <h3 className="text-lg font-bold text-zinc-900 dark:text-white">No se pudo cargar</h3>
      <p className="text-sm text-stone-500 max-w-md">{msg}</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-2 flex items-center gap-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg px-5 py-3 text-sm font-bold hover:opacity-90 transition-opacity"
      >
        <RefreshCw size={16} /> Reintentar
      </button>
    </div>
  );
}

export function VacioState() {
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
