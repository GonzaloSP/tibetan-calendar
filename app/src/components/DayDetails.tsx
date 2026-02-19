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
  Share2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { TibetanDate, PracticeImage } from "../lib/types";
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

function PracticeBody(props: { description: string; tibetanName?: string; image?: PracticeImage }) {
  const { description, tibetanName, image } = props;
  const [imgOk, setImgOk] = useState(true);

  const paragraphs = useMemo(() => {
    return (description || '')
      .split("\n\n")
      .map((p) => p.trim())
      .filter(Boolean);
  }, [description]);

  return (
    <div className="prose prose-sm mt-3 max-w-none text-ink-900 prose-p:my-2">
      {tibetanName ? (
        <div className="mb-2 text-xs text-ink-900">
          <span className="font-semibold">Nombre tibetano:</span>{" "}
          <span className="font-tibetan text-base">{tibetanName}</span>
        </div>
      ) : null}

      {image?.url && imgOk ? (
        <div className="mb-3">
          <img
            src={image.url}
            alt=""
            loading="lazy"
            className="w-full max-w-[360px] rounded-xl border border-black/10"
            onError={() => setImgOk(false)}
          />
          <div className="mt-1 text-[11px] text-ink-800/60">
            {image.creditEs}
            {image.creditUrl ? (
              <>
                {" "}
                <a
                  href={image.creditUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  (ver fuente)
                </a>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {paragraphs.map((para, i) => {
        const lines = para.split("\n");
        return (
          <p key={i}>
            {lines.map((line, j) => {
              const isBullet = /^-\s+/.test(line);
              const text = line.replace(/^-\s+/, "");
              return (
                <span key={j}>
                  {isBullet ? (
                    <span className="mr-1 inline-block align-baseline text-[0.9em] text-gold-700">
                      ☸
                    </span>
                  ) : null}
                  {text}
                  {j < lines.length - 1 ? <br /> : null}
                </span>
              );
            })}
          </p>
        );
      })}
    </div>
  );
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

function upsertMeta(selector: string, attrs: Record<string, string>) {
  let el = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    for (const [k, v] of Object.entries(attrs)) {
      el.setAttribute(k, v);
    }
    document.head.appendChild(el);
    return;
  }
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
}

function setSocialMeta(params: {
  title: string;
  description: string;
  image?: string;
  url: string;
}) {
  const { title, description, image, url } = params;
  document.title = title;

  upsertMeta('meta[name="description"]', { name: "description", content: description });

  upsertMeta('meta[property="og:title"]', { property: "og:title", content: title });
  upsertMeta('meta[property="og:description"]', { property: "og:description", content: description });
  upsertMeta('meta[property="og:url"]', { property: "og:url", content: url });
  if (image) upsertMeta('meta[property="og:image"]', { property: "og:image", content: image });

  upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title });
  upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });
  if (image) upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: image });
}

export function DayDetails(props: {
  date: Date;
  tib: TibetanDate;
  onClose?: () => void;
}) {
  const { date, tib } = props;
  const practices = getPracticesForDate(date, tib);

  const shareUrl = useMemo(() => {
    // Prefer pretty, prerendered path for social previews.
    const d = format(date, "yyyy-MM-dd");
    const u = new URL(window.location.href);
    u.pathname = `/day/${d}`;
    u.search = "";
    u.hash = "";
    return u.toString();
  }, [date]);

  const primary = practices[0];

  useEffect(() => {
    const title = primary
      ? `${primary.name} — Calendario Tibetano en Español`
      : `Calendario Tibetano en Español — ${format(date, "d 'de' MMMM 'de' yyyy", { locale: es })}`;

    const rawDesc = primary?.description || "Calendario tibetano en español: días de Buda, tsog, preceptos, aniversarios de maestros y prácticas mensuales.";
    const description = rawDesc
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 200);

    const image = primary?.image?.url;

    setSocialMeta({
      title,
      description,
      image,
      url: shareUrl,
    });
  }, [date, primary, shareUrl]);

  async function onShare() {
    const title = primary?.name || "Calendario Tibetano en Español";
    const text = primary?.description?.split("\n")[0] || "";

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
        return;
      } catch {
        // fall through to links
      }
    }

    // Fallback: open a simple share menu via new tabs.
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(`${title}\n${shareUrl}`);

    // WhatsApp
    window.open(`https://wa.me/?text=${encodedText}`, "_blank", "noopener,noreferrer");

    // Facebook (share URL only)
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, "_blank", "noopener,noreferrer");
  }

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

        <div className="flex items-center gap-2">
          <button
            onClick={onShare}
            className="rounded-2xl bg-maroon-900 px-3 py-2 text-sm font-semibold text-white hover:bg-maroon-800 ring-1 ring-gold-200/30 shadow-sm"
            title="Compartir en redes sociales"
          >
            <span className="inline-flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Compartir en redes sociales
            </span>
          </button>

          {props.onClose ? (
            <button
              onClick={props.onClose}
              className="rounded-2xl bg-maroon-900 px-3 py-2 text-sm font-semibold text-white hover:bg-maroon-800 ring-1 ring-gold-200/20"
            >
              Cerrar
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-6">
        <div className="text-xs font-semibold text-ink-800/60">
          Prácticas y celebraciones
        </div>

        {practices.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-black/5 bg-white p-4 text-sm text-ink-800/70">
            No hay prácticas especiales listadas para este día, tal vez es un buen día para realizar tu práctica habitual.
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
                    {p.kind === "celebration"
                      ? p.type === "PARINIRVANA"
                        ? "Parinirvana"
                        : "Celebración"
                      : "Práctica"}
                  </span>
                </div>

                <PracticeBody description={p.description} tibetanName={p.tibetanName} image={p.image} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Fuente de datos ocultada */}
    </div>
  );
}
