// Default styles: import "react-schedule-time-picker/styles.css" once in your app

// ── The component: <SchedulePicker variant="inline" | "popover" | "presets"> ──
export {
  SchedulePicker,
  /** Drop-in name for the original component */
  SchedulePicker as ScheduleTimePicker,
  type SchedulePickerProps,
} from "./picker";

// ── Single layouts: explicit names, and only that layout ends up in your bundle ──
export { InlineSchedulePicker, type InlineSchedulePickerProps } from "./variants/inline";
export { PopoverSchedulePicker, type PopoverSchedulePickerProps } from "./variants/popover";
export {
  PresetSchedulePicker,
  getDefaultPresets,
  type PresetSchedulePickerProps,
  type SchedulePreset,
} from "./variants/presets";

// ── Styling, icons and app-wide defaults ─────────────────────────
export {
  SchedulePickerProvider,
  type SchedulePickerConfig,
  type SchedulePickerComponents,
  type SchedulePickerIcons,
  type SchedulePickerClassNames,
  type SchedulePickerPart,
  type SchedulePickerTextPart,
  type SchedulePickerTextStyle,
  type SchedulePickerTypography,
  type SchedulePickerTheme,
  type SchedulePickerVariant,
} from "./ui/config";

// ── Headless core + building blocks for your own layouts ─────────
export {
  useSchedulePicker,
  type UseSchedulePickerOptions,
  type ScheduleValueProps,
  type SchedulePickerState,
  type PickerDay,
  type PickerHour,
  type PickerMinute,
} from "./core/use-schedule-picker";
export type {
  ScheduleTimePickerValue,
  ScheduleValue,
  ScheduleValues,
  ScheduleValueType,
} from "./core/types";
export { defaultLabels, type ScheduleTimePickerLabels } from "./core/labels";
export type { HourCycle } from "./core/format";
export { toDate, fromDate, toLocalISO, toISO, toOffsetISO, fromISO } from "./core/date";
export type { TriggerProps } from "./ui/trigger";
export { DayStrip, type DayStripProps, type DayProps } from "./ui/day-strip";
export {
  TimeColumns,
  type TimeColumnsProps,
  type HourProps,
  type MinuteProps,
} from "./ui/time-columns";
