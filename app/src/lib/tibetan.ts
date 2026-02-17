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
  const leapMonth = t.isLeapMonth ? " (mes duplicado)" : "";
  const leapDay = t.isLeapDay ? " (día repetido)" : "";
  return `Rabjung ${t.rabjung}, Año ${t.tibYear} · Mes ${t.tibMonth}${leapMonth} · Día ${t.tibDay}${leapDay}`;
}
