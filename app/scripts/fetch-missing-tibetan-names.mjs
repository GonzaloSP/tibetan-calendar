import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CAL_PATH = path.join(ROOT, 'shambhala_calendar.json');

function teacherNameFromEntry(e) {
  const t = String(e?.titleEn || e?.event?.title || '').trim();
  return t
    .replace(/^Anniversary of\s+(the\s+)?/i, '')
    .replace(/^Anniversay of\s+/i, '')
    .replace(/^The Birth of\s+/i, '')
    .replace(/\(Lunar Calendar\)/gi, '')
    .trim();
}

function extractTibetanNameFromText(text) {
  const m = String(text).match(/\bTib\.?\s+([\u0F00-\u0FFF][\u0F00-\u0FFF\s་།]*[\u0F00-\u0FFF།])/);
  if (m) return m[1].trim();
  const m2 = String(text).match(/([\u0F00-\u0FFF][\u0F00-\u0FFF\s་།]{4,}[\u0F00-\u0FFF།])/);
  if (m2) return m2[1].trim();
  return null;
}

async function fetchRigpaWiki(name) {
  const title = encodeURIComponent(name.replace(/\s+/g, '_'));
  const url = `https://www.rigpawiki.org/index.php?title=${title}`;
  const res = await fetch(url, { headers: { 'user-agent': 'tibetan-calendar/1.0' } });
  if (!res.ok) return null;
  const html = await res.text();
  if (/There is currently no text in this page/i.test(html)) return null;
  // Get readable text quickly
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|\u00a0/gi, ' ')
    .replace(/\s+/g, ' ');
  const tib = extractTibetanNameFromText(text);
  return tib ? { tibetanName: tib, url } : null;
}

async function main() {
  const cal = JSON.parse(fs.readFileSync(CAL_PATH, 'utf-8'));
  const targets = (cal.entries || []).filter((e) => e?.flags?.teacherAnniversary && !e.tibetanName);

  console.log(`Missing tibetanName: ${targets.length}`);

  let updated = 0;
  for (const e of targets) {
    const name = teacherNameFromEntry(e);
    if (!name) continue;

    // Try a couple of common spelling fixes
    const candidates = [
      name,
      name.replace('Chogyur', 'Chokgyur'),
      name.replace('Khyenytse', 'Khyentse'),
      name.replace('Nalkdjor', 'Naljor'),
    ];

    let found = null;
    for (const c of [...new Set(candidates)]) {
      // small delay
      await new Promise((r) => setTimeout(r, 150));
      found = await fetchRigpaWiki(c);
      if (found) break;
    }

    if (found) {
      e.tibetanName = found.tibetanName;
      // Keep a pointer to where it came from (optional, but helpful)
      e.tibetanNameSource = found.url;
      updated++;
      console.log(`✓ ${name} -> ${found.tibetanName}`);
    } else {
      console.log(`· ${name} (not found)`);
    }
  }

  cal.source = { ...(cal.source || {}), tibetanNamesFetchedAt: new Date().toISOString() };
  fs.writeFileSync(CAL_PATH, JSON.stringify(cal, null, 2), 'utf-8');
  console.log(`Updated ${updated} entries.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
