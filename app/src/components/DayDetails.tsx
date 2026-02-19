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

function WhatsAppLogo(props: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden className={props.className}>
      <path d="M19.11 17.07c-.29-.14-1.72-.85-1.98-.95-.26-.1-.45-.14-.64.14-.19.29-.74.95-.91 1.15-.17.19-.33.21-.62.07-.29-.14-1.21-.45-2.31-1.43-.86-.76-1.44-1.7-1.61-1.99-.17-.29-.02-.45.13-.59.13-.13.29-.33.43-.5.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.14-.64-1.54-.88-2.11-.23-.55-.47-.48-.64-.49l-.55-.01c-.19 0-.5.07-.76.36-.26.29-1 0.98-1 2.38 0 1.39 1.02 2.74 1.16 2.93.14.19 2.01 3.07 4.87 4.31.68.29 1.21.46 1.63.59.69.22 1.32.19 1.82.12.55-.08 1.72-.7 1.96-1.38.24-.67.24-1.25.17-1.38-.07-.12-.26-.19-.55-.33z" />
      <path d="M16 2.67C8.64 2.67 2.67 8.64 2.67 16c0 2.34.61 4.62 1.78 6.64L3.33 29.33l6.87-1.08A13.26 13.26 0 0 0 16 29.33c7.36 0 13.33-5.97 13.33-13.33S23.36 2.67 16 2.67zm0 24.33c-2.02 0-3.99-.54-5.7-1.56l-.41-.24-4.08.64.72-3.97-.26-.41A11.26 11.26 0 0 1 4.75 16C4.75 9.79 9.79 4.75 16 4.75S27.25 9.79 27.25 16 22.21 27 16 27z" />
    </svg>
  );
}

function FacebookLogo(props: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden className={props.className}>
      <path d="M16 2.67C8.64 2.67 2.67 8.64 2.67 16c0 6.66 4.88 12.18 11.25 13.2V19.83h-3.4V16h3.4v-2.92c0-3.36 2-5.22 5.07-5.22 1.47 0 3.01.26 3.01.26v3.31h-1.7c-1.68 0-2.2 1.04-2.2 2.11V16h3.74l-.6 3.83h-3.14v9.37C24.45 28.18 29.33 22.66 29.33 16c0-7.36-5.97-13.33-13.33-13.33z" />
    </svg>
  );
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

  function onShareWhatsApp() {
    const title = primary?.name || "Calendario Tibetano en Español";
    const encodedText = encodeURIComponent(`${title}\n${shareUrl}`);
    window.open(`https://wa.me/?text=${encodedText}`, "_blank", "noopener,noreferrer");
  }

  function onShareFacebook() {
    const encodedUrl = encodeURIComponent(shareUrl);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      "_blank",
      "noopener,noreferrer"
    );
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

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            onClick={onShareWhatsApp}
            className="rounded-2xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500 ring-1 ring-emerald-200/30 shadow-sm"
            title="Compartir por WhatsApp"
          >
            <span className="inline-flex items-center gap-2">
              <WhatsAppLogo className="h-4 w-4" />
              WhatsApp
            </span>
          </button>

          <button
            onClick={onShareFacebook}
            className="rounded-2xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 ring-1 ring-blue-200/30 shadow-sm"
            title="Compartir en Facebook"
          >
            <span className="inline-flex items-center gap-2">
              <FacebookLogo className="h-4 w-4" />
              Facebook
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
