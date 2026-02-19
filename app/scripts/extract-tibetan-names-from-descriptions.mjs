import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'src', 'data');

const TARGET_FILES = [
  'important-dates.json',
  'teacher-seed-calendar.es.json',
  'teachers.json',
  'local-dates.json',
];

function extractFromDescription(desc) {
  const s = String(desc || '');

  // Look for a line like: "- Nombre tibetano: ..." (possibly with leading text blocks)
  // Capture everything after the colon until end of line.
  const m = s.match(/^[\s\S]*?\n\s*-\s*Nombre tibetano:\s*([^\n]+)\s*$/mi);
  if (!m) return { tibetanName: null, cleaned: s };

  const tibetanName = m[1].trim();

  // Remove ONLY that bullet line; keep other bullets.
  let cleaned = s.replace(/\n\s*-\s*Nombre tibetano:\s*[^\n]+\s*(?=\n|$)/mi, '');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  return { tibetanName, cleaned };
}

function processFile(file) {
  const p = path.join(DATA_DIR, file);
  if (!fs.existsSync(p)) return { file, changed: 0 };
  const data = JSON.parse(fs.readFileSync(p, 'utf-8'));

  let changed = 0;
  for (const e of data.importantCelebratoryDates || []) {
    if (typeof e.description !== 'string') continue;

    const { tibetanName, cleaned } = extractFromDescription(e.description);
    if (tibetanName && !e.tibetanName) {
      e.tibetanName = tibetanName;
      changed++;
    }
    if (cleaned !== e.description) {
      e.description = cleaned;
      changed++;
    }
  }

  if (changed > 0) {
    data.source = { ...(data.source || {}), extractedTibetanNamesAt: new Date().toISOString() };
    fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
  }
  return { file, changed };
}

function main() {
  const results = TARGET_FILES.map(processFile);
  const total = results.reduce((a, r) => a + r.changed, 0);
  for (const r of results) {
    console.log(`${r.file}: changed=${r.changed}`);
  }
  console.log(`total changed=${total}`);
}

main();
