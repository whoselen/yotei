"use client";

import {
  createContext,
  useContext,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { HourCycle } from "../core/format";
import type { ScheduleTimePickerLabels } from "../core/labels";
import type { DayProps, DayStripProps } from "./day-strip";
import type { HourProps, MinuteProps, TimeColumnsProps } from "./time-columns";
import type { TriggerProps } from "./trigger";
import {
  CalendarDaysIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  XIcon,
} from "./icons";
import { cn } from "./utils";

export interface SchedulePickerIcons {
  /** Trigger, before a time is picked */
  clock: ReactNode;
  /** Trigger once a time is picked; the presets' "Pick date & time" row */
  calendar: ReactNode;
  /** End of the trigger; turned 180° while open */
  chevronDown: ReactNode;
  /** Scroll days back; the presets' back button */
  chevronLeft: ReactNode;
  /** Scroll days forward; the presets' "Pick date & time" row */
  chevronRight: ReactNode;
  /** End of the trigger once picked; the selected hour, minute and preset */
  check: ReactNode;
  /** The clear button -- `null` removes the button */
  clear: ReactNode;
}

const defaultIcons: SchedulePickerIcons = {
  clock: <ClockIcon />,
  calendar: <CalendarDaysIcon />,
  chevronDown: <ChevronDownIcon />,
  chevronLeft: <ChevronLeftIcon />,
  chevronRight: <ChevronRightIcon />,
  check: <CheckIcon />,
  clear: <XIcon />,
};

/**
 * Your own components in place of the built-in ones. Define them outside
 * render (or memoize them): a new component type on every render remounts the
 * days and options, and keyboard focus with them.
 */
export interface SchedulePickerComponents {
  /**
   * The button that opens the panel, and the clear button beside it. Spread the
   * props it gets on your `<button>`; its children are the default content.
   */
  Trigger: ComponentType<TriggerProps>;
  /** One day. Spread the props it gets on a `<button>`; its children are the default content. */
  Day: ComponentType<DayProps>;
  /** One hour in the hour list, same contract as `Day` */
  Hour: ComponentType<HourProps>;
  /** One minute in the minute list, same contract as `Day` */
  Minute: ComponentType<MinuteProps>;
  /** The whole day strip / grid, e.g. a month calendar of your own */
  DayStrip: ComponentType<DayStripProps>;
  /** The hour and minute columns, e.g. a grid of time slots. Call `onComplete` once a pick is done. */
  TimeColumns: ComponentType<TimeColumnsProps>;
}

/**
 * Every element you can style. Each one always has an `yotei-<kebab-case>`
 * class (e.g. `optionPeriod` → `.yotei-option-period`); `classNames` adds yours.
 */
export type SchedulePickerPart =
  | "root"
  | "triggerRow"
  | "trigger"
  | "triggerIcon"
  | "triggerLabel"
  | "triggerIndicator"
  | "clear"
  | "collapse"
  | "popover"
  | "panel"
  | "panelHeader"
  | "back"
  | "days"
  | "daysHeader"
  | "month"
  | "nav"
  | "navButton"
  | "dayList"
  | "day"
  | "dayLabel"
  | "dayNumber"
  | "dayWeekday"
  | "todayDot"
  | "time"
  | "column"
  | "columnLabel"
  | "list"
  | "option"
  | "optionLabel"
  | "optionPeriod"
  | "optionCheck"
  | "empty"
  | "presets"
  | "preset"
  | "presetIcon"
  | "presetLabel"
  | "presetHint"
  | "presetCheck"
  | "presetArrow"
  | "separator";

export type SchedulePickerClassNames = Partial<Record<SchedulePickerPart, string>>;

/** Every element that renders text. `root` is inherited by all of them. */
export type SchedulePickerTextPart =
  | "root"
  | "triggerLabel"
  | "month"
  | "dayLabel"
  | "dayNumber"
  | "dayWeekday"
  | "columnLabel"
  | "option"
  | "optionPeriod"
  | "empty"
  | "presetLabel"
  | "presetHint"
  | "back";

export type SchedulePickerTextStyle = Pick<
  CSSProperties,
  | "fontFamily"
  | "fontSize"
  | "fontWeight"
  | "fontStyle"
  | "lineHeight"
  | "letterSpacing"
  | "textTransform"
  | "fontVariantNumeric"
>;

/** Font settings per text element, applied inline so they win over any stylesheet */
export type SchedulePickerTypography = Partial<
  Record<SchedulePickerTextPart, SchedulePickerTextStyle>
>;

/** Omit to follow the page: a `.dark` / `[data-theme="dark"]` ancestor or the inherited `color-scheme` */
export type SchedulePickerTheme = "light" | "dark" | "system";

export type SchedulePickerVariant = "inline" | "popover" | "presets";

/** Defaults you can set once with `<SchedulePickerProvider>` and override per picker */
export interface SchedulePickerConfig {
  /** Layout for every `<SchedulePicker>` that doesn't set its own `variant` */
  variant?: SchedulePickerVariant;
  /** Swap any icon for your own; `null` hides it */
  icons?: Partial<SchedulePickerIcons>;
  /** Render the trigger, days, hours, minutes -- or the whole day strip / time columns -- yourself */
  components?: Partial<SchedulePickerComponents>;
  /** Extra classes per part, e.g. Tailwind utilities */
  classNames?: SchedulePickerClassNames;
  /** Font family, size, weight, spacing… per text element */
  typography?: SchedulePickerTypography;
  labels?: Partial<ScheduleTimePickerLabels>;
  locale?: string;
  hourCycle?: HourCycle;
  minuteStep?: number;
  dayCount?: number;
  /**
   * Rows of days. 1 is a scrolling strip; more lays every day out at once,
   * `ceil(dayCount / dayRows)` per row (30 days in 5 rows = 6 a row). @default 1
   */
  dayRows?: number;
  /** IANA time zone the pickers work in, e.g. `"America/New_York"`. @default the browser's */
  timeZone?: string;
  theme?: SchedulePickerTheme;
}

const ConfigContext = createContext<SchedulePickerConfig>({});

/** Internal: lets a picker hand its merged config down to its parts */
export const ConfigProvider = ConfigContext.Provider;

export const useConfig = () => useContext(ConfigContext);

// `{ clock: undefined }` should fall back to the default, while `null` hides it
function withoutUndefined<T extends object>(object: T | undefined): Partial<T> {
  return Object.fromEntries(
    Object.entries(object ?? {}).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

/** Child values win; class names from both levels are kept, text styles merge per element */
export function mergeConfig(
  parent: SchedulePickerConfig,
  child: SchedulePickerConfig,
): SchedulePickerConfig {
  const classNames: SchedulePickerClassNames = { ...parent.classNames };
  for (const [part, className] of Object.entries(child.classNames ?? {})) {
    const key = part as SchedulePickerPart;
    classNames[key] = cn(classNames[key], className) || undefined;
  }
  const typography: SchedulePickerTypography = { ...parent.typography };
  for (const [part, style] of Object.entries(child.typography ?? {})) {
    const key = part as SchedulePickerTextPart;
    typography[key] = { ...typography[key], ...withoutUndefined(style) };
  }
  return {
    ...parent,
    ...withoutUndefined(child),
    icons: { ...parent.icons, ...withoutUndefined(child.icons) },
    components: { ...parent.components, ...withoutUndefined(child.components) },
    labels: { ...parent.labels, ...withoutUndefined(child.labels) },
    classNames,
    typography,
  };
}

/** App-wide defaults for every picker below it. Nested providers merge. */
export function SchedulePickerProvider({
  children,
  ...config
}: SchedulePickerConfig & { children?: ReactNode }) {
  const parent = useConfig();
  return <ConfigProvider value={mergeConfig(parent, config)}>{children}</ConfigProvider>;
}

const kebab = (part: string) => part.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** Class names, text styles, icons and custom components for the parts of the nearest picker */
export function useParts() {
  const { classNames, typography, icons, components = {} } = useConfig();
  return {
    components,
    cls: (part: SchedulePickerPart) => cn(`yotei-${kebab(part)}`, classNames?.[part]),
    text: (part: SchedulePickerTextPart): CSSProperties | undefined => typography?.[part],
    icons: { ...defaultIcons, ...withoutUndefined(icons) } as SchedulePickerIcons,
  };
}
