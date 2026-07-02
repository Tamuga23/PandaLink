import type { ReactNode } from "react";
import { BackBtn } from "./BackBtn";

export function Guided({
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

export function Opt({
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
