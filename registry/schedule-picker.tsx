"use client";

import * as React from "react";
import {
  SchedulePicker as BaseSchedulePicker,
  type SchedulePickerProps,
  type ScheduleValueType,
} from "react-schedule-time-picker";
import "react-schedule-time-picker/styles.css";

import { cn } from "@/lib/utils";

// The picker's colors and radius, pointed at your theme tokens. The field matches
// <Input>: the page background in light mode, a tint of --input in dark.
const themeTokens = cn(
  "[--yotei-foreground:var(--foreground)]",
  "[--yotei-surface:var(--popover)]",
  "[--yotei-field:var(--background)] dark:[--yotei-field:color-mix(in_oklab,var(--input)_30%,transparent)]",
  "[--yotei-primary:var(--primary)]",
  "[--yotei-primary-foreground:var(--primary-foreground)]",
  "[--yotei-muted:var(--muted)]",
  "[--yotei-muted-foreground:var(--muted-foreground)]",
  "[--yotei-accent:var(--accent)]",
  "[--yotei-accent-foreground:var(--accent-foreground)]",
  "[--yotei-border:var(--border)]",
  "[--yotei-input:var(--input)]",
  "[--yotei-ring:var(--ring)]",
  "[--yotei-radius:var(--radius)]",
);

// generic, so `valueType` keeps typing `value` and `onChange` through the wrapper
function SchedulePicker<T extends ScheduleValueType = "parts">({
  className,
  ...props
}: SchedulePickerProps<T> & React.RefAttributes<HTMLButtonElement>) {
  return <BaseSchedulePicker<T> className={cn(themeTokens, className)} {...props} />;
}

export { SchedulePicker };
