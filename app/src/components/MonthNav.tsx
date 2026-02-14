import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function MonthNav(props: {
  monthStart: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  const { monthStart, onPrev, onNext, onToday } = props;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <button
          className="rounded-2xl bg-white/10 px-3 py-2 text-sm text-white ring-1 ring-white/10 hover:bg-white/15 min-h-11 min-w-11"
          onClick={onPrev}
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          className="rounded-2xl bg-white/10 px-3 py-2 text-sm text-white ring-1 ring-white/10 hover:bg-white/15 min-h-11 min-w-11"
          onClick={onNext}
          aria-label="Mes siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <div className="ml-2">
          <div className="text-white font-display text-lg leading-tight">
            {format(monthStart, "MMMM yyyy", { locale: es })}
          </div>
          <div className="text-white/70 text-xs">Tocá un día para ver detalles</div>
        </div>
      </div>

      <button
        className="rounded-2xl bg-gold-200/95 px-4 py-2.5 text-sm font-semibold text-ink-900 ring-1 ring-gold-200/30 hover:bg-gold-200 min-h-11"
        onClick={onToday}
      >
        Hoy
      </button>
    </div>
  );
}
