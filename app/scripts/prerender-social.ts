import fs from 'node:fs';
import path from 'node:path';

import { getPracticesForDate } from '../src/lib/practices';
import { toTibetanDate } from '../src/lib/tibetan';

const YEAR = Number(process.env.YEAR || '2026');
const START = process.env.START || `${YEAR}-01-01`;
const END = process.env.END || `${YEAR}-12-31`;

const DIST = path.join(process.cwd(), 'dist');

function isoToDate(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fmt(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildHtml(params: {
  title: string;
  description: string;
  image: string;
  canonicalUrl: string;
  redirectTo: string;
}) {
  const t = escapeHtml(params.title);
  const d = escapeHtml(params.description);
  const img = escapeHtml(params.image);
  const url = escapeHtml(params.canonicalUrl);
  const redirect = escapeHtml(params.redirectTo);

  return `<!doctype html>
<html lang="es-AR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <title>${t}</title>
    <meta name="description" content="${d}" />
    <link rel="canonical" href="${url}" />

    <meta property="og:site_name" content="Calendario Tibetano en Español" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${t}" />
    <meta property="og:description" content="${d}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${img}" />
    <meta property="og:image:alt" content="${t}" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${t}" />
    <meta name="twitter:description" content="${d}" />
    <meta name="twitter:image" content="${img}" />

    <meta http-equiv="refresh" content="0; url=${redirect}" />
    <script>
      // Redirect humans to the interactive SPA; social crawlers will read the meta tags above.
      window.location.replace(${JSON.stringify(params.redirectTo)});
    </script>
  </head>
  <body>
    <noscript>
      <p>Redirigiendo… <a href="${redirect}">abrir calendario</a></p>
    </noscript>
  </body>
</html>`;
}

async function main() {
  const origin = process.env.VITE_PUBLIC_ORIGIN || process.env.PUBLIC_ORIGIN || '';
  if (!origin) {
    console.warn('[prerender-social] No PUBLIC_ORIGIN/VITE_PUBLIC_ORIGIN set; OG urls will be relative.');
  }

  const startDate = isoToDate(START);
  const endDate = isoToDate(END);

  let count = 0;
  for (let d = startDate; d <= endDate; d = addDays(d, 1)) {
    const iso = fmt(d);

    // Use midday UTC to reduce timezone edge cases.
    const dateLocal = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0));

    const tib = toTibetanDate(dateLocal);
    const practices = getPracticesForDate(dateLocal, tib);
    const primary = practices[0];

    const title = primary
      ? `${primary.name} — Calendario Tibetano en Español`
      : `Calendario Tibetano en Español — ${iso}`;

    const rawDesc =
      primary?.description ||
      'Calendario tibetano en español: días de Buda, tsog, preceptos, aniversarios de maestros y prácticas mensuales.';
    const description = rawDesc.replace(/\s+/g, ' ').trim().slice(0, 200);

    const cleanOrigin = origin ? origin.replace(/\/$/, '') : '';
    const image = cleanOrigin ? `${cleanOrigin}/og.png` : '/og.png';
    const canonicalUrl = cleanOrigin ? `${cleanOrigin}/fecha/${iso}/` : `/fecha/${iso}/`;
    const redirectTo = cleanOrigin ? `${cleanOrigin}/?date=${iso}` : `/?date=${iso}`;

    const html = buildHtml({ title, description, image, canonicalUrl, redirectTo });

    const outDir = path.join(DIST, 'fecha', iso);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf-8');

    count++;
    if (count % 25 === 0) console.log(`prerendered ${count} pages...`);
  }

  console.log(`Done. prerendered=${count} (range ${START}..${END})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
