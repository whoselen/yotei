import { fromDate, fromISO, toDate, toISO, toLocalISO, toOffsetISO } from "./date";
import type { ScheduleTimePickerValue, ScheduleValue, ScheduleValueType } from "./types";

type Parts = ScheduleTimePickerValue;

/**
 * Any accepted input -- parts, a `Date` or one of the strings -- as parts in
 * `timeZone` (local time without one). Read by what it is rather than by
 * `valueType`, so a server-sent ISO string works as a `defaultValue` of any
 * picker. `undefined` stays `undefined` (uncontrolled); anything unreadable
 * is `null`.
 */
export function parseValue(
  input: ScheduleValue<ScheduleValueType> | null | undefined,
  timeZone?: string,
) {
  if (input === undefined || input === null) return input;
  if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : fromDate(input, timeZone);
  if (typeof input === "string") return fromISO(input, timeZone);
  return input;
}

export function serializeValue<T extends ScheduleValueType>(
  parts: Parts,
  type: T,
  timeZone?: string,
): ScheduleValue<T>;
export function serializeValue(
  parts: Parts,
  type: ScheduleValueType,
  timeZone?: string,
): ScheduleValue<ScheduleValueType> {
  switch (type) {
    case "date":
      return toDate(parts, timeZone);
    case "iso":
      return toISO(parts, timeZone);
    case "offset":
      return toOffsetISO(parts, timeZone);
    case "local":
      return toLocalISO(parts);
    default:
      return parts;
  }
}

/** The string a hidden form input submits: `local` stays local, every exact-moment type sends a moment */
export function serializeForForm(parts: Parts, type: ScheduleValueType, timeZone?: string) {
  return type === "offset"
    ? toOffsetISO(parts, timeZone)
    : type === "date" || type === "iso"
      ? toISO(parts, timeZone)
      : toLocalISO(parts);
}
