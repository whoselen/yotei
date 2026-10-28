"use client";

import { useEffect, useRef, type ButtonHTMLAttributes, type KeyboardEvent } from "react";
import { dayKey } from "../core/date";
import type { PickerHour, PickerMinute, SchedulePickerState } from "../core/use-schedule-picker";
import { useParts } from "./config";
import { IconSlot } from "./trigger";
import { flag } from "./utils";

/** What a custom `Hour` gets: the hour, plus the `<button>` props -- same contract as `DayProps` */
export interface HourProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  hour: PickerHour;
}

/** What a custom `Minute` gets: the minute, plus the `<button>` props -- same contract as `DayProps` */
export interface MinuteProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  minute: PickerMinute;
}

function DefaultHour({ hour, ...props }: HourProps) {
  return <button {...props} />;
}

function DefaultMinute({ minute, ...props }: MinuteProps) {
  return <button {...props} />;
}

// options are found by the props every option spreads, so custom components work too
const OPEN_OPTION = "[aria-pressed]:not([data-disabled])";

export interface TimeColumnsProps {
  picker: SchedulePickerState;
  /** Whether the columns are on screen -- re-centers both lists when it turns true */
  visible?: boolean;
  /** Called once a pick is complete (a minute, or the hour with an hourly step) */
  onComplete?: () => void;
}

/** Scroll the selected option -- or the first available one -- to the top of its list */
function scrollToActive(list: HTMLElement | null) {
  const target =
    list?.querySelector<HTMLElement>("[aria-pressed='true']") ??
    list?.querySelector<HTMLElement>(OPEN_OPTION);
  if (!list || !target) return;
  // measured from rects so it doesn't depend on how the list is positioned
  const top =
    target.getBoundingClientRect().top - list.getBoundingClientRect().top - list.clientTop + list.scrollTop;
  list.scrollTo({ top: top - 4, behavior: "smooth" });
}

const ARROW_KEYS: Record<string, (index: number, last: number) => number> = {
  ArrowDown: (i) => i + 1,
  ArrowUp: (i) => i - 1,
  PageDown: (i) => i + 5,
  PageUp: (i) => i - 5,
  Home: () => 0,
  End: (_, last) => last,
};

/** Arrow keys move between options, so a 60-minute list is one tab stop, not sixty */
function handleListKeyDown(event: KeyboardEvent<HTMLDivElement>) {
  const move = ARROW_KEYS[event.key];
  if (!move) return;
  const options = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(OPEN_OPTION));
  const index = options.indexOf(document.activeElement as HTMLElement);
  if (index === -1) return;
  event.preventDefault();
  const last = options.length - 1;
  options[Math.min(last, Math.max(0, move(index, last)))]?.focus();
}

export function TimeColumns({ picker, visible = true, onComplete }: TimeColumnsProps) {
  const { labels, hours, minutes, selectedHour, selectedMinute } = picker;
  const { cls, text, icons, components } = useParts();
  const Hour = components.Hour ?? DefaultHour;
  const Minute = components.Minute ?? DefaultMinute;
  const hourListRef = useRef<HTMLDivElement>(null);
  const minuteListRef = useRef<HTMLDivElement>(null);
  const selectedDayKey = dayKey(picker.selectedDay);
  // an hourly step has nothing to choose in the minute column
  const hourly = picker.minuteSlots.length === 1;

  useEffect(() => {
    if (!visible) return;
    const frame = requestAnimationFrame(() => scrollToActive(hourListRef.current));
    return () => cancelAnimationFrame(frame);
  }, [visible, selectedDayKey]);

  // with small steps the first open minute can be far down (e.g. :38 of 60)
  useEffect(() => {
    if (!visible) return;
    const frame = requestAnimationFrame(() => scrollToActive(minuteListRef.current));
    return () => cancelAnimationFrame(frame);
  }, [visible, selectedDayKey, selectedHour]);

  const hourTabStop = selectedHour ?? hours.find((h) => !h.isDisabled)?.value;
  const minuteTabStop = selectedMinute ?? minutes.find((m) => !m.isDisabled)?.value;

  return (
    <div className={cls("time")}>
      <div className={cls("column")} data-column="hour">
        <div className={cls("columnLabel")} style={text("columnLabel")}>
          {labels.hour}
        </div>
        <div
          ref={hourListRef}
          role="group"
          aria-label={labels.hour}
          onKeyDown={handleListKeyDown}
          className={cls("list")}
        >
          {hours.map((hour) => {
            const period = hour.period && (
              <span
                className={cls("optionPeriod")}
                style={text("optionPeriod")}
                data-position={hour.periodFirst ? "start" : "end"}
              >
                {hour.period}
              </span>
            );
            return (
              <Hour
                key={hour.value}
                hour={hour}
                type="button"
                disabled={hour.isDisabled}
                tabIndex={hour.value === hourTabStop ? 0 : -1}
                aria-pressed={hour.isSelected}
                data-selected={flag(hour.isSelected)}
                data-disabled={flag(hour.isDisabled)}
                onClick={() => {
                  if (picker.selectHour(hour.value) && hourly) onComplete?.();
                }}
                className={cls("option")}
                style={text("option")}
              >
                <span className={cls("optionLabel")}>
                  {hour.periodFirst && period}
                  {hour.label}
                  {!hour.periodFirst && period}
                </span>
                {hour.isSelected && <IconSlot icon={icons.check} className={cls("optionCheck")} />}
              </Hour>
            );
          })}
        </div>
      </div>

      {!hourly && (
        <div className={cls("column")} data-column="minute">
          <div className={cls("columnLabel")} style={text("columnLabel")}>
            {labels.minute}
          </div>
          <div
            ref={minuteListRef}
            role="group"
            aria-label={labels.minute}
            onKeyDown={handleListKeyDown}
            className={cls("list")}
          >
            {selectedHour === null ? (
              <div className={cls("empty")} style={text("empty")}>
                {labels.pickHourFirst}
              </div>
            ) : (
              minutes.map((minute) => (
                <Minute
                  key={minute.value}
                  minute={minute}
                  type="button"
                  disabled={minute.isDisabled}
                  tabIndex={minute.value === minuteTabStop ? 0 : -1}
                  aria-pressed={minute.isSelected}
                  data-selected={flag(minute.isSelected)}
                  data-disabled={flag(minute.isDisabled)}
                  onClick={() => {
                    if (picker.selectMinute(minute.value)) onComplete?.();
                  }}
                  className={cls("option")}
                  style={text("option")}
                >
                  <span className={cls("optionLabel")}>{minute.label}</span>
                  {minute.isSelected && (
                    <IconSlot icon={icons.check} className={cls("optionCheck")} />
                  )}
                </Minute>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
