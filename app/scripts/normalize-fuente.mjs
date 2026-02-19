import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const FILES = [
  'src/data/teachers.json',
  'src/data/teacher-seed-calendar.es.json',
  'src/data/important-dates.json',
  'src/data/local-dates.json',
].map((p) => path.join(ROOT, p));

function extractUrls(text) {
  return (String(text || '').match(/https?:\/\/[^\s)\]]+/g) || []).map((u) => u.replace(/[.,;:]+$/, ''));
}

function normalizeDescription(desc) {
  let s = String(desc || '').trim();

  // Parse existing Fuente block urls
  const fuenteBlockMatch = s.match(/\n\s*Fuente:\s*\n([\s\S]*)$/i);
  const existingFuenteUrls = fuenteBlockMatch ? extractUrls(fuenteBlockMatch[1]) : [];

  // Remove any existing Fuente/Fuentes blocks from anywhere, including inline ones.
  s = s
    .replace(/\s*\n?\s*Fuentes?:\s*\n(?:\s*-\s*https?:\/\/[^\n]+\n?)+/gi, '')
    .replace(/\s*\n?\s*Fuente:\s*\n(?:\s*-\s*https?:\/\/[^\n]+\n?)+/gi, '')
    // also remove inline "Fuente: - url" one-liners
    .replace(/\s*Fuente:\s*-\s*https?:\/\/[^\s]+\s*/gi, ' ')
    .trim();

  // Determine candidate urls from the remaining text + old fuente block
  const urls = Array.from(new Set([...extractUrls(desc), ...existingFuenteUrls]));

  // Also remove stray URLs from body if they were only meant as sources (keep if you want them in bullets).
  // We keep URLs in body only if they are the ONLY content of a bullet under Fuente; otherwise strip them.
  // Here we strip all URLs from body and put the first one in Fuente.
  if (urls.length) {
    s = s.replace(/https?:\/\/[^\s)\]]+/g, '').replace(/\s+/g, ' ').trim();
  }

  // Restore bullet formatting a bit: keep line breaks between bullets if present originally
  // If everything got collapsed, try to re-expand simple "- " sequences.
  if (/\s-\s/.test(s) && !s.includes('\n- ')) {
    // heuristic: turn " - " into newlines
    s = s.replace(/\s-\s/g, '\n- ');
  }

  s = s.replace(/\n{3,}/g, '\n\n').trim();

  if (!urls.length) return s;

  // Ensure Fuente is a new row at the end.
  return `${s}\n\nFuente:\n- ${urls[0]}`.trim();
}

function runFile(file) {
  if (!fs.existsSync(file)) return { file, changed: 0 };
  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
  let changed = 0;

  for (const e of data.importantCelebratoryDates || []) {
    if (typeof e.description !== 'string') continue;
    const next = normalizeDescription(e.description);
    if (next !== e.description) {
      e.description = next;
      changed++;
    }
  }

  if (changed) {
    data.source = { ...(data.source || {}), normalizedFuenteAt: new Date().toISOString() };
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  }

  return { file: path.basename(file), changed };
}

let total = 0;
for (const f of FILES) {
  const r = runFile(f);
  console.log(`${r.file}: changed=${r.changed}`);
  total += r.changed;
}
console.log(`total changed=${total}`);
