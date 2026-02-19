import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const YEAR = Number(process.env.YEAR || '2026');
const START = process.env.START || `${YEAR}-01-01`;
const END = process.env.END || `${YEAR}-12-31`;

const DIST = path.join(process.cwd(), 'dist');

function isoToDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fmt(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await wait(250);
  }
  throw new Error(`Server not ready: ${url}`);
}

async function main() {
  // Lazy import so we only require puppeteer when script is run.
  const puppeteer = await import('puppeteer');

  // Start vite preview on a fixed port.
  const port = Number(process.env.PORT || '4175');
  const baseUrl = `http://localhost:${port}`;

  const child = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', String(port)], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  });

  child.stdout.on('data', (d) => process.stdout.write(d));
  child.stderr.on('data', (d) => process.stderr.write(d));

  try {
    await waitForServer(baseUrl);

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Don’t block on images; we need meta tags only.
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const rt = req.resourceType();
      if (rt === 'image' || rt === 'media' || rt === 'font') return req.abort();
      req.continue();
    });

    const startDate = isoToDate(START);
    const endDate = isoToDate(END);

    let count = 0;
    for (let d = startDate; d <= endDate; d = addDays(d, 1)) {
      const iso = fmt(d);
      const url = `${baseUrl}/?date=${iso}`;

      await page.goto(url, { waitUntil: 'networkidle0' });

      // Give the app a moment to update title/meta.
      await page.waitForFunction(() => !!document.title && document.title.length > 0);
      await wait(100);

      const html = await page.content();

      const outDir = path.join(DIST, 'fecha', iso);
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf-8');
      count++;
      if (count % 25 === 0) console.log(`prerendered ${count} pages...`);
    }

    await browser.close();
    console.log(`Done. prerendered=${count} (range ${START}..${END})`);
  } finally {
    child.kill('SIGTERM');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
