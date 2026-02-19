import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CAL_PATH = path.join(ROOT, 'shambhala_calendar.json');
const OUT_PATH = path.join(ROOT, 'scripts', 'teacher_bio_sources.json');

function uniq(arr) {
  return [...new Set(arr)];
}

function normalizeTeacherName(name) {
  return String(name)
    .replace(/^Anniversary of\s+/i, '')
    .replace(/^Aniversario de\s+/i, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      'user-agent': 'tibetan-calendar-bio-fetch/1.0 (contact: local)'
    }
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = null; }
  return { ok: res.ok, status: res.status, url, json, text };
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { 'user-agent': 'tibetan-calendar-bio-fetch/1.0 (contact: local)' }
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, url, text };
}

function pickFirstParagraphFromHtml(html) {
  // Very light parsing: strip scripts/styles and grab first <p>...</p>
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');
  const m = cleaned.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  if (!m) return null;
  return m[1]
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function tryWikipedia(name) {
  const title = encodeURIComponent(name.replace(/\s+/g, '_'));
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`;
  const r = await fetchJson(url);
  if (!r.ok || !r.json || r.json.type === 'https://mediawiki.org/wiki/HyperSwitch/errors/not_found') return null;
  const extract = r.json.extract || null;
  const pageUrl = r.json.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${name.replace(/\s+/g, '_')}`;
  return extract ? { source: 'wikipedia', url: pageUrl, extract } : null;
}

async function tryRigpaWiki(name) {
  const title = encodeURIComponent(name.replace(/\s+/g, '_'));
  const url = `https://www.rigpawiki.org/index.php?title=${title}`;
  const r = await fetchText(url);
  if (!r.ok) return null;
  if (/There is currently no text in this page/i.test(r.text)) return null;
  const para = pickFirstParagraphFromHtml(r.text);
  if (!para) return null;
  return { source: 'rigpawiki', url, extract: para };
}

async function tryRyWiki(name) {
  const title = encodeURIComponent(name.replace(/\s+/g, '_'));
  const url = `https://rywiki.tsadra.org/index.php/${title}`;
  const r = await fetchText(url);
  if (!r.ok) return null;
  const para = pickFirstParagraphFromHtml(r.text);
  if (!para) return null;
  return { source: 'rywiki', url, extract: para };
}

async function main() {
  const cal = JSON.parse(fs.readFileSync(CAL_PATH, 'utf-8'));
  const teacherEntries = (cal.entries || []).filter((e) => e?.flags?.teacherAnniversary);
  const names = uniq(teacherEntries.map((e) => normalizeTeacherName(e.titleEn || e.titleEs || e.event?.title || ''))).filter(Boolean);

  const out = {};

  for (const name of names) {
    // naive throttling
    await new Promise((r) => setTimeout(r, 250));

    const candidates = [];

    const w = await tryWikipedia(name);
    if (w) candidates.push(w);

    const rw = await tryRigpaWiki(name);
    if (rw) candidates.push(rw);

    const ry = await tryRyWiki(name);
    if (ry) candidates.push(ry);

    out[name] = {
      name,
      candidates,
      chosen: candidates[0] || null,
    };

    console.log(`${name}: ${candidates.length} sources`);
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), 'utf-8');
  console.log(`Wrote ${OUT_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
