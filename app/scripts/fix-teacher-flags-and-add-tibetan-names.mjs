import fs from 'node:fs';
import path from 'node:path';
import { CalendarTibetan } from '@hnw/date-tibetan';

const ROOT = process.cwd();
const CAL_PATH = path.join(ROOT, 'shambhala_calendar.json');
const SOURCES_PATH = path.join(ROOT, 'scripts', 'teacher_bio_sources.json');

function teacherNameFromEntry(e) {
  const t = String(e?.titleEn || e?.event?.title || '').trim();
  return t
    .replace(/^Anniversary of\s+(the\s+)?/i, '')
    .replace(/^Anniversay of\s+/i, '')
    .replace(/\(Lunar Calendar\)/gi, '')
    .trim();
}

function toTibetanDateISO(isoDate) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  const t = new CalendarTibetan().fromDate(d).get();
  const [rabjung, tibYear, tibMonth, isLeapMonth, tibDay, isLeapDay] = t;
  return { rabjung, tibYear, tibMonth, isLeapMonth, tibDay, isLeapDay };
}

function extractTibetanNameFromText(s) {
  const text = String(s || '');
  // Prefer explicit Tib. marker
  const m = text.match(/\bTib\.?\s+([\u0F00-\u0FFF][\u0F00-\u0FFF\s་།]*[\u0F00-\u0FFF།])/);
  if (m) return m[1].trim();

  // Otherwise, grab the first Tibetan-script chunk
  const m2 = text.match(/([\u0F00-\u0FFF][\u0F00-\u0FFF\s་།]{4,}[\u0F00-\u0FFF།])/);
  if (m2) return m2[1].trim();

  return null;
}

const TIBETAN_NAME_OVERRIDES = {
  'Garab Dorje': 'དགའ་རབ་རྡོ་རྗེ་',
  'Tertön Sogyal': 'གཏེར་སྟོན་བསོད་རྒྱལ་ལས་རབ་གླིང་པ་',
  'Terton Sogyal': 'གཏེར་སྟོན་བསོད་རྒྱལ་ལས་རབ་གླིང་པ་',
};

const DESCRIPTION_OVERRIDES_ES = {
  'Garab Dorje': 'Aniversario de Garab Dorje. Es reconocido como el primer maestro humano en la transmisión de Dzogchen; en el calendario lunar tibetano se observa en el día y mes indicados para este año (varía en el calendario occidental).',
  'Tertön Sogyal': 'Aniversario de Tertön Sogyal (Lerab Lingpa). Tertön prolífico y maestro del 13.º Dalái Lama; sus revelaciones (terma) influyeron ampliamente en la práctica nyingma. La fecha varía cada año según el calendario lunar tibetano.',
  'Terton Sogyal': 'Aniversario de Tertön Sogyal (Lerab Lingpa). Tertön prolífico y maestro del 13.º Dalái Lama; sus revelaciones (terma) influyeron ampliamente en la práctica nyingma. La fecha varía cada año según el calendario lunar tibetano.',
};

function main() {
  const cal = JSON.parse(fs.readFileSync(CAL_PATH, 'utf-8'));
  const sources = fs.existsSync(SOURCES_PATH) ? JSON.parse(fs.readFileSync(SOURCES_PATH, 'utf-8')) : {};

  let setNames = 0;
  let fixedDesc = 0;
  let fixedLunar = 0;

  for (const e of cal.entries || []) {
    if (!e?.flags?.teacherAnniversary) continue;

    const name = teacherNameFromEntry(e);

    // Add tibetanName
    if (!e.tibetanName) {
      const override = TIBETAN_NAME_OVERRIDES[name];
      let tib = override || null;

      if (!tib) {
        const rec = sources[name] || sources[`the ${name}`] || null;
        const extracts = (rec?.candidates || []).map((c) => c.extract).filter(Boolean);
        for (const ex of extracts) {
          const got = extractTibetanNameFromText(ex);
          if (got) {
            tib = got;
            break;
          }
        }
      }

      if (tib) {
        e.tibetanName = tib;
        setNames++;
      }
    }

    // Ensure tibetanLunar exists when we have an ISO start date
    if (!e.tibetanLunar && typeof e?.event?.start === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(e.event.start)) {
      e.tibetanLunar = toTibetanDateISO(e.event.start);
      fixedLunar++;
    }

    // Ensure we have a clean Spanish description for the two newly-flagged items
    const needsOverride = name in DESCRIPTION_OVERRIDES_ES;
    if (needsOverride) {
      const newEs = DESCRIPTION_OVERRIDES_ES[name];
      if (newEs) {
        e.descriptionEs = newEs;
        e.descriptionEn = '';
        if (e.event?.extendedProps) e.event.extendedProps.description = newEs;
        fixedDesc++;
      }
    } else if (!e.descriptionEs || !String(e.descriptionEs).trim()) {
      // Generic fallback
      const t = e.tibetanLunar;
      const lunar = t ? `En el calendario lunar tibetano se observa el día ${t.tibDay} del mes ${t.tibMonth}.` : '';
      e.descriptionEs = `Aniversario de ${name}. ${lunar} La fecha en el calendario occidental varía cada año.`.replace(/\s+/g, ' ').trim();
      e.descriptionEn = '';
      if (e.event?.extendedProps) e.event.extendedProps.description = e.descriptionEs;
      fixedDesc++;
    }
  }

  cal.source = {
    ...(cal.source || {}),
    tibetanNamesAddedAt: new Date().toISOString(),
  };

  fs.writeFileSync(CAL_PATH, JSON.stringify(cal, null, 2), 'utf-8');

  console.log(`Added tibetanName to ${setNames} entries.`);
  console.log(`Fixed/added descriptions for ${fixedDesc} entries.`);
  console.log(`Computed tibetanLunar for ${fixedLunar} entries.`);
}

main();
