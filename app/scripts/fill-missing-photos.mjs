import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const FILES = [
  { path: path.join(ROOT, 'src', 'data', 'teachers.json'), kind: 'teachers' },
  { path: path.join(ROOT, 'src', 'data', 'teacher-seed-calendar.es.json'), kind: 'seed' },
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function mergeUnique(...vals) {
  const out = [];
  const seen = new Set();
  for (const v of vals) {
    const arr = Array.isArray(v) ? v : v ? [v] : [];
    for (const x of arr) {
      const s = String(x || '').trim();
      if (!s) continue;
      if (seen.has(s)) continue;
      seen.add(s);
      out.push(s);
    }
  }
  return out;
}

function teacherNameFromEntry(e) {
  const rawTitleEn = e?.rawRecords?.[0]?.records?.[0]?.titleEn;
  if (rawTitleEn && typeof rawTitleEn === 'string') {
    return rawTitleEn
      .replace(/^Anniversary of\s+(the\s+)?/i, '')
      .replace(/^Anniversay of\s+/i, '')
      .replace(/^The Birth of\s+/i, '')
      .replace(/\(Lunar Calendar\)/gi, '')
      .trim();
  }

  return String(e?.name || '')
    .replace(/^Aniversario\s*(de)?\s*/i, '')
    .replace(/^[—-]\s*/i, '')
    .replace(/^de\s+/i, '')
    .replace(/^parinirvana\s*[—-]\s*/i, '')
    .replace(/^nacimiento\s*[—-]\s*/i, '')
    .replace(/^Aniversario\s*[—-]\s*/i, '')
    .replace(/^Aniversario\s+de\s+/i, '')
    .trim();
}

function likelyTeacherEntry(e) {
  const n = String(e?.name || '').toLowerCase();
  return n.includes('aniversario');
}

function scoreNameMatch(pageText, teacherName) {
  const t = String(teacherName || '').toLowerCase();
  const txt = String(pageText || '').toLowerCase();
  if (!t) return 0;

  // basic token overlap
  const toks = t.split(/\s+/).filter(Boolean);
  let hit = 0;
  for (const tok of toks) {
    if (tok.length < 3) continue;
    if (txt.includes(tok)) hit++;
  }
  return hit;
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { 'user-agent': 'tibetan-calendar/1.0' },
    redirect: 'follow',
  });
  if (!res.ok) return null;
  return await res.text();
}

function extractRigpaWikiImage(html) {
  // Rigpa wiki file pages include a direct /images/... path.
  const m = html.match(/\/(images\/[a-z0-9_\-\/]+\.(?:jpg|jpeg|png|webp))/i);
  if (!m) return null;
  return `https://www.rigpawiki.org/${m[1]}`;
}

async function tryRigpaWikiFromSources(sources, teacherName) {
  const rigpa = sources.find((u) => /rigpawiki\.org\/index\.php\?title=/i.test(u));
  if (!rigpa) return null;

  const html = await fetchText(rigpa);
  if (!html) return null;

  // quick sanity check
  if (scoreNameMatch(html, teacherName) < 1) {
    // still allow, but prefer stronger matches
  }

  // try to find File: page link in HTML
  const fileHref = html.match(/href="(\/index\.php\?title=File:[^"]+)"/i)?.[1];
  if (fileHref) {
    const fileUrl = `https://www.rigpawiki.org${fileHref.replace(/&amp;/g, '&')}`;
    const fileHtml = await fetchText(fileUrl);
    if (fileHtml) {
      const img = extractRigpaWikiImage(fileHtml);
      if (img) {
        return {
          url: img,
          creditEs: 'Créditos: Rigpa Wiki',
          creditUrl: rigpa,
        };
      }
    }
  }

  // fallback: maybe the page itself contains /images/... (less common in readability but in raw it exists)
  const fallback = html.match(/src="(\/images\/[^"]+\.(?:jpg|jpeg|png|webp))"/i)?.[1];
  if (fallback) {
    return {
      url: `https://www.rigpawiki.org${fallback}`,
      creditEs: 'Créditos: Rigpa Wiki',
      creditUrl: rigpa,
    };
  }

  return null;
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

function pickWikiImage(summaryJson) {
  const thumb = summaryJson?.thumbnail?.source;
  const pageUrl = summaryJson?.content_urls?.desktop?.page;
  if (!thumb || !pageUrl) return null;
  return {
    url: thumb,
    creditEs: 'Créditos: Wikimedia Commons / Wikipedia',
    creditUrl: pageUrl,
  };
}

async function tryWikipedia(teacherName) {
  // Prefer search with qualifier to reduce collisions.
  const title = await wikiSearchTitle(`${teacherName} Tibetan Buddhist`);
  if (!title) return null;
  const sum = await wikiSummary(title);
  if (!sum || sum.type === 'disambiguation') return null;

  // sanity: require some token overlap in title or extract
  const text = `${sum.title || ''}\n${sum.extract || ''}`;
  if (scoreNameMatch(text, teacherName) < 1) return null;

  return pickWikiImage(sum);
}

async function fillForFile(file) {
  const data = JSON.parse(fs.readFileSync(file.path, 'utf-8'));
  let updated = 0;
  let attempted = 0;

  for (const e of data.importantCelebratoryDates || []) {
    if (!likelyTeacherEntry(e)) continue;
    if (e.photoBlocked) continue;
    if (e.photo?.url) continue;

    const teacherName = teacherNameFromEntry(e);
    if (!teacherName) continue;

    const sources = mergeUnique(
      e.bio?.sources || [],
      (e.rawRecords || []).flatMap((r) => r?.sources || []),
      // also try to parse "Fuente:" urls out of description as last resort
      String(e.description || '').match(/https?:\/\/[^\s)]+/g) || []
    );

    attempted++;
    await sleep(200);

    let photo = await tryRigpaWikiFromSources(sources, teacherName);
    if (!photo) {
      await sleep(200);
      photo = await tryWikipedia(teacherName);
    }

    if (photo) {
      e.photo = photo;
      updated++;
    }
  }

  if (updated > 0) {
    data.source = { ...(data.source || {}), filledMissingPhotosAt: new Date().toISOString() };
    fs.writeFileSync(file.path, JSON.stringify(data, null, 2) + '\n');
  }

  return { file: path.basename(file.path), updated, attempted };
}

async function main() {
  const results = [];
  for (const f of FILES) {
    results.push(await fillForFile(f));
  }
  for (const r of results) {
    console.log(`${r.file}: attempted=${r.attempted} updated=${r.updated}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
