export interface ScheduleTimePickerValue {
  /** The picked day (local midnight) */
  date: Date;
  /** 0–23 */
  hour: number;
  /** 0–59 */
  minute: number;
}

/** What `value`, `defaultValue` and `onChange` use for each `valueType` */
export interface ScheduleValues {
  /** `{ date, hour, minute }` in local time -- the original component's shape */
  parts: ScheduleTimePickerValue;
  /** The exact moment */
  date: Date;
  /** The exact moment in UTC: `2026-10-31T22:30:00.000Z` */
  iso: string;
  /** Local time as picked, with its UTC offset: `2026-10-31T15:30:00-07:00` */
  offset: string;
  /** Local time with no time zone, like `<input type="datetime-local">`: `2026-10-31T15:30` */
  local: string;
}

export type ScheduleValueType = keyof ScheduleValues;

export type ScheduleValue<T extends ScheduleValueType = "parts"> = ScheduleValues[T];
