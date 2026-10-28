import type { ScheduleTimePickerValue } from "./types";
import { momentIn, resolveTimeZone, wallClockIn, zoneOffset } from "./zone";

export function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, amount: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Stable id for a calendar day, independent of the time of day */
export function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function atTime(day: Date, hour: number, minute: number) {
  const d = new Date(day);
  d.setHours(hour, minute, 0, 0);
  return d;
}

/** Round up to the next multiple of `step` minutes within the hour */
export function ceilToStep(date: Date, step: number) {
  const d = new Date(date);
  if (d.getSeconds() || d.getMilliseconds()) d.setMinutes(d.getMinutes() + 1, 0, 0);
  const minute = Math.ceil(d.getMinutes() / step) * step;
  if (minute >= 60) d.setHours(d.getHours() + 1, 0, 0, 0);
  else d.setMinutes(minute, 0, 0);
  return d;
}

// Every helper below reads and writes local time, or the wall clock of
// `timeZone` when one is given -- the same zone you give the picker.

/** The exact moment of a value */
export function toDate(value: ScheduleTimePickerValue, timeZone?: string) {
  const zone = resolveTimeZone(timeZone);
  return zone
    ? momentIn(value.date, value.hour, value.minute, zone)
    : atTime(value.date, value.hour, value.minute);
}

/** A moment as a value: its local time, or its wall-clock time in `timeZone` */
export function fromDate(date: Date, timeZone?: string): ScheduleTimePickerValue {
  const zone = resolveTimeZone(timeZone);
  const wall = zone ? wallClockIn(date, zone) : date;
  return { date: startOfDay(wall), hour: wall.getHours(), minute: wall.getMinutes() };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** `2026-10-26T15:05` — the same shape `<input type="datetime-local">` submits */
export function toLocalISO(value: ScheduleTimePickerValue) {
  const d = value.date;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(value.hour)}:${pad(value.minute)}`;
}

/** `2026-10-26T22:05:00.000Z` — the exact moment in UTC */
export function toISO(value: ScheduleTimePickerValue, timeZone?: string) {
  return toDate(value, timeZone).toISOString();
}

/** `2026-10-26T15:05:00-07:00` — the time as picked, with the UTC offset in effect then */
export function toOffsetISO(value: ScheduleTimePickerValue, timeZone?: string) {
  const zone = resolveTimeZone(timeZone);
  const moment = toDate(value, zone);
  const offset = zone ? zoneOffset(moment.getTime(), zone) : -moment.getTimezoneOffset();
  const sign = offset < 0 ? "-" : "+";
  const abs = Math.abs(offset);
  return `${toLocalISO(value)}:00${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

const ISO_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3})\d*)?)?\s*(Z|[+-]\d{2}:?\d{2})?$/i;

/**
 * Reads what `toISO`, `toOffsetISO` and `toLocalISO` write. A string with a
 * zone (`Z`, `-07:00`) is an exact moment, turned into local time (or the
 * time in `timeZone`); one without is taken as that time as-is. Anything
 * else gives `null`.
 */
export function fromISO(text: string, timeZone?: string): ScheduleTimePickerValue | null {
  const match = ISO_PATTERN.exec(text.trim());
  if (!match) return null;
  const [year, month, day, hour, minute] = match.slice(1, 6).map(Number);
  const second = Number(match[6] ?? 0);
  const ms = Number((match[7] ?? "0").padEnd(3, "0"));
  const zone = match[8];
  const calendar = new Date(Date.UTC(year, month - 1, day));
  if (calendar.getUTCMonth() !== month - 1 || calendar.getUTCDate() !== day || hour > 23 || minute > 59) {
    return null;
  }
  if (!zone) return { date: new Date(year, month - 1, day), hour, minute };
  const zoneMinutes =
    zone.toUpperCase() === "Z"
      ? 0
      : (zone[0] === "-" ? -1 : 1) * (Number(zone.slice(1, 3)) * 60 + Number(zone.slice(-2)));
  const instant = Date.UTC(year, month - 1, day, hour, minute, second, ms) - zoneMinutes * 60_000;
  return fromDate(new Date(instant), timeZone);
}
