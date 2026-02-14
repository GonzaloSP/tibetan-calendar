import { addDays, format, startOfMonth, startOfWeek, endOfMonth, endOfWeek, isSameMonth, isSameDay } from "date-fns";
import { motion } from "framer-motion";
import { toTibetanDate } from "../lib/tibetan";
import { getPracticesForDate } from "../lib/practices";
import type { TibetanDate } from "../lib/types";

export type DayCell = {
  date: Date;
  tib: TibetanDate;
  count: number;
};

export function buildMonthGrid(monthStart: Date): DayCell[] {
  const start = startOfWeek(startOfMonth(monthStart), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 });

  const cells: DayCell[] = [];
  let d = start;
  while (d <= end) {
    const tib = toTibetanDate(d);
    const practices = getPracticesForDate(d, tib);
    cells.push({ date: d, tib, count: practices.length });
    d = addDays(d, 1);
  }
  return cells;
}

export function MonthGrid(props: {
  monthStart: Date;
  selected: Date;
  onSelect: (d: Date) => void;
}) {
  const { monthStart, selected, onSelect } = props;
  const cells = buildMonthGrid(monthStart);
  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  return (
    <div className="card p-3 sm:p-5">
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold text-ink-800/70">
        {weekDays.map((d) => (
          <div key={d} className="px-2 py-1">{d}</div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1.5 sm:gap-2">
        {cells.map((c) => {
          const inMonth = isSameMonth(c.date, monthStart);
          const isSelected = isSameDay(c.date, selected);
          const hasEvents = c.count > 0;
          return (
            <motion.button
              key={c.date.toISOString()}
              layout
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(c.date)}
              className={
                "relative rounded-2xl border px-2 py-2 text-left transition-colors min-h-[56px] sm:min-h-[74px] " +
                (isSelected
                  ? "border-maroon-900 bg-maroon-900 text-white shadow-soft"
                  : "border-black/5 bg-white/60 hover:bg-white")
              }
            >
              <div className={"flex items-start justify-between gap-2 " + (!inMonth ? "opacity-55" : "")}
              >
                <div className="text-sm font-semibold leading-none">
                  {format(c.date, "d")}
                </div>
                {hasEvents ? (
                  <div
                    className={
                      "grid h-6 min-w-6 place-items-center rounded-full text-[11px] font-bold " +
                      (isSelected
                        ? "bg-white/15 text-white"
                        : "bg-saffron-50 text-saffron-600 border border-saffron-600/20")
                    }
                    aria-label={`${c.count} eventos`}
                  >
                    {c.count}
                  </div>
                ) : null}
              </div>

              <div className={"mt-2 text-[11px] leading-tight " + (isSelected ? "text-white/80" : "text-ink-800/60")}
              >
                M{c.tib.tibMonth} · D{c.tib.tibDay}{c.tib.isLeapDay ? "*" : ""}
              </div>

              {/* subtle dot */}
              {hasEvents ? (
                <div
                  className={
                    "absolute bottom-2 left-2 h-1.5 w-1.5 rounded-full " +
                    (isSelected ? "bg-gold-200" : "bg-lotus-500")
                  }
                />
              ) : null}

              {/* today ring */}
              {isSameDay(c.date, new Date()) ? (
                <div
                  className={
                    "pointer-events-none absolute inset-0 rounded-2xl ring-2 " +
                    (isSelected ? "ring-white/30" : "ring-jade-500/40")
                  }
                />
              ) : null}
            </motion.button>
          );
        })}
      </div>

      <div className="mt-4 text-xs text-ink-800/60">
        <span className="font-semibold">Consejo:</span> “D*” marca un día tibetano repetido.
      </div>
    </div>
  );
}
