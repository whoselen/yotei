"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ForwardedRef,
  type KeyboardEvent,
  type ReactNode,
  type RefAttributes,
} from "react";
import type { ScheduleValueType } from "../core/types";
import {
  useSchedulePicker,
  type ScheduleValueProps,
  type SchedulePickerOptions,
} from "../core/use-schedule-picker";
import { ConfigProvider, mergeConfig, useConfig, type SchedulePickerConfig } from "./config";
import { cn, flag, mergeRefs } from "./utils";

export type PickerFieldProps<T extends ScheduleValueType = "parts"> = PickerFieldBaseProps &
  ScheduleValueProps<T>;

/**
 * A picker component's call signature. `forwardRef` drops type parameters, so
 * each one is cast to this to get `valueType` back: it types `value`,
 * `defaultValue` and `onChange`.
 */
export type ValueTypedPicker<Props> = <T extends ScheduleValueType = "parts">(
  props: Props & ScheduleValueProps<T> & RefAttributes<HTMLButtonElement>,
) => ReactNode;

export interface PickerFieldBaseProps
  extends SchedulePickerOptions,
    Omit<SchedulePickerConfig, "variant"> {
  /** Called when the panel closes -- wire to RHF Controller's field.onBlur */
  onBlur?: () => void;
  /**
   * Field name; also submits a hidden input in native forms: `YYYY-MM-DDTHH:mm`,
   * or the exact moment when `valueType` is `"date"`, `"iso"` or `"offset"`
   */
  name?: string;
  /** Disable the entire picker */
  disabled?: boolean;
  placeholder?: string;
  /** Added to the root, same as `classNames.root` */
  className?: string;
  /** Root inline styles -- handy for `--yotei-*` variables */
  style?: CSSProperties;
}

/** Trigger + panel plumbing shared by every variant */
export function usePickerField(
  props: Omit<PickerFieldProps<ScheduleValueType>, "name">,
  ref: ForwardedRef<HTMLButtonElement>,
) {
  const {
    onBlur,
    disabled,
    placeholder,
    className,
    style,
    icons,
    components,
    classNames,
    typography,
    theme,
    labels,
    locale,
    hourCycle,
    minuteStep,
    dayCount,
    dayRows,
    timeZone,
    ...options
  } = props;

  // provider defaults, overridden by this picker's props
  const config = mergeConfig(useConfig(), {
    icons,
    components,
    classNames,
    typography,
    theme,
    labels,
    locale,
    hourCycle,
    minuteStep,
    dayCount,
    dayRows,
    timeZone,
  });
  const picker = useSchedulePicker({
    ...options,
    labels: config.labels,
    locale: config.locale,
    hourCycle: config.hourCycle,
    minuteStep: config.minuteStep,
    dayCount: config.dayCount,
    timeZone: config.timeZone,
  });

  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const setTriggerRef = useMemo(() => mergeRefs(ref, triggerRef), [ref]);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  const close = useCallback(() => {
    clearTimeout(closeTimer.current);
    setOpen(false);
    onBlur?.();
  }, [onBlur]);

  /** Close once the user is done, handing focus back so it isn't lost in the hidden panel */
  const finish = useCallback(() => {
    if (rootRef.current?.contains(document.activeElement)) triggerRef.current?.focus();
    close();
  }, [close]);

  /** Short pause so the user sees their pick land before the panel closes */
  const finishSoon = useCallback(() => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(finish, 200);
  }, [finish]);

  const toggle = useCallback(() => {
    if (open) return close();
    clearTimeout(closeTimer.current);
    setOpen(true);
  }, [open, close]);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Escape" || !open) return;
    event.stopPropagation();
    finish();
  };

  return {
    picker,
    config,
    open,
    close,
    finish,
    finishSoon,
    toggle,
    panelId,
    rootRef,
    triggerRef,
    rootProps: {
      ref: rootRef,
      onKeyDown,
      // root typography is inherited by every part; an explicit `style` still wins
      style: { ...config.typography?.root, ...style },
      className: cn("yotei-root", config.classNames?.root, className),
      "data-theme": config.theme,
      "data-state": open ? "open" : "closed",
      "data-disabled": flag(!!disabled),
    },
    triggerProps: {
      ref: setTriggerRef,
      picker,
      open,
      placeholder,
      disabled,
      controls: panelId,
      onToggle: toggle,
      onClear: () => {
        picker.clear();
        triggerRef.current?.focus();
      },
    },
  };
}

/** The picker's root element; hands the merged classNames / icons down to its parts */
export function PickerRoot({
  field,
  variant,
  children,
}: {
  field: ReturnType<typeof usePickerField>;
  variant: string;
  children: ReactNode;
}) {
  return (
    <ConfigProvider value={field.config}>
      <div {...field.rootProps} data-variant={variant}>
        {children}
      </div>
    </ConfigProvider>
  );
}
