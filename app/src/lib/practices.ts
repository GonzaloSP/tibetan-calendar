import steinertDates from "../data/important-dates.json";
import localDates from "../data/local-dates.json";
import teacherSeedCalendar from "../data/teacher-seed-calendar.es.json";
import teachers from "../data/teachers.json";
import type { ImportantDatesData, Practice, TibetanDate } from "./types";

type Source = ImportantDatesData;

function ruleKey(rule: Source["importantCelebratoryDates"][number]["rule"]) {
  if (rule.calendar === "gregorian") return `g:${rule.month}-${rule.day}`;
  return `t:${rule.tibMonth}-${rule.tibDay}`;
}

function monthlyRuleKey(rule: Source["monthlyPracticeDays"][number]["rule"]) {
  if ("tibDay" in rule) return `tibDay:${rule.tibDay}`;
  return `tibMonth:${rule.tibMonth}:range:${rule.tibDayRange.min}-${rule.tibDayRange.max}`;
}

function mergeSources(sources: Source[]): ImportantDatesData {
  const merged: ImportantDatesData = {
    source: { id: "merged", sources: sources.map((s) => s.source) },
    notes: [],
    importantCelebratoryDates: [],
    monthlyPracticeDays: [],
  };

  // Important celebratory dates
  // Dedupe rule: avoid inserting the SAME event twice across sources, but allow multiple distinct events
  // to exist on the same day (e.g., multiple teacher anniversaries on the same Tibetan day).
  const seenImportant = new Set<string>();
  for (const s of sources) {
    for (const item of s.importantCelebratoryDates) {
      const key = `${ruleKey(item.rule)}|${item.type}|${item.name.trim().toLowerCase()}`;
      if (seenImportant.has(key)) continue;
      seenImportant.add(key);
      merged.importantCelebratoryDates.push(item);
    }
  }

  // Monthly practice rules: merge by rule key, then dedupe practices within each rule
  const byRule = new Map<string, ImportantDatesData["monthlyPracticeDays"][number]>();
  for (const s of sources) {
    for (const r of s.monthlyPracticeDays) {
      const k = monthlyRuleKey(r.rule);
      const existing = byRule.get(k);
      if (!existing) {
        byRule.set(k, { ...r, practices: [...r.practices] });
        continue;
      }

      const seenPractices = new Set(existing.practices.map((p) => `${p.type}|${p.name.trim().toLowerCase()}`));
      for (const p of r.practices) {
        const pk = `${p.type}|${p.name.trim().toLowerCase()}`;
        if (seenPractices.has(pk)) continue;
        seenPractices.add(pk);
        existing.practices.push(p);
      }
    }
  }
  merged.monthlyPracticeDays = Array.from(byRule.values());

  return merged;
}

const data = mergeSources([
  steinertDates as ImportantDatesData,
  teacherSeedCalendar as ImportantDatesData,
  teachers as ImportantDatesData,
  localDates as ImportantDatesData,
]);

export type DatedPractice = Practice & {
  id: string;
  kind: "celebration" | "monthly";
};

function isSameGregorianMonthDay(d: Date, month: number, day: number) {
  return d.getMonth() + 1 === month && d.getDate() === day;
}

function appliesExceptWhen(t: TibetanDate, p: { exceptWhen?: Array<{ tibMonth: number }> }) {
  if (!p.exceptWhen || p.exceptWhen.length === 0) return false;
  return p.exceptWhen.some((ex) => ex.tibMonth === t.tibMonth);
}

function shouldIncludeOnThisDay(
  params: { id: string; type: Practice["type"] },
  t: TibetanDate
) {
  // Handle doubled/repeated Tibetan days.
  // Convention (as exposed by @hnw/date-tibetan): isLeapDay marks the repeated (second) occurrence.
  // For teacher anniversaries, we prefer showing only once, on the FIRST occurrence.
  const isTeacherAnniversary = params.id.startsWith("seed-teacher-") || params.type === "PARINIRVANA";

  if (!isTeacherAnniversary) return true;

  // If this is the repeated (second) occurrence, hide the anniversary to avoid duplicates.
  return !t.isLeapDay;
}

export function getPracticesForDate(date: Date, t: TibetanDate): DatedPractice[] {
  const out: DatedPractice[] = [];

  // Important celebratory dates
  for (const item of data.importantCelebratoryDates) {
    if (item.rule.calendar === "gregorian") {
      if (isSameGregorianMonthDay(date, item.rule.month, item.rule.day)) {
        out.push({ id: item.id, kind: "celebration", type: item.type, name: item.name, description: item.description, tibetanName: item.tibetanName, image: item.photo });
        for (const extra of item.alsoAdds ?? []) {
          out.push({ id: `${item.id}::${extra.type}::${extra.name}`, kind: "celebration", ...extra });
        }
      }
      continue;
    }

    // tibetan-lunar match
    if (t.tibMonth === item.rule.tibMonth && t.tibDay === item.rule.tibDay) {
      if (!shouldIncludeOnThisDay({ id: item.id, type: item.type }, t)) continue;

      out.push({ id: item.id, kind: "celebration", type: item.type, name: item.name, description: item.description, tibetanName: item.tibetanName, image: item.photo });
      for (const extra of item.alsoAdds ?? []) {
        out.push({ id: `${item.id}::${extra.type}::${extra.name}`, kind: "celebration", ...extra });
      }
    }
  }

  // Monthly practice days
  for (const rule of data.monthlyPracticeDays) {
    if (rule.rule.calendar !== "tibetan-lunar") continue;

    let matches = false;
    if ("tibDay" in rule.rule) {
      matches = t.tibDay === rule.rule.tibDay;
    } else {
      const r = rule.rule;
      matches = t.tibMonth === r.tibMonth && t.tibDay >= r.tibDayRange.min && t.tibDay <= r.tibDayRange.max;
    }

    if (!matches) continue;

    for (const p of rule.practices) {
      // Mirror the repo’s special-casing for precepts in month 1: the original code excludes precepts on month 1 day 8/15 unless it’s the repeated month.
      // In this app we approximate: if it’s Tibetan month 1 and NOT a leap month, hide those specific monthly precepts.
      if (p.type === "PRECEPTS" && (rule.id === "day-8" || rule.id === "day-15-full-moon")) {
        if (t.tibMonth === 1 && !t.isLeapMonth) continue;
      }

      if (appliesExceptWhen(t, p)) continue;

      // Apply special name/description overrides by month
      let name = p.name;
      let description = p.description;
      for (const sc of p.specialCases ?? []) {
        if (sc.when.tibMonth === t.tibMonth) {
          if (sc.nameOverride) name = sc.nameOverride;
          if (sc.descriptionOverride) description = sc.descriptionOverride;
        }
      }

      out.push({ id: `${rule.id}::${p.type}::${name}`, kind: "monthly", type: p.type, name, description });
    }
  }

  // De-dupe
  const seen = new Set<string>();
  const deduped = out.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  // Ordering:
  // 1) Precepts first
  // 2) Teacher anniversaries / parinirvana
  // 3) Everything else
  const priority = (p: DatedPractice) => {
    if (p.type === "PRECEPTS") return 0;
    const looksLikeAnniversary =
      p.kind === "celebration" &&
      (p.type === "PARINIRVANA" || p.id.startsWith("seed-teacher-") || /\baniversario\b/i.test(p.name));
    if (looksLikeAnniversary) return 1;
    return 2;
  };

  return deduped.sort((a, b) => {
    const pa = priority(a);
    const pb = priority(b);
    if (pa !== pb) return pa - pb;
    return a.name.localeCompare(b.name, "es");
  });
}

export function practiceBadgeColor(type: Practice["type"]) {
  switch (type) {
    case "BUDDHA_DAY":
      return "border-saffron-600/30 bg-saffron-50 text-saffron-600";
    case "MOON":
      return "border-ink-900/15 bg-white text-ink-900";
    case "TSOG":
      return "border-lotus-600/25 bg-pink-50 text-lotus-600";
    case "TARA":
      return "border-jade-600/25 bg-emerald-50 text-jade-600";
    case "MEDICINE_BUDDHA":
      return "border-indigo-600/20 bg-indigo-50 text-indigo-700";
    case "PRECEPTS":
      return "border-amber-700/20 bg-amber-50 text-amber-800";
    case "PROTECTOR_PUJA":
      return "border-slate-600/25 bg-slate-50 text-slate-700";
    case "PARINIRVANA":
      return "border-purple-700/20 bg-purple-50 text-purple-800";
    default:
      return "border-ink-900/15 bg-white text-ink-900";
  }
}
