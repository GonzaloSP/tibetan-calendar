import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SHAMBHALA_PATH = path.join(ROOT, 'shambhala_calendar.json');
const TEACHERS_PATH = path.join(ROOT, 'src', 'data', 'teachers.json');

function normalizeKey(s) {
  return String(s)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function teacherNameFromEntry(e) {
  const t = String(e?.titleEn || e?.event?.title || '').trim();
  return t
    .replace(/^Anniversary of\s+(the\s+)?/i, '')
    .replace(/^Anniversay of\s+/i, '')
    .replace(/^The Birth of\s+/i, '')
    .replace(/\(Lunar Calendar\)/gi, '')
    .trim();
}

function mergeUnique(arrA, arrB) {
  const out = [];
  const seen = new Set();
  for (const x of [...(arrA || []), ...(arrB || [])]) {
    if (!x) continue;
    const k = String(x);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

function buildDescriptionEs({ name, tibetanName, lunar, bioEs, bioSources, originalDescriptionEs, records }) {
  const lines = [];

  // Note: tibetanName is stored structurally on the entry (teachers.json field `tibetanName`).
  // If the UI shows it separately, we don't repeat it in the description body.

  const bullets: string[] = [];

  // Do NOT include date mechanics in the body text (requested). The calendar already places it on the right day.

  if (bioEs) {
    bullets.push(bioEs);
  }

  // If there is extra nuance in the shambhala-derived description, keep it as another bullet.
  if (originalDescriptionEs && originalDescriptionEs.trim()) {
    const cleaned = originalDescriptionEs
      .replace(/^Aniversario de\s+[^.]+\.?\s*/i, '')
      .trim();
    if (cleaned) bullets.push(cleaned);
  }

  if (bullets.length) {
    for (const b of bullets) lines.push(`- ${b}`);
  }

  const sources = mergeUnique(records?.sources || [], bioSources || []);
  if (sources.length) {
    lines.push('');
    lines.push('Fuente:');
    // Keep a single clickable link (first source) as requested.
    lines.push(`- ${sources[0]}`);
  }

  return lines.join('\n');
}

function isSameRule(a, b) {
  if (!a || !b) return false;
  if (a.calendar !== b.calendar) return false;
  if (a.calendar === 'tibetan-lunar') {
    return a.tibMonth === b.tibMonth && a.tibDay === b.tibDay;
  }
  if (a.calendar === 'gregorian') {
    return a.month === b.month && a.day === b.day;
  }
  return false;
}

function main() {
  const sh = JSON.parse(fs.readFileSync(SHAMBHALA_PATH, 'utf-8'));
  const teachers = JSON.parse(fs.readFileSync(TEACHERS_PATH, 'utf-8'));

  const list = (sh.entries || []).filter((e) => e?.flags?.teacherAnniversary);

  // Group shambhala entries by (teacherKey + tibMonth/tibDay) so duplicates in same day collapse.
  const groups = new Map();
  for (const e of list) {
    const name = teacherNameFromEntry(e);
    const kName = normalizeKey(name);
    const lunar = e.tibetanLunar;
    const kDay = lunar ? `tib${lunar.tibMonth}-${lunar.tibDay}` : `greg-${e?.event?.start || 'unknown'}`;
    const key = `${kName}::${kDay}`;
    const g = groups.get(key) || { name, kName, lunar, entries: [] };
    g.entries.push(e);
    // keep best lunar if missing
    if (!g.lunar && lunar) g.lunar = lunar;
    groups.set(key, g);
  }

  const dest = teachers.importantCelebratoryDates || [];

  let added = 0;
  let merged = 0;

  for (const g of groups.values()) {
    const name = g.name;
    const teacherKey = g.kName;

    // Merge all shambhala records for this group.
    const tibetanName = g.entries.map((x) => x.tibetanName).find(Boolean) || null;
    const bioEs = g.entries.map((x) => x?.bio?.es).find(Boolean) || null;
    const bioSources = mergeUnique(...g.entries.map((x) => x?.bio?.sources || []));
    const originalDescriptionEs = g.entries.map((x) => x.descriptionEs).find(Boolean) || '';

    const rule = g.lunar
      ? { calendar: 'tibetan-lunar', tibMonth: g.lunar.tibMonth, tibDay: g.lunar.tibDay }
      : null;

    if (!rule) continue; // we only merge lunar-based teacher anniversaries

    const id = `shambhala-${teacherKey}-tib${rule.tibMonth}-${rule.tibDay}`;

    const recordBundle = {
      source: 'shambhala_calendar.json',
      keys: { teacherKey, groupKey: `${teacherKey}::tib${rule.tibMonth}-${rule.tibDay}` },
      sources: mergeUnique(
        ...g.entries.map((x) => x?.bio?.sources || []),
        ...g.entries.flatMap((x) => x?.bio?.sources || [])
      ),
      records: g.entries,
    };

    // Find an existing entry that matches same teacher + rule (either previously added shambhala or an existing similar one).
    let existing = dest.find((x) => x.id === id);
    if (!existing) {
      existing = dest.find((x) => {
        const xKey = normalizeKey(String(x.name || ''));
        return xKey.includes(teacherKey) && isSameRule(x.rule, rule);
      });
    }

    const newDescription = buildDescriptionEs({
      name,
      tibetanName,
      lunar: g.lunar,
      bioEs,
      bioSources,
      originalDescriptionEs,
      records: { sources: mergeUnique(...g.entries.map((x) => x?.bio?.sources || [])) },
    });

    if (existing) {
      // Merge: keep existing id/name/type/rule; enrich description and add rawRecords
      existing.description = newDescription;
      existing.rawRecords = mergeUnique(existing.rawRecords || [], [recordBundle]);
      // Keep a structured tibetanName if not already present
      if (!existing.tibetanName && tibetanName) existing.tibetanName = tibetanName;
      if (!existing.bio && bioEs) existing.bio = { es: bioEs, sources: bioSources };
      merged++;
    } else {
      const entry = {
        id,
        name: `Aniversario — ${name}`,
        type: 'OTHER',
        rule,
        conditions: {
          // Similar to how the app treats duplicate Tibetan days.
          doubleDayFlagNot: [1],
        },
        description: newDescription,
        tibetanName: tibetanName || undefined,
        bio: bioEs ? { es: bioEs, sources: bioSources } : undefined,
        rawRecords: [recordBundle],
      };
      dest.push(entry);
      added++;
    }
  }

  // Sort for stable diffs: gregorian first then tibetan-lunar, then by id.
  dest.sort((a, b) => {
    const ca = a?.rule?.calendar || '';
    const cb = b?.rule?.calendar || '';
    const oa = ca === 'gregorian' ? 0 : 1;
    const ob = cb === 'gregorian' ? 0 : 1;
    if (oa !== ob) return oa - ob;
    const ida = String(a.id || '');
    const idb = String(b.id || '');
    return ida.localeCompare(idb);
  });

  teachers.importantCelebratoryDates = dest;
  teachers.source = {
    ...(teachers.source || {}),
    mergedShambhalaAt: new Date().toISOString(),
    shambhalaInput: 'app/shambhala_calendar.json',
  };

  fs.writeFileSync(TEACHERS_PATH, JSON.stringify(teachers, null, 2) + '\n', 'utf-8');

  console.log(`Merged shambhala into teachers.json. added=${added} merged=${merged} groups=${groups.size}`);
}

main();
