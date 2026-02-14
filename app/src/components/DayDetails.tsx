import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Flame,
  Moon,
  Sparkles,
  Shield,
  Heart,
  ScrollText,
} from "lucide-react";
import type { TibetanDate } from "../lib/types";
import { formatTibetanDate } from "../lib/tibetan";
import { getPracticesForDate, practiceBadgeColor } from "../lib/practices";

function iconForType(type: string) {
  switch (type) {
    case "BUDDHA_DAY":
      return <Flame className="h-4 w-4" />;
    case "MOON":
      return <Moon className="h-4 w-4" />;
    case "TSOG":
      return <Sparkles className="h-4 w-4" />;
    case "TARA":
      return <Heart className="h-4 w-4" />;
    case "PRECEPTS":
      return <ScrollText className="h-4 w-4" />;
    case "PROTECTOR_PUJA":
      return <Shield className="h-4 w-4" />;
    case "PARINIRVANA":
      return <Sparkles className="h-4 w-4" />;
    default:
      return <CalendarDays className="h-4 w-4" />;
  }
}

function labelForType(type: string) {
  switch (type) {
    case "BUDDHA_DAY":
      return "Día de Buda";
    case "MOON":
      return "Luna";
    case "TSOG":
      return "Tsog";
    case "TARA":
      return "Tara";
    case "MEDICINE_BUDDHA":
      return "Buda de la Medicina";
    case "PRECEPTS":
      return "Preceptos";
    case "PROTECTOR_PUJA":
      return "Puja de protectores";
    case "PARINIRVANA":
      return "Parinirvana";
    default:
      return "Otro";
  }
}

export function DayDetails(props: {
  date: Date;
  tib: TibetanDate;
  onClose?: () => void;
}) {
  const { date, tib } = props;
  const practices = getPracticesForDate(date, tib);

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-ink-800/60">Día seleccionado</div>
          <div className="font-display text-xl sm:text-2xl tracking-tight">
            {format(date, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
          </div>
          <div className="mt-1 text-sm text-ink-800/70">
            {formatTibetanDate(tib)}
          </div>
        </div>

        {props.onClose ? (
          <button
            onClick={props.onClose}
            className="rounded-2xl bg-maroon-900 px-3 py-2 text-sm font-semibold text-white hover:bg-maroon-800 ring-1 ring-gold-200/20"
          >
            Cerrar
          </button>
        ) : null}
      </div>

      <div className="mt-6">
        <div className="text-xs font-semibold text-ink-800/60">
          Prácticas y celebraciones
        </div>

        {practices.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-black/5 bg-white p-4 text-sm text-ink-800/70">
            No hay prácticas especiales listadas para este día según las reglas extraídas.
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {practices.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl border border-black/5 bg-white p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={
                        "grid h-9 w-9 place-items-center rounded-2xl border " +
                        practiceBadgeColor(p.type)
                      }
                      aria-hidden
                    >
                      {iconForType(p.type)}
                    </div>
                    <div>
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-xs text-ink-800/60">{labelForType(p.type)}</div>
                    </div>
                  </div>

                  <span className={"chip " + practiceBadgeColor(p.type)}>
                    {iconForType(p.type)}
                    {p.kind === "celebration" ? "Celebración" : "Práctica"}
                  </span>
                </div>

                <div className="prose prose-sm mt-3 max-w-none text-ink-900 prose-p:my-2">
                  <p>{p.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Fuente de datos ocultada */}
    </div>
  );
}
