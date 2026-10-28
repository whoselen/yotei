import { atTime } from "./date";

export type HourCycle = 12 | 24;

export interface HourLabel {
  label: string;
  /** "AM" / "PM" in 12-hour mode, empty in 24-hour mode */
  period: string;
  /** Some locales (ja, ko, zh) put the period before the number */
  periodFirst: boolean;
}

/** Intl formatters for one locale + hour cycle, built once and reused */
export function createFormatters(locale: string, hourCycle: HourCycle) {
  const hc = hourCycle === 12 ? "h12" : "h23";
  const make = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, options);

  const weekday = make({ weekday: "short" });
  const month = make({ month: "short" });
  const monthDay = make({ month: "short", day: "numeric" });
  const monthYear = make({ month: "short", year: "numeric" });
  const fullDate = make({ weekday: "long", month: "long", day: "numeric" });
  const time = make({ hour: "numeric", minute: "2-digit", hourCycle: hc });
  const hourOnly = make({ hour: "numeric", hourCycle: hc });

  const base = new Date(2000, 0, 1);
  const hours: HourLabel[] = Array.from({ length: 24 }, (_, h) => {
    const parts = hourOnly.formatToParts(atTime(base, h, 0));
    const hourIndex = parts.findIndex((p) => p.type === "hour");
    const periodIndex = parts.findIndex((p) => p.type === "dayPeriod");
    return {
      label: parts[hourIndex]?.value ?? String(h),
      period: parts[periodIndex]?.value ?? "",
      periodFirst: periodIndex !== -1 && periodIndex < hourIndex,
    };
  });

  return {
    weekday: (date: Date) => weekday.format(date),
    month: (date: Date) => month.format(date),
    monthDay: (date: Date) => monthDay.format(date),
    monthYear: (date: Date) => monthYear.format(date),
    /** "Oct 2026", or "Oct – Nov 2026" when the range crosses a month */
    monthYearRange: (start: Date, end: Date) => monthYear.formatRange(start, end),
    fullDate: (date: Date) => fullDate.format(date),
    time: (hour: number, minute: number) => time.format(atTime(base, hour, minute)),
    hour: (hour: number) => hours[hour],
  };
}

export type Formatters = ReturnType<typeof createFormatters>;
