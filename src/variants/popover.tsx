"use client";

import { forwardRef, useState } from "react";
import { DayStrip, extraDayRowsHeight } from "../ui/day-strip";
import { pickSide, Popover, useOutsidePress, type Side } from "../ui/surfaces";
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

interface PopoverOwnProps {
  /** Which trigger edge the panel lines up with. @default "start" */
  align?: "start" | "end";
}

export type PopoverSchedulePickerProps<T extends ScheduleValueType = "parts"> = PickerFieldProps<T> &
  PopoverOwnProps;

const PANEL_HEIGHT = 320;

/**
 * Same panel, floating over the page instead of pushing it down. Flips above
 * the trigger near the bottom of the viewport; closes on outside press / Escape.
 */
export const PopoverSchedulePicker = forwardRef<
  HTMLButtonElement,
  PopoverSchedulePickerProps<ScheduleValueType>
>(
  function PopoverSchedulePicker({ align = "start", name, ...props }, ref) {
    const field = usePickerField(props, ref);
    const { picker, open } = field;
    const { DayStrip: Days = DayStrip, TimeColumns: Time = TimeColumns } = field.config.components ?? {};
    const [side, setSide] = useState<Side>("bottom");

    useOutsidePress(field.rootRef, open, field.close);

    const toggle = () => {
      if (!open) {
        const height = PANEL_HEIGHT + extraDayRowsHeight(field.config.dayRows, picker.days.length);
        setSide(pickSide(field.triggerRef.current, height));
      }
      field.toggle();
    };

    return (
      <PickerRoot field={field} variant="popover">
        <Trigger {...field.triggerProps} popup="dialog" onToggle={toggle} />
        <Popover
          id={field.panelId}
          open={open}
          side={side}
          align={align}
          label={props.placeholder ?? picker.labels.placeholder}
        >
          <Days picker={picker} visible={open} rows={field.config.dayRows} />
          <Time picker={picker} visible={open} onComplete={field.finishSoon} />
        </Popover>
        <HiddenInput name={name} picker={picker} />
      </PickerRoot>
    );
  },
) as ValueTypedPicker<PickerFieldBaseProps & PopoverOwnProps>;
