import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const FILE = path.join(ROOT, 'shambhala_calendar.json');

function stripHtml(s = '') {
  return String(s)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\u00a0/g, ' ')
    .trim();
}

function teacherNameFromTitle(titleEn = '') {
  let s = String(titleEn).trim();
  s = s.replace(/^Anniversary of the\s+/i, '');
  s = s.replace(/^Anniversary of\s+/i, '');
  s = s.replace(/\(Lunar Calendar\)/gi, '').trim();
  s = s.replace(/\s+/g, ' ').trim();
  // Remove trailing punctuation
  s = s.replace(/[.:\-–—]+\s*$/g, '').trim();
  return s;
}

function lunarLabel(t) {
  if (!t) return '';
  const leapMonth = t.isLeapMonth ? ' (mes duplicado)' : '';
  const leapDay = t.isLeapDay ? ' (día repetido)' : '';
  return `día ${t.tibDay}${leapDay} del mes ${t.tibMonth}${leapMonth}`;
}

function niceSpanishDescription(name, t) {
  const lunar = t ? lunarLabel(t) : null;

  // Keep it neutral and self-contained (no mention of source).
  if (lunar) {
    return `Aniversario de ${name}. En el calendario lunar tibetano se observa el ${lunar}. La fecha en el calendario occidental varía cada año.`;
  }

  return `Aniversario de ${name}. La fecha puede variar cada año según el calendario lunar tibetano.`;
}

function main() {
  const raw = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
  const entries = raw.entries || [];

  let changed = 0;
  for (const e of entries) {
    if (!e?.flags?.teacherAnniversary) continue;

    const titleEn = stripHtml(e.titleEn || e?.event?.title || '');
    const name = teacherNameFromTitle(titleEn);
    const tib = e.tibetanLunar;

    const newEs = niceSpanishDescription(name, tib);

    // Overwrite all descriptions with fresh Spanish, and blank English to avoid traces.
    e.descriptionEs = newEs;
    e.descriptionEn = '';

    if (e.event?.extendedProps) {
      e.event.extendedProps.description = newEs;
    }

    // Also ensure Spanish title is clean and consistent.
    if (!e.titleEs || /Anniversary of/i.test(e.titleEs)) {
      e.titleEs = `Aniversario de ${name}`;
    }

    changed++;
  }

  raw.source = {
    ...(raw.source || {}),
    rewrittenTeacherDescriptionsAt: new Date().toISOString(),
  };

  fs.writeFileSync(FILE, JSON.stringify(raw, null, 2), 'utf-8');
  console.log(`Rewrote ${changed} teacher anniversary descriptions in ${FILE}`);
}

main();
