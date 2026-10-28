"use client";

import { forwardRef } from "react";
import type { ScheduleValueType } from "./core/types";
import { useConfig } from "./ui/config";
import type { PickerFieldBaseProps, ValueTypedPicker } from "./ui/use-picker-field";
import { InlineSchedulePicker, type InlineSchedulePickerProps } from "./variants/inline";
import { PopoverSchedulePicker, type PopoverSchedulePickerProps } from "./variants/popover";
import {
  PresetSchedulePicker,
  type PresetSchedulePickerProps,
  type SchedulePreset,
} from "./variants/presets";

// `never` on the other branches turns a layout-specific prop without its
// variant (`presets` on an inline picker) into a type error, not a silent no-op
type VariantProps =
  | { variant?: "inline"; align?: never; presets?: never }
  | { variant: "popover"; align?: "start" | "end"; presets?: never }
  | { variant: "presets"; align?: "start" | "end"; presets?: SchedulePreset[] };

export type SchedulePickerProps<T extends ScheduleValueType = "parts"> =
  | (InlineSchedulePickerProps<T> & { variant?: "inline"; align?: never; presets?: never })
  | (PopoverSchedulePickerProps<T> & { variant: "popover"; presets?: never })
  | (PresetSchedulePickerProps<T> & { variant: "presets" });

/**
 * Every layout behind one component. Without `variant` it uses the provider's
 * default, then "inline". Changing `variant` remounts the layout, so keep
 * `value` controlled if you switch at runtime.
 */
export const SchedulePicker = forwardRef<HTMLButtonElement, SchedulePickerProps<ScheduleValueType>>(
  function SchedulePicker({ variant, ...props }, ref) {
    const defaultVariant = useConfig().variant;

    switch (variant ?? defaultVariant ?? "inline") {
      case "popover":
        return <PopoverSchedulePicker ref={ref} {...(props as PopoverSchedulePickerProps<ScheduleValueType>)} />;
      case "presets":
        return <PresetSchedulePicker ref={ref} {...(props as PresetSchedulePickerProps<ScheduleValueType>)} />;
      default:
        return <InlineSchedulePicker ref={ref} {...(props as InlineSchedulePickerProps<ScheduleValueType>)} />;
    }
  },
) as ValueTypedPicker<PickerFieldBaseProps & VariantProps>;
