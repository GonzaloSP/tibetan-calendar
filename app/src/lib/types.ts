export type TibetanDate = {
  rabjung: number;
  tibYear: number;
  tibMonth: number;
  isLeapMonth: boolean;
  tibDay: number;
  isLeapDay: boolean;
};

export type PracticeType =
  | "BUDDHA_DAY"
  | "MOON"
  | "TSOG"
  | "TARA"
  | "MEDICINE_BUDDHA"
  | "PRECEPTS"
  | "PROTECTOR_PUJA"
  | "PARINIRVANA"
  | "OTHER";

export type Practice = {
  type: PracticeType;
  name: string;
  description: string;
};

export type ImportantDatesData = {
  source: unknown;
  notes?: string[];
  importantCelebratoryDates: Array<{
    id: string;
    name: string;
    type: PracticeType;
    rule:
      | { calendar: "gregorian"; month: number; day: number }
      | { calendar: "tibetan-lunar"; tibMonth: number; tibDay: number };
    description: string;
    alsoAdds?: Practice[];
  }>;
  monthlyPracticeDays: Array<{
    id: string;
    rule:
      | { calendar: "tibetan-lunar"; tibDay: number }
      | {
          calendar: "tibetan-lunar";
          tibMonth: number;
          tibDayRange: { min: number; max: number };
        };
    practices: Array<
      Practice & {
        exceptWhen?: Array<{
          tibMonth: number;
          monthFlagNot?: number[]; // ignored in this app, kept for compatibility
        }>;
        specialCases?: Array<{
          when: { tibMonth: number };
          nameOverride?: string;
          descriptionOverride?: string;
        }>;
      }
    >;
  }>;
};
