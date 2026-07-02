import { ArrowLeft } from "lucide-react";

export function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-sm text-stone-600 dark:text-zinc-400 mb-4 hover:text-zinc-900 dark:hover:text-white"
    >
      <ArrowLeft size={16} /> Volver
    </button>
  );
}
