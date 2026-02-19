import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TEACHERS_PATH = path.join(ROOT, 'src', 'data', 'teachers.json');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function teacherNameFromTeachersEntry(e) {
  // Prefer original English teacher name from rawRecords if present.
  const rawTitleEn = e?.rawRecords?.[0]?.records?.[0]?.titleEn;
  if (rawTitleEn && typeof rawTitleEn === 'string') {
    return rawTitleEn
      .replace(/^Anniversary of\s+(the\s+)?/i, '')
      .replace(/^Anniversay of\s+/i, '')
      .replace(/^The Birth of\s+/i, '')
      .replace(/\(Lunar Calendar\)/gi, '')
      .trim();
  }

  const n = String(e?.name || '')
    .replace(/^Aniversario\s*[—-]\s*/i, '')
    .replace(/^Aniversario\s+de\s+/i, '')
    .replace(/^Aniversario\s+—\s+/i, '')
    .trim();
  return n;
}

async function wikiSearchTitle(query) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
    query
  )}&format=json&origin=*`;
  const res = await fetch(url, { headers: { 'user-agent': 'tibetan-calendar/1.0' } });
  if (!res.ok) return null;
  const json = await res.json();
  const first = json?.query?.search?.[0];
  return first?.title || null;
}

async function wikiSummary(title) {
  const t = encodeURIComponent(String(title).replace(/\s+/g, '_'));
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${t}`;
  const res = await fetch(url, { headers: { 'user-agent': 'tibetan-calendar/1.0' } });
  if (!res.ok) return null;
  const json = await res.json();
  return json || null;
}

function pickImage(summaryJson) {
  const thumb = summaryJson?.thumbnail?.source;
  const pageUrl = summaryJson?.content_urls?.desktop?.page;
  if (!thumb || !pageUrl) return null;
  return {
    url: thumb,
    creditEs: 'Créditos: Wikimedia Commons / Wikipedia',
    creditUrl: pageUrl,
  };
}

async function main() {
  const data = JSON.parse(fs.readFileSync(TEACHERS_PATH, 'utf-8'));

  const entries = data.importantCelebratoryDates || [];
  const targets = entries.filter((e) =>
    // Only teacher-ish entries (including seed ones)
    typeof e?.name === 'string' &&
    (e.name.toLowerCase().includes('aniversario') || e.id?.startsWith('shambhala-') || e.id?.includes('teacher-'))
  );

  let updated = 0;
  let skipped = 0;

  for (const e of targets) {
    if (e.photo?.url) {
      skipped++;
      continue;
    }

    const teacherName = teacherNameFromTeachersEntry(e);
    if (!teacherName) continue;

    // Throttle to be polite.
    await sleep(250);

    // First try direct summary.
    let summary = await wikiSummary(teacherName);

    // If missing, try search with qualifiers.
    if (!summary || summary?.type === 'disambiguation') {
      const title = await wikiSearchTitle(`${teacherName} Tibetan Buddhist`);
      if (title) summary = await wikiSummary(title);
    }

    const img = summary ? pickImage(summary) : null;
    if (!img) continue;

    e.photo = img;
    updated++;
  }

  data.source = { ...(data.source || {}), teacherPhotosAddedAt: new Date().toISOString() };
  fs.writeFileSync(TEACHERS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`Added photos to ${updated} entries (skipped existing: ${skipped}).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
