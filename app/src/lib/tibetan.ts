import { CalendarTibetan } from "@hnw/date-tibetan";
import type { TibetanDate } from "./types";

export function toTibetanDate(date: Date): TibetanDate {
  const t = new CalendarTibetan().fromDate(date).get();
  const [rabjung, tibYear, tibMonth, isLeapMonth, tibDay, isLeapDay] = t;
  return {
    rabjung,
    tibYear,
    tibMonth,
    isLeapMonth,
    tibDay,
    isLeapDay,
  };
}

export function formatTibetanDate(t: TibetanDate): string {
  const leapMonth = t.isLeapMonth ? " (leap month)" : "";
  const leapDay = t.isLeapDay ? " (repeated day)" : "";
  return `Rabjung ${t.rabjung}, Year ${t.tibYear} · Month ${t.tibMonth}${leapMonth} · Day ${t.tibDay}${leapDay}`;
}
