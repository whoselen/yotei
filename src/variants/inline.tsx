"use client";

import { forwardRef } from "react";
import { DayStrip } from "../ui/day-strip";
import { Collapse } from "../ui/surfaces";
import { TimeColumns } from "../ui/time-columns";
import { HiddenInput, Trigger } from "../ui/trigger";
import type { ScheduleValueType } from "../core/types";
import {
  PickerRoot,
  usePickerField,
  type PickerFieldBaseProps,
  type PickerFieldProps,
  type ValueTypedPicker,
} from "../ui/use-picker-field";

export type InlineSchedulePickerProps<T extends ScheduleValueType = "parts"> = PickerFieldProps<T>;

/**
 * The original design: a trigger that expands an inline panel, pushing the
 * content below it down. Collapses on its own once a minute is picked.
 */
export const InlineSchedulePicker = forwardRef<
  HTMLButtonElement,
  InlineSchedulePickerProps<ScheduleValueType>
>(
  function InlineSchedulePicker({ name, ...props }, ref) {
    const field = usePickerField(props, ref);
    const { picker, open } = field;
    const { DayStrip: Days = DayStrip, TimeColumns: Time = TimeColumns } = field.config.components ?? {};

    return (
      <PickerRoot field={field} variant="inline">
        <Trigger {...field.triggerProps} />
        <Collapse open={open} id={field.panelId}>
          <Days picker={picker} visible={open} rows={field.config.dayRows} />
          <Time picker={picker} visible={open} onComplete={field.finishSoon} />
        </Collapse>
        <HiddenInput name={name} picker={picker} />
      </PickerRoot>
    );
  },
) as ValueTypedPicker<PickerFieldBaseProps>;
