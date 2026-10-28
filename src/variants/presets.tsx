"use client";

import { forwardRef, useRef, useState } from "react";
import { addDays, atTime, ceilToStep, isSameDay, toDate } from "../core/date";
import type { ScheduleTimePickerLabels } from "../core/labels";
import type { ScheduleValueType } from "../core/types";
import type { SchedulePickerState } from "../core/use-schedule-picker";
import { useParts } from "../ui/config";
import { DayStrip, extraDayRowsHeight } from "../ui/day-strip";
import { pickSide, Popover, useOutsidePress, type Side } from "../ui/surfaces";
import { TimeColumns } from "../ui/time-columns";
import { HiddenInput, IconSlot, Trigger } from "../ui/trigger";
import {
  PickerRoot,
  usePickerField,
  type PickerFieldBaseProps,
  type PickerFieldProps,
  type ValueTypedPicker,
} from "../ui/use-picker-field";
import { flag } from "../ui/utils";

export interface SchedulePreset {
  /** Row label, e.g. "Tomorrow morning" */
  label: string;
  /** The preset's time relative to now (rounded up to `minuteStep`); null hides the row */
  getDate: (now: Date) => Date | null;
}

export function getDefaultPresets(labels: ScheduleTimePickerLabels): SchedulePreset[] {
  return [
    { label: labels.inAnHour, getDate: (now) => new Date(now.getTime() + 60 * 60_000) },
    { label: labels.thisEvening, getDate: (now) => atTime(now, 18, 0) },
    { label: labels.tomorrowMorning, getDate: (now) => atTime(addDays(now, 1), 9, 0) },
    { label: labels.tomorrowAfternoon, getDate: (now) => atTime(addDays(now, 1), 14, 0) },
    {
      label: labels.nextMonday,
      getDate: (now) => atTime(addDays(now, (8 - now.getDay()) % 7 || 7), 9, 0),
    },
  ];
}

interface PresetOwnProps {
  /** Quick picks shown before the full picker. Unavailable or duplicate times are hidden. */
  presets?: SchedulePreset[];
  /** @default "start" */
  align?: "start" | "end";
}

export type PresetSchedulePickerProps<T extends ScheduleValueType = "parts"> = PickerFieldProps<T> &
  PresetOwnProps;

// the custom view is the tallest state, so flip decisions are made against it
const PANEL_HEIGHT = 360;

/**
 * "Schedule send" style: one-tap presets first, the full day strip + time
 * columns one level deeper for anything else.
 */
export const PresetSchedulePicker = forwardRef<
  HTMLButtonElement,
  PresetSchedulePickerProps<ScheduleValueType>
>(
  function PresetSchedulePicker({ presets, align = "start", name, ...props }, ref) {
    const field = usePickerField(props, ref);
    const { picker, open } = field;
    const [side, setSide] = useState<Side>("bottom");
    const [view, setView] = useState<"presets" | "custom">("presets");

    useOutsidePress(field.rootRef, open, field.close);

    const toggle = () => {
      if (!open) {
        setView("presets");
        const height = PANEL_HEIGHT + extraDayRowsHeight(field.config.dayRows, picker.days.length);
        setSide(pickSide(field.triggerRef.current, height));
      }
      field.toggle();
    };

    return (
      <PickerRoot field={field} variant="presets">
        <Trigger {...field.triggerProps} popup="dialog" onToggle={toggle} />
        <Popover
          id={field.panelId}
          open={open}
          side={side}
          align={align}
          label={props.placeholder ?? picker.labels.placeholder}
        >
          <PresetPanel
            picker={picker}
            presets={presets}
            view={view}
            onViewChange={setView}
            onComplete={field.finishSoon}
          />
        </Popover>
        <HiddenInput name={name} picker={picker} />
      </PickerRoot>
    );
  },
) as ValueTypedPicker<PickerFieldBaseProps & PresetOwnProps>;

function PresetPanel({
  picker,
  presets,
  view,
  onViewChange,
  onComplete,
}: {
  picker: SchedulePickerState;
  presets?: SchedulePreset[];
  view: "presets" | "custom";
  onViewChange: (view: "presets" | "custom") => void;
  onComplete: () => void;
}) {
  const { cls, text, icons, components } = useParts();
  const { DayStrip: Days = DayStrip, TimeColumns: Time = TimeColumns } = components;
  const { labels, fmt, value } = picker;
  const backRef = useRef<HTMLButtonElement>(null);
  const customRef = useRef<HTMLButtonElement>(null);

  const showView = (next: "presets" | "custom") => {
    onViewChange(next);
    requestAnimationFrame(() => (next === "custom" ? backRef : customRef).current?.focus());
  };

  const selectedTime = value ? toDate(value).getTime() : null;
  const seen = new Set<number>();
  const options = (presets ?? getDefaultPresets(labels)).flatMap((preset) => {
    const raw = picker.now && preset.getDate(picker.now);
    if (!raw) return [];
    const date = ceilToStep(raw, picker.minuteStep);
    const time = date.getTime();
    if (seen.has(time) || !picker.isSlotAvailable(date, date.getHours(), date.getMinutes())) {
      return [];
    }
    seen.add(time);
    return [{ label: preset.label, date, time }];
  });
  const isCustomValue = value !== null && !options.some((o) => o.time === selectedTime);

  const hint = (date: Date) => {
    const time = fmt.time(date.getHours(), date.getMinutes());
    return isSameDay(date, picker.today) ? time : `${fmt.weekday(date)} ${time}`;
  };

  if (view === "custom") {
    return (
      <>
        <div className={cls("panelHeader")}>
          <button
            ref={backRef}
            type="button"
            onClick={() => showView("presets")}
            className={cls("back")}
            style={text("back")}
          >
            {icons.chevronLeft}
            {labels.back}
          </button>
        </div>
        <Days picker={picker} />
        <Time picker={picker} onComplete={onComplete} />
      </>
    );
  }

  return (
    <div className={cls("presets")}>
      {options.map((option) => {
        const active = option.time === selectedTime;
        return (
          <button
            key={option.label}
            type="button"
            aria-pressed={active}
            data-selected={flag(active)}
            onClick={() => {
              if (picker.selectSlot(option.date)) onComplete();
            }}
            className={cls("preset")}
          >
            <span className={cls("presetLabel")} style={text("presetLabel")}>
              {option.label}
            </span>
            <span className={cls("presetHint")} style={text("presetHint")}>
              {hint(option.date)}
            </span>
            <IconSlot icon={icons.check} className={cls("presetCheck")} />
          </button>
        );
      })}
      {options.length > 0 && <div role="separator" className={cls("separator")} />}
      <button
        ref={customRef}
        type="button"
        data-custom=""
        data-selected={flag(isCustomValue)}
        onClick={() => showView("custom")}
        className={cls("preset")}
      >
        <IconSlot icon={icons.calendar} className={cls("presetIcon")} />
        <span className={cls("presetLabel")} style={text("presetLabel")}>
          {labels.pickDateTime}
        </span>
        {isCustomValue && value && (
          <span className={cls("presetHint")} style={text("presetHint")}>
            {picker.formatValue(value)}
          </span>
        )}
        <IconSlot icon={icons.chevronRight} className={cls("presetArrow")} />
      </button>
    </div>
  );
}
