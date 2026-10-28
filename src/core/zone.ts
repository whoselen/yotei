// Wall-clock math in any IANA time zone, with nothing but Intl.
//
// The picker works with dates whose *local* fields (getDate(), getHours()…)
// read the wall clock of its time zone. Without `timeZone` that's simply the
// browser's own time; with one, these convert at the edges: the clock coming
// in, and the value going out.

const MINUTE = 60_000;
const DAY = 86_400_000;
// zones change offset on the quarter hour (UTC), so an offset holds per bucket
const BUCKET = 15 * MINUTE;

const formatters = new Map<string, Intl.DateTimeFormat>();
const offsets = new Map<string, Map<number, number>>();
const resolved = new Map<string, string | undefined>();

function formatter(timeZone: string) {
  let format = formatters.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
    formatters.set(timeZone, format);
  }
  return format;
}

/** `timeZone` if the browser (or server) knows it; otherwise warns once and falls back to local time */
export function resolveTimeZone(timeZone: string | undefined) {
  if (!timeZone) return undefined;
  if (!resolved.has(timeZone)) {
    try {
      formatter(timeZone);
      resolved.set(timeZone, timeZone);
    } catch {
      console.warn(`[react-schedule-time-picker] Unknown time zone "${timeZone}"; using local time instead.`);
      resolved.set(timeZone, undefined);
    }
  }
  return resolved.get(timeZone);
}

/** Minutes `timeZone` is ahead of UTC at a moment */
export function zoneOffset(ms: number, timeZone: string) {
  let cache = offsets.get(timeZone);
  if (!cache) offsets.set(timeZone, (cache = new Map()));
  const bucket = Math.floor(ms / BUCKET);
  let offset = cache.get(bucket);
  if (offset === undefined) {
    const at = bucket * BUCKET;
    const p: Record<string, number> = {};
    for (const part of formatter(timeZone).formatToParts(at)) p[part.type] = Number(part.value);
    const wall = Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute, p.second);
    offset = Math.round((wall - at) / MINUTE);
    cache.set(bucket, offset);
  }
  return offset;
}

/** The wall clock in `timeZone` at `moment`, as a date whose local fields read it */
export function wallClockIn(moment: Date, timeZone: string) {
  const w = new Date(moment.getTime() + zoneOffset(moment.getTime(), timeZone) * MINUTE);
  return new Date(
    w.getUTCFullYear(),
    w.getUTCMonth(),
    w.getUTCDate(),
    w.getUTCHours(),
    w.getUTCMinutes(),
    w.getUTCSeconds(),
    w.getUTCMilliseconds(),
  );
}

/**
 * When a wall-clock time happens in `timeZone`: the earlier moment when clocks
 * fall back and it happens twice, `null` when they spring past it.
 */
export function exactMomentIn(day: Date, hour: number, minute: number, timeZone: string) {
  const wall = Date.UTC(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute);
  // the offsets a day either side cover any change around this time
  const before = wall - zoneOffset(wall - DAY, timeZone) * MINUTE;
  const after = wall - zoneOffset(wall + DAY, timeZone) * MINUTE;
  const fits = (ms: number) => ms + zoneOffset(ms, timeZone) * MINUTE === wall;
  const moment = fits(before) && fits(after) ? Math.min(before, after) : fits(before) ? before : fits(after) ? after : null;
  return moment === null ? null : new Date(moment);
}

/** Like `exactMomentIn`, but a skipped time moves forward like `new Date()` does (2:30 AM → 3:30 AM) */
export function momentIn(day: Date, hour: number, minute: number, timeZone: string) {
  return (
    exactMomentIn(day, hour, minute, timeZone) ??
    new Date(
      Date.UTC(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute) -
        zoneOffset(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate()) - DAY, timeZone) * MINUTE,
    )
  );
}
