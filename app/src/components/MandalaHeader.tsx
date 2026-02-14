import { motion } from "framer-motion";
import { CalendarDays, Compass } from "lucide-react";

export function MandalaHeader(props: {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const { title = "Calendario tibetano", subtitle = "Base gregoriana, visión tibetana", right } = props;

  return (
    <div className="frame relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-900 via-maroon-900 to-ink-900 text-white shadow-glow">
      <div className="absolute inset-0 opacity-90 bg-mandala" />
      <div className="absolute inset-0 opacity-[0.10] bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.55),transparent_55%)]" />
      <div
        className="absolute -top-24 -right-24 h-64 w-64 rounded-full border border-white/10"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.10), transparent 60%)",
        }}
      />
      <div className="relative p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="flex items-center gap-3"
            >
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 ring-1 ring-gold-200/25">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-display text-2xl sm:text-3xl tracking-tight">
                  {title}
                </h1>
                <p className="text-white/80 text-sm sm:text-base">{subtitle}</p>
              </div>
            </motion.div>
          </div>

          <div className="flex items-center gap-2">
            {right}
            <div className="hidden sm:flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 ring-1 ring-white/10">
              <CalendarDays className="h-4 w-4" />
              <span className="text-sm text-white/80">Vista mensual</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
