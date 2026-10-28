"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { addDays, atTime, dayKey, isSameDay, startOfDay } from "./date";
import { createFormatters, type HourCycle, type HourLabel } from "./format";
import { defaultLabels, type ScheduleTimePickerLabels } from "./labels";
import type { ScheduleTimePickerValue, ScheduleValue, ScheduleValueType } from "./types";
import { useNow } from "./use-now";
import { parseValue, serializeValue } from "./value";
import { exactMomentIn, resolveTimeZone, wallClockIn } from "./zone";

/** `value`, `defaultValue` and `onChange`, typed by `valueType` */
export interface ScheduleValueProps<T extends ScheduleValueType = "parts"> {
  /**
   * What `onChange` gives you, and what `value` / `defaultValue` take:
   * `"parts"` `{ date, hour, minute }` · `"date"` a `Date` · `"iso"`
   * `2026-10-31T22:30:00.000Z` · `"offset"` `2026-10-31T15:30:00-07:00` ·
   * `"local"` `2026-10-31T15:30` (no time zone). @default "parts"
   */
  valueType?: T;
  /** Controlled value -- works with RHF Controller's field.value */
  value?: ScheduleValue<T> | null;
  /** Initial value when uncontrolled */
  defaultValue?: ScheduleValue<T> | null;
  /** Called with a complete value, or null once it's cleared -- works with RHF Controller's field.onChange */
  onChange?: (value: ScheduleValue<T> | null) => void;
}

export interface SchedulePickerOptions {
  /** Number of selectable days, starting today. @default 14 */
  dayCount?: number;
  /**
   * Minutes between selectable times, 1–60. Steps that divide 60 (1, 5, 10,
   * 15, 30…) space evenly; 60 is hourly and hides the minute column.
   * @default 5
   */
  minuteStep?: number;
  /** @default 12 */
  hourCycle?: HourCycle;
  /** BCP 47 tag for day, month and time names. @default "en-US" */
  locale?: string;
  /** Override any UI string */
  labels?: Partial<ScheduleTimePickerLabels>;
  /**
   * IANA time zone the picker works in, e.g. `"America/New_York"`: its today,
   * its times, and what `value` means. @default the browser's
   */
  timeZone?: string;
  /**
   * Block individual slots, e.g. outside business hours or already booked.
   * `slot` reads in the picker's time zone (`slot.getHours()` is the hour as
   * shown); `moment` is the exact moment, to compare with stored times. They
   * only differ with `timeZone`.
   */
  isSlotDisabled?: (slot: Date, moment: Date) => boolean;
}

export type UseSchedulePickerOptions<T extends ScheduleValueType = "parts"> = SchedulePickerOptions &
  ScheduleValueProps<T>;

export interface PickerDay {
  date: Date;
  key: string;
  isToday: boolean;
  isTomorrow: boolean;
  isSelected: boolean;
  isDisabled: boolean;
}

export interface PickerHour extends HourLabel {
  value: number;
  isSelected: boolean;
  isDisabled: boolean;
}

export interface PickerMinute {
  value: number;
  label: string;
  isSelected: boolean;
  isDisabled: boolean;
}

type Value = ScheduleTimePickerValue | null;

interface Draft {
  day: Date;
  hour: number | null;
  minute: number | null;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function valueKey(value: Value) {
  return value ? `${dayKey(value.date)} ${value.hour}:${value.minute}` : "";
}

/** A whole number of minutes from 1 to 60; anything unusable falls back to 5 */
function normalizeStep(step: number) {
  return Number.isFinite(step) ? Math.min(60, Math.max(1, Math.round(step))) : 5;
}

function draftFrom(value: Value, fallbackDay: Date): Draft {
  return value
    ? { day: startOfDay(value.date), hour: value.hour, minute: value.minute }
    : { day: fallbackDay, hour: null, minute: null };
}

/**
 * Headless core: selection state, availability and formatting.
 * Every bundled variant is built on it -- use it to build your own.
 */
export function useSchedulePicker<T extends ScheduleValueType = "parts">({
  valueType = "parts" as T,
  value: valueInput,
  defaultValue = null,
  onChange,
  dayCount = 14,
  minuteStep: rawMinuteStep = 5,
  hourCycle = 12,
  locale = "en-US",
  labels: labelOverrides,
  timeZone,
  isSlotDisabled,
}: UseSchedulePickerOptions<T> = {}) {
  // `today` follows the clock, so a picker left open past midnight rolls over.
  // Until the browser's clock is read (server render, hydration) `now` is null:
  // no days, nothing available, and absolute dates instead of "Today".
  // With a time zone, `now` and every date below read its wall clock.
  const zone = resolveTimeZone(timeZone);
  const clock = useNow();
  const now = useMemo(() => (clock && zone ? wallClockIn(clock, zone) : clock), [clock, zone]);
  const nowTime = now ? now.getTime() : null;
  const hasClock = nowTime !== null;
  const todayTime = startOfDay(now ?? new Date(0)).getTime();
  const today = useMemo(() => new Date(todayTime), [todayTime]);
  const dayDates = useMemo(
    () => (hasClock ? Array.from({ length: dayCount }, (_, i) => addDays(today, i)) : []),
    [hasClock, today, dayCount],
  );
  const rangeEnd = addDays(today, dayCount).getTime();

  const labels = useMemo(() => ({ ...defaultLabels, ...labelOverrides }), [labelOverrides]);
  const fmt = useMemo(() => createFormatters(locale, hourCycle), [locale, hourCycle]);
  const minuteStep = normalizeStep(rawMinuteStep);
  const minuteSlots = useMemo(() => {
    const slots: number[] = [];
    for (let m = 0; m < 60; m += minuteStep) slots.push(m);
    return slots;
  }, [minuteStep]);

  // ── Value (controlled or uncontrolled) ─────────────────────────
  // Kept as parts inside; `valueType` only shapes what goes in and out

  const value = parseValue(valueInput, zone);
  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState<Value>(
    () => parseValue(defaultValue, zone) ?? null,
  );
  const committed = (isControlled ? value : uncontrolledValue) ?? null;
  const committedKey = valueKey(committed);

  const commit = useCallback(
    (next: Value) => {
      if (valueKey(next) === committedKey) return;
      if (!isControlled) setUncontrolledValue(next);
      onChange?.(next && serializeValue(next, valueType, zone));
    },
    [committedKey, isControlled, onChange, valueType, zone],
  );

  // ── Availability ───────────────────────────────────────────────

  const isSlotAvailable = useCallback(
    (day: Date, hour: number, minute: number) => {
      const slot = atTime(day, hour, minute);
      const time = slot.getTime();
      if (nowTime === null || time <= nowTime || time >= rangeEnd) return false;
      // Times skipped when clocks spring forward (2:30 AM) don't exist: in the
      // picker's zone, and -- as local dates can't hold them -- in the browser's
      if (slot.getHours() !== hour || slot.getMinutes() !== minute) return false;
      const moment = zone ? exactMomentIn(day, hour, minute, zone) : slot;
      return moment !== null && !isSlotDisabled?.(slot, moment);
    },
    [nowTime, rangeEnd, zone, isSlotDisabled],
  );

  const isHourAvailable = useCallback(
    (day: Date, hour: number) => minuteSlots.some((m) => isSlotAvailable(day, hour, m)),
    [minuteSlots, isSlotAvailable],
  );

  const isDayAvailable = useCallback(
    (day: Date) => HOURS.some((h) => isHourAvailable(day, h)),
    [isHourAvailable],
  );

  // ── Draft: what the panel shows while the user is picking ──────

  const [draft, setDraft] = useState<Draft>(() => draftFrom(committed, today));

  // Adopt values set from outside (form reset, programmatic updates). Our own
  // commits already match the draft, so they never clobber a half-made pick.
  const [syncedKey, setSyncedKey] = useState(committedKey);
  if (syncedKey !== committedKey) {
    setSyncedKey(committedKey);
    const draftKey =
      draft.hour !== null && draft.minute !== null
        ? valueKey({ date: draft.day, hour: draft.hour, minute: draft.minute })
        : "";
    if (draftKey !== committedKey) setDraft(draftFrom(committed, today));
  }

  // Parts of the draft that slipped into the past simply drop out
  const selectedDay = isDayAvailable(draft.day)
    ? draft.day
    : (dayDates.find((d) => isDayAvailable(d)) ?? today);
  const selectedHour =
    draft.hour !== null && isHourAvailable(selectedDay, draft.hour) ? draft.hour : null;
  const selectedMinute =
    selectedHour !== null &&
    draft.minute !== null &&
    isSlotAvailable(selectedDay, selectedHour, draft.minute)
      ? draft.minute
      : null;

  // ...and so does a committed value (once there's a clock to compare it with)
  useEffect(() => {
    if (hasClock && committed && !isSlotAvailable(committed.date, committed.hour, committed.minute)) {
      commit(null);
    }
  }, [hasClock, committed, isSlotAvailable, commit]);

  // ── Actions (each returns whether it did anything) ─────────────

  const selectDay = (date: Date) => {
    const day = startOfDay(date);
    if (!isDayAvailable(day)) return false;
    let hour = selectedHour;
    let minute = selectedMinute;
    if (hour !== null && !isHourAvailable(day, hour)) {
      hour = null;
      minute = null;
    } else if (hour !== null && minute !== null && !isSlotAvailable(day, hour, minute)) {
      minute = null;
    }
    setDraft({ day, hour, minute });
    commit(hour !== null && minute !== null ? { date: day, hour, minute } : null);
    return true;
  };

  const selectHour = (hour: number) => {
    if (!isHourAvailable(selectedDay, hour)) return false;
    let minute =
      selectedMinute !== null && isSlotAvailable(selectedDay, hour, selectedMinute)
        ? selectedMinute
        : null;
    // an hourly step has a single slot, so the hour alone completes the pick
    if (minute === null && minuteSlots.length === 1) minute = minuteSlots[0];
    setDraft({ day: selectedDay, hour, minute });
    commit(minute !== null ? { date: selectedDay, hour, minute } : null);
    return true;
  };

  const selectMinute = (minute: number) => {
    if (selectedHour === null || !isSlotAvailable(selectedDay, selectedHour, minute)) {
      return false;
    }
    setDraft({ day: selectedDay, hour: selectedHour, minute });
    commit({ date: selectedDay, hour: selectedHour, minute });
    return true;
  };

  /** Pick a full date-time at once (presets, slot grids, wheels) */
  const selectSlot = (date: Date) => {
    const day = startOfDay(date);
    const hour = date.getHours();
    const minute = date.getMinutes();
    if (!isSlotAvailable(day, hour, minute)) return false;
    setDraft({ day, hour, minute });
    commit({ date: day, hour, minute });
    return true;
  };

  const clear = () => {
    setDraft({ day: today, hour: null, minute: null });
    commit(null);
  };

  // ── Render data ────────────────────────────────────────────────

  const days: PickerDay[] = dayDates.map((date, i) => ({
    date,
    key: dayKey(date),
    isToday: i === 0,
    isTomorrow: i === 1,
    isSelected: isSameDay(date, selectedDay),
    isDisabled: !isDayAvailable(date),
  }));

  const hours: PickerHour[] = HOURS.map((hour) => ({
    ...fmt.hour(hour),
    value: hour,
    isSelected: hour === selectedHour,
    isDisabled: !isHourAvailable(selectedDay, hour),
  }));

  // A loaded value can sit off the grid (10:07 with a 15-minute step);
  // list it anyway so the current pick is visible and stays selected
  const listedMinutes =
    selectedMinute !== null && !minuteSlots.includes(selectedMinute)
      ? [...minuteSlots, selectedMinute].sort((a, b) => a - b)
      : minuteSlots;

  const minutes: PickerMinute[] =
    selectedHour === null
      ? []
      : listedMinutes.map((minute) => ({
          value: minute,
          label: `:${String(minute).padStart(2, "0")}`,
          isSelected: minute === selectedMinute,
          isDisabled: !isSlotAvailable(selectedDay, selectedHour, minute),
        }));

  /** "Today" · "Tomorrow" · "Oct 28" */
  const formatDay = (date: Date) =>
    hasClock && isSameDay(date, today)
      ? labels.today
      : hasClock && isSameDay(date, addDays(today, 1))
        ? labels.tomorrow
        : fmt.monthDay(date);

  /** "Today, 3:05 PM" */
  const formatValue = (v: ScheduleTimePickerValue) =>
    `${formatDay(v.date)}, ${fmt.time(v.hour, v.minute)}`;

  return {
    /** The picked value as parts, whatever `valueType` is */
    value: committed,
    valueType,
    /** The `timeZone` in use; `undefined` means the browser's */
    timeZone: zone,
    /** The current time, read in the picker's time zone */
    now,
    today,
    days,
    hours,
    minutes,
    minuteSlots,
    minuteStep,
    hourCycle,
    selectedDay,
    selectedHour,
    selectedMinute,
    labels,
    fmt,
    formatDay,
    formatValue,
    isSlotAvailable,
    isHourAvailable,
    isDayAvailable,
    selectDay,
    selectHour,
    selectMinute,
    selectSlot,
    clear,
  };
}

export type SchedulePickerState = ReturnType<typeof useSchedulePicker>;
