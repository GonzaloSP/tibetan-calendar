import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CAL_PATH = path.join(ROOT, 'shambhala_calendar.json');
const SOURCES_PATH = path.join(ROOT, 'scripts', 'teacher_bio_sources.json');

function stripParensTibetan(s) {
  return String(s)
    // remove Tibetan script blocks and Wyl.
    .replace(/[\u0F00-\u0FFF]+/g, '')
    .replace(/\bWyl\.[^)]*\)/gi, ')')
    .replace(/\([^)]*\bTib\.[^)]*\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractDates(s) {
  const m = String(s).match(/\b(\d{3,4})\s*[–-]\s*(\d{3,4})\b/);
  if (!m) return null;
  return { from: m[1], to: m[2] };
}

function bioFromExtract(name, extract) {
  const e = stripParensTibetan(extract);
  const dates = extractDates(e);

  const low = e.toLowerCase();
  const bits = [];

  // roles / importance
  if (low.includes('founder')) bits.push('fundador');
  if (low.includes('throneholder') || low.includes('throne holder')) bits.push('titular del trono');
  if (low.includes('terton')) bits.push('tertön');
  if (low.includes('scholar') || low.includes('learned')) bits.push('erudito');
  if (low.includes('rime') || low.includes('rimé')) bits.push('figura del movimiento Rimé');
  if (low.includes('kagyu')) bits.push('maestro Kagyu');
  if (low.includes('nyingma')) bits.push('maestro Nyingma');
  if (low.includes('sakya')) bits.push('maestro Sakya');
  if (low.includes('gelug')) bits.push('maestro Gelug');

  // achievements keywords
  const achievements = [];
  if (low.includes('revitaliz')) achievements.push('impulsó el estudio y la formación monástica');
  if (low.includes('founding shedra') || low.includes('founding shedras') || low.includes('shedra')) achievements.push('fundó shedras (colegios monásticos)');
  if (low.includes('translator') || low.includes('lotsawa')) achievements.push('traductor (lotsawa) clave');
  if (low.includes('monastery')) achievements.push('vinculado a importantes monasterios');

  // Build a concise Spanish bio. Avoid sounding like a quote.
  let line = `${name}`;
  if (dates) line += ` (${dates.from}–${dates.to})`;
  line += `: `;

  const rolePart = bits.length ? bits.join(', ') : null;
  const achPart = achievements.length ? achievements.join('; ') : null;

  if (rolePart && achPart) line += `${rolePart}. ${achPart}.`;
  else if (rolePart) line += `${rolePart}.`;
  else if (achPart) line += `${achPart}.`;
  else line += `maestro influyente dentro de la tradición budista tibetana.`;

  // Minor cleanups
  line = line.replace(/\s+\./g, '.').replace(/\s+/g, ' ').trim();
  return line;
}

function teacherNameFromEntry(e) {
  const t = String(e?.titleEn || e?.event?.title || '').trim();
  return t
    .replace(/^Anniversary of\s+(the\s+)?/i, '')
    .replace(/\(Lunar Calendar\)/gi, '')
    .trim();
}

function main() {
  const cal = JSON.parse(fs.readFileSync(CAL_PATH, 'utf-8'));
  const sources = JSON.parse(fs.readFileSync(SOURCES_PATH, 'utf-8'));

  let updated = 0;
  for (const e of cal.entries || []) {
    if (!e?.flags?.teacherAnniversary) continue;

    const name = teacherNameFromEntry(e);
    const record = sources[name] || sources[name.replace(/^the\s+/i, '')] || null;

    let chosen = record?.chosen || null;
    if (!chosen && record?.candidates?.length) chosen = record.candidates[0];

    if (!chosen) {
      e.bio = {
        es: `${name}: maestro influyente dentro de la tradición budista tibetana.`,
        sources: [],
        note: 'No se encontró una fuente automática; completar manualmente.'
      };
      updated++;
      continue;
    }

    const es = bioFromExtract(name, chosen.extract);
    const urls = [...new Set((record?.candidates || []).map((c) => c.url).filter(Boolean))];

    e.bio = {
      es,
      sources: urls.slice(0, 2),
    };
    updated++;
  }

  cal.source = {
    ...(cal.source || {}),
    biosAddedAt: new Date().toISOString(),
  };

  fs.writeFileSync(CAL_PATH, JSON.stringify(cal, null, 2), 'utf-8');
  console.log(`Updated bios for ${updated} entries in ${CAL_PATH}`);
}

main();
