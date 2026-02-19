import fs from 'node:fs';
import path from 'node:path';
import { CalendarTibetan } from '@hnw/date-tibetan';

const ROOT = process.cwd();
const IN_PATH = path.join(ROOT, 'shambhala_calendar.json');

function stripHtml(s = '') {
  return String(s)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\u00a0/g, ' ');
}

function stripShambhalaText(s = '') {
  let t = stripHtml(s);

  // Remove any bare URLs (we already removed shambhala URLs earlier, but keep this robust)
  t = t.replace(/https?:\/\/\S+/g, '').trim();

  // Remove sentences/clauses that mention Shambhala
  // e.g. "...meant so much to us at Shambhala Publications:" or "at Shambhala Publications"
  t = t.replace(/[^.\n]*\bShambhala\b[^.\n]*[.:]?\s*/gi, '').trim();

  // Remove common lead-ins that are now useless after removing URLs
  t = t.replace(/\b(For more information|Para m[aá]s informaci[oó]n)[^\.\n]*\.?\s*/gi, '').trim();
  t = t.replace(/\b(Please visit|Visit|You can also visit|Tambi[eé]n pod[eé]s visitar)[^\.\n]*\.?\s*/gi, '').trim();
  t = t.replace(/\bSee our guide\b[^\.\n]*\.?\s*/gi, '').trim();
  t = t.replace(/\bPlease visit our guide\b[^\.\n]*\.?\s*/gi, '').trim();

  // Cleanup punctuation/whitespace
  t = t.replace(/[ \t\u00A0]+/g, ' ');
  t = t.replace(/\s+([,.;:!?)])/g, '$1');
  t = t.replace(/([,(])\s+/g, '$1');
  t = t.replace(/\(\s*\)/g, '');
  return t.trim();
}

function toTibetanDateISO(isoDate) {
  // Treat as UTC midnight. For all-day events, this is fine.
  const d = new Date(`${isoDate}T00:00:00Z`);
  const t = new CalendarTibetan().fromDate(d).get();
  const [rabjung, tibYear, tibMonth, isLeapMonth, tibDay, isLeapDay] = t;
  return { rabjung, tibYear, tibMonth, isLeapMonth, tibDay, isLeapDay };
}

function isTeacherAnniversary(entry) {
  const title = String(entry?.titleEn ?? entry?.event?.title ?? '').toLowerCase();
  if (!title.startsWith('anniversary of')) return false;
  // exclude Buddha-related practice days
  if (title.includes('buddha')) return false;
  return true;
}

function main() {
  if (!fs.existsSync(IN_PATH)) {
    console.error(`Missing input: ${IN_PATH}`);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(IN_PATH, 'utf-8'));
  const entries = Array.isArray(raw.entries) ? raw.entries : [];

  const outEntries = entries.map((e) => {
    const start = e?.event?.start;

    const cleaned = {
      ...e,
      titleEn: stripShambhalaText(e.titleEn),
      titleEs: stripShambhalaText(e.titleEs),
      descriptionEn: stripShambhalaText(e.descriptionEn),
      descriptionEs: stripShambhalaText(e.descriptionEs),
      event: {
        ...e.event,
        title: stripShambhalaText(e?.event?.title),
        extendedProps: e?.event?.extendedProps
          ? {
              ...e.event.extendedProps,
              description: stripShambhalaText(e?.event?.extendedProps?.description),
            }
          : e.event.extendedProps,
      },
    };

    const flags = { ...(cleaned.flags || {}) };
    if (isTeacherAnniversary(cleaned)) {
      flags.teacherAnniversary = true;
      flags.kind = 'teacher_anniversary';
      if (typeof start === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(start)) {
        cleaned.tibetanLunar = toTibetanDateISO(start);
      }
    } else {
      flags.teacherAnniversary = false;
    }

    cleaned.flags = flags;
    return cleaned;
  });

  const out = {
    ...raw,
    source: {
      ...(raw.source || {}),
      cleanedAt: new Date().toISOString(),
      notes: [
        'Removed Shambhala-specific references and URLs from titles/descriptions.',
        'Added flags.teacherAnniversary + computed tibetanLunar date for teacher anniversaries (based on 2026 start date).',
      ],
    },
    entries: outEntries,
  };

  fs.writeFileSync(IN_PATH, JSON.stringify(out, null, 2), 'utf-8');
  console.log(`Updated ${IN_PATH} (${outEntries.length} entries)`);

  const teacher = outEntries.filter((x) => x?.flags?.teacherAnniversary);
  console.log(`Teacher anniversaries: ${teacher.length}`);
}

main();
