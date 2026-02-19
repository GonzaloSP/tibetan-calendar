import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TEACHERS_PATH = path.join(ROOT, 'src', 'data', 'teachers.json');

function mergeUnique(...values) {
  const out = [];
  const seen = new Set();

  for (const v of values) {
    const arr = Array.isArray(v) ? v : v ? [v] : [];
    for (const x of arr) {
      if (x === null || x === undefined) continue;
      const k = String(x).trim();
      if (!k) continue;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(k);
    }
  }

  return out;
}

function buildDescription(entry) {
  const tibetanName = entry.tibetanName || null;
  const bioEs = entry.bio?.es || null;
  const sources = mergeUnique(entry.bio?.sources || [], (entry.rawRecords || []).flatMap((r) => r?.sources || []))
    .map((s) => String(s).trim())
    .filter((s) => /^https?:\/\//i.test(s));

  const lunar = entry.rule?.calendar === 'tibetan-lunar' ? entry.rule : null;

  const lines = [];
  // tibetanName is displayed separately in the UI; do not repeat it in the body text.

  const bullets = [];
  if (lunar) {
    bullets.push(`Calendario lunar tibetano: día ${lunar.tibDay} del mes ${lunar.tibMonth}.`);
  }
  if (bioEs) bullets.push(bioEs);

  // If old description had extra information beyond boilerplate, keep it as bullet (without labels)
  const old = String(entry.description || '').trim();
  if (old) {
    const cleaned = old
      .replace(/^Nombre tibetano:\s*-\s*[\s\S]*?\n\s*\n/gi, '')
      .replace(/^\-\s*Calendario lunar tibetano:[^\n]*\n?/gim, '')
      .replace(/^\-\s*/gm, '')
      .replace(/^Fuente:[\s\S]*$/gim, '')
      .replace(/^Fuentes:[\s\S]*$/gim, '')
      .replace(/\bBio \(resumen\):/gi, '')
      .trim();
    if (cleaned && cleaned.length < 500 && !cleaned.toLowerCase().includes('http')) {
      // avoid duplicating bio if it's the same
      if (!bioEs || !cleaned.includes(bioEs)) bullets.push(cleaned);
    }
  }

  for (const b of bullets.filter(Boolean)) lines.push(`- ${b}`);

  if (sources.length) {
    lines.push('');
    lines.push('Fuente:');
    lines.push(`- ${sources[0]}`);
  }

  return lines.join('\n');
}

function main() {
  const data = JSON.parse(fs.readFileSync(TEACHERS_PATH, 'utf-8'));
  let changed = 0;

  for (const e of data.importantCelebratoryDates || []) {
    // Apply to all entries, but this is mainly for shambhala- ones.
    const next = buildDescription(e);
    if (next && next !== e.description) {
      e.description = next;
      changed++;
    }
  }

  data.source = { ...(data.source || {}), reformattedAt: new Date().toISOString() };
  fs.writeFileSync(TEACHERS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`Reformatted descriptions: ${changed}`);
}

main();
