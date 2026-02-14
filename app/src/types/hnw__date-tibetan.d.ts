declare module "@hnw/date-tibetan" {
  export class CalendarTibetan {
    constructor(
      rabjung?: number,
      year?: number,
      month?: number,
      leapMonth?: boolean,
      day?: number,
      leapDay?: boolean
    );

    fromGregorian(year: number, month: number, day: number): CalendarTibetan;
    fromDate(date: Date): CalendarTibetan;

    toGregorian(): { year: number; month: number; day: number };
    toDate(): Date;

    get(): [
      rabjung: number,
      year: number,
      month: number,
      leapMonth: boolean,
      day: number,
      leapDay: boolean
    ];
  }
}
