import type { ReactNode } from "react";
import { Search, MessageSquare, ChevronRight } from "lucide-react";

export function Home({ onCatalog, onGuided }: { onCatalog: () => void; onGuided: () => void }) {
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
