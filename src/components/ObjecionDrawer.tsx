import { X } from "lucide-react";
import type { Objecion } from "../types";

// Drawer inferior con la respuesta lista para leerle al cliente.
export function ObjecionDrawer({ obj, onClose }: { obj: Objecion; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-20 bg-black/40 flex items-end"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-800 w-full rounded-t-2xl p-6 max-h-[78%] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{obj.pregunta}</h3>
          <button
            onClick={onClose}
            className="shrink-0 border border-stone-200 dark:border-zinc-600 dark:text-zinc-300 rounded-lg px-3 py-1.5 text-sm"
          >
            <X size={16} />
          </button>
        </div>
        <p className="text-xs text-stone-400 mt-1">
          Respuesta lista para leerle al cliente · en la voz de Carlos
        </p>
        <div className="mt-3 bg-stone-50 dark:bg-zinc-700 border-l-4 border-zinc-800 dark:border-zinc-400 rounded-r-xl p-4 text-zinc-800 dark:text-zinc-100 leading-relaxed">
          {obj.respuesta}
        </div>
      </div>
    </div>
  );
}
