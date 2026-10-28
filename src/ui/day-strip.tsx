"use client";

import {
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { dayKey } from "../core/date";
import type { PickerDay, SchedulePickerState } from "../core/use-schedule-picker";
import { useConfig, useParts } from "./config";
import { flag } from "./utils";

/**
 * What a custom `Day` gets: the day, plus everything to spread on its
 * `<button>` -- click, roving focus, ARIA, `data-*` state, the default class
 * and, as `children`, the default content (pass your own children to replace it).
 */
export interface DayProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  day: PickerDay;
  /** The top line as the default cell shows it: "Today", "Tmrw", "Nov" on the 1st, else "Wed" */
  label: string;
}

function DefaultDay({ day, label, ...props }: DayProps) {
  return <button {...props} />;
}

export interface DayStripProps {
  picker: SchedulePickerState;
  /** Whether the strip is on screen -- scrolls the selected day into view when it turns true */
  visible?: boolean;
  /** Rows of days; defaults to the picker's `dayRows`, then 1 (a scrolling strip) */
  rows?: number;
}

/** `dayRows` as laid out: a whole number from 1 to the number of days */
export function dayRowCount(rows: number | undefined, dayCount: number) {
  return Math.min(Math.max(1, Math.floor(rows ?? 1) || 1), Math.max(1, dayCount));
}

/** Roughly how much taller rows of days make the panel than the strip -- for flip decisions */
export function extraDayRowsHeight(rows: number | undefined, dayCount: number) {
  return (dayRowCount(rows, dayCount) - 1) * 48;
}

/**
 * Arrow keys move between days, ↑ ↓ by a whole row in the grid, so all the
 * days are one tab stop. Landing on a past or blocked day moves on past it.
 */
function handleDayKeyDown(event: KeyboardEvent<HTMLDivElement>, rowLength: number | null) {
  // found by the props every day spreads, so custom `Day` components work too
  const days = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("[aria-pressed]"));
  const index = days.indexOf(document.activeElement as HTMLElement);
  if (index === -1) return;
  const isOpen = (day: HTMLElement) => !day.hasAttribute("data-disabled");
  const enabled = days.filter(isOpen);
  const steps: Record<string, number | null> = {
    ArrowRight: 1,
    ArrowLeft: -1,
    ArrowDown: rowLength,
    ArrowUp: rowLength && -rowLength,
  };
  const step = steps[event.key];
  let target: HTMLElement | undefined;
  if (event.key === "Home") target = enabled[0];
  else if (event.key === "End") target = enabled[enabled.length - 1];
  else if (step) {
    for (let i = index + step; !target && i >= 0 && i < days.length; i += Math.sign(step)) {
      if (isOpen(days[i])) target = days[i];
    }
  } else return;
  event.preventDefault();
  target?.focus();
}

export function DayStrip({ picker, visible = true, rows: rowsProp }: DayStripProps) {
  const { days, labels, fmt, selectedDay } = picker;
  const { cls, text, icons, components } = useParts();
  const Day = components.Day ?? DefaultDay;
  const { dayRows } = useConfig();
  const rows = dayRowCount(rowsProp ?? dayRows, days.length);
  const grid = rows > 1;
  const rowLength = Math.ceil(days.length / rows);
  const stripRef = useRef<HTMLDivElement>(null);
  const selectedKey = dayKey(selectedDay);
  const tabStop = days.find((d) => d.isSelected)?.key ?? days.find((d) => !d.isDisabled)?.key;

  const scrollStrip = (direction: -1 | 1) => {
    stripRef.current?.scrollBy({ left: direction * 160, behavior: "smooth" });
  };

  // keep the selected day in view, e.g. when a value 10 days out is loaded
  useEffect(() => {
    if (!visible) return;
    const strip = stripRef.current;
    const day = strip?.querySelector<HTMLElement>("[aria-pressed='true']");
    if (!strip || !day) return;
    // measured from rects so it doesn't depend on how the strip is positioned
    const start =
      day.getBoundingClientRect().left - strip.getBoundingClientRect().left - strip.clientLeft + strip.scrollLeft;
    const end = start + day.offsetWidth;
    if (start < strip.scrollLeft || end > strip.scrollLeft + strip.clientWidth) {
      strip.scrollTo({
        left: start - (strip.clientWidth - day.offsetWidth) / 2,
        behavior: "smooth",
      });
    }
  }, [visible, selectedKey]);

  return (
    <div className={cls("days")}>
      <div className={cls("daysHeader")}>
        <span className={cls("month")} style={text("month")}>
          {/* the grid shows every day at once, so name every month in it */}
          {grid && days.length > 0
            ? fmt.monthYearRange(days[0].date, days[days.length - 1].date)
            : fmt.monthYear(selectedDay)}
        </span>
        {!grid && (
          <div className={cls("nav")}>
            {icons.chevronLeft != null && (
              <button
                type="button"
                data-direction="previous"
                aria-label={labels.scrollLeft}
                onClick={() => scrollStrip(-1)}
                className={cls("navButton")}
              >
                {icons.chevronLeft}
              </button>
            )}
            {icons.chevronRight != null && (
              <button
                type="button"
                data-direction="next"
                aria-label={labels.scrollRight}
                onClick={() => scrollStrip(1)}
                className={cls("navButton")}
              >
                {icons.chevronRight}
              </button>
            )}
          </div>
        )}
      </div>

      <div
        ref={stripRef}
        data-layout={grid ? "grid" : "strip"}
        style={grid ? ({ "--yotei-day-columns": rowLength } as CSSProperties) : undefined}
        onKeyDown={(event) => handleDayKeyDown(event, grid ? rowLength : null)}
        className={cls("dayList")}
      >
        {days.map((day) => {
          const disabled = day.isDisabled && !day.isSelected;
          const monthStart = day.date.getDate() === 1;
          const label = day.isToday
            ? labels.today
            : day.isTomorrow
              ? labels.tomorrowShort
              : monthStart
                ? fmt.month(day.date)
                : fmt.weekday(day.date);
          return (
            <Day
              key={day.key}
              day={day}
              label={label}
              type="button"
              disabled={disabled}
              tabIndex={day.key === tabStop ? 0 : -1}
              aria-pressed={day.isSelected}
              aria-label={
                day.isToday ? `${labels.today}, ${fmt.fullDate(day.date)}` : fmt.fullDate(day.date)
              }
              data-selected={flag(day.isSelected)}
              data-today={flag(day.isToday)}
              data-month-start={flag(monthStart)}
              data-disabled={flag(disabled)}
              onClick={() => picker.selectDay(day.date)}
              className={cls("day")}
            >
              <span className={cls("dayLabel")} style={text("dayLabel")}>
                {label}
              </span>
              <span className={cls("dayNumber")} style={text("dayNumber")}>
                {day.date.getDate()}
              </span>
              <span className={cls("dayWeekday")} style={text("dayWeekday")}>
                {fmt.weekday(day.date)}
              </span>
              {day.isToday && <span className={cls("todayDot")} />}
            </Day>
          );
        })}
      </div>
    </div>
  );
}
