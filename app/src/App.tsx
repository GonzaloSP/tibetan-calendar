import { useMemo, useState } from "react";
import { addMonths, startOfMonth } from "date-fns";
import { MandalaHeader } from "./components/MandalaHeader";
import { MonthNav } from "./components/MonthNav";
import { MonthGrid } from "./components/MonthGrid";
import { DayDetails } from "./components/DayDetails";
import { BottomSheet } from "./components/BottomSheet";
import { toTibetanDate } from "./lib/tibetan";

function useIsSmallScreen() {
  const [isSmall, setIsSmall] = useState(() => window.matchMedia("(max-width: 1023px)").matches);
  useMemo(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const handler = () => setIsSmall(mq.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);
  return isSmall;
}

export default function App() {
  const isSmall = useIsSmallScreen();

  const [monthStart, setMonthStart] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => new Date());
  const [sheetOpen, setSheetOpen] = useState(false);

  const tib = useMemo(() => toTibetanDate(selected), [selected]);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-3 sm:px-4 py-5 sm:py-8">
        <MandalaHeader
          right={
            <div className="hidden md:block">
              <div className="rounded-2xl bg-white/10 px-3 py-2 text-xs text-white/80 ring-1 ring-white/10">
                Base gregoriana · Correspondencia tibetana
              </div>
            </div>
          }
        />

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.25fr_0.9fr]">
          <div>
            <div className="mb-4">
              <div className="frame rounded-3xl bg-gradient-to-br from-ink-900 via-maroon-900 to-ink-900 p-4 sm:p-5 text-white shadow-glow">
                <MonthNav
                  monthStart={monthStart}
                  onPrev={() => setMonthStart((d) => addMonths(d, -1))}
                  onNext={() => setMonthStart((d) => addMonths(d, 1))}
                  onToday={() => {
                    const now = new Date();
                    setMonthStart(startOfMonth(now));
                    setSelected(now);
                    if (isSmall) setSheetOpen(true);
                  }}
                />
              </div>
            </div>

            <MonthGrid
              monthStart={monthStart}
              selected={selected}
              onSelect={(d) => {
                setSelected(d);
                if (isSmall) setSheetOpen(true);
              }}
            />
          </div>

          {/* Desktop details */}
          <div className="hidden lg:block">
            <DayDetails date={selected} tib={tib} />
          </div>
        </div>

        {/* Mobile bottom-sheet details */}
        <BottomSheet open={isSmall && sheetOpen} onClose={() => setSheetOpen(false)}>
          <div className="lg:hidden">
            <DayDetails date={selected} tib={tib} onClose={() => setSheetOpen(false)} />
          </div>
        </BottomSheet>
      </div>
    </div>
  );
}
