"use client";

import {
  forwardRef,
  useSyncExternalStore,
  type ButtonHTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";
import type { SchedulePickerState } from "../core/use-schedule-picker";
import { serializeForForm } from "../core/value";
import { useParts } from "./config";
import { flag } from "./utils";

/** Wraps an icon in its styled slot; renders nothing when the icon was set to null */
export function IconSlot({
  icon,
  className,
  name,
}: {
  icon: ReactNode;
  className: string;
  name?: string;
}) {
  if (icon == null || icon === false) return null;
  return (
    <span className={className} data-icon={name} aria-hidden="true">
      {icon}
    </span>
  );
}

const subscribeNever = () => () => {};

/**
 * For text that depends on the clock or time zone ("Tomorrow, 3:30 PM"), where
 * the server and the browser can disagree. The server's HTML keeps its guess;
 * hydration renders "" against it (pair with suppressHydrationWarning), and the
 * render right after puts in the browser's own text.
 */
function useClientText(text: string) {
  const hydrated = useSyncExternalStore(subscribeNever, () => true, () => false);
  return hydrated || typeof window === "undefined" ? text : "";
}

/**
 * Lets plain `<form>`s and server actions submit the value: `YYYY-MM-DDTHH:mm`,
 * or an exact moment when `valueType` is one (`"date"`, `"iso"`, `"offset"`)
 */
export function HiddenInput({ name, picker }: { name?: string; picker: SchedulePickerState }) {
  const { value, valueType, timeZone } = picker;
  const iso = useClientText(value ? serializeForForm(value, valueType, timeZone) : "");
  if (!name) return null;
  return <input type="hidden" name={name} value={iso} suppressHydrationWarning />;
}

/**
 * What a custom `Trigger` gets: the picker's state, plus everything to spread
 * on the `<button>` that opens the panel -- click, ref, ARIA, `data-*` state,
 * the default class and, as `children`, the default content. It renders the
 * whole row in place of the default button + clear button, so a clear button
 * of your own goes next to the trigger, not inside it.
 */
export interface TriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * The panel is positioned against this button and focus returns to it after
   * a pick. Spreading the props passes it on in React 19; in React 18, wrap
   * your component in `forwardRef`.
   */
  ref?: Ref<HTMLButtonElement>;
  /** Everything `useSchedulePicker` returns: `value`, `formatValue`, `clear`… */
  picker: SchedulePickerState;
  open: boolean;
  /**
   * What the default trigger shows: "Tomorrow, 3:30 PM", or the placeholder.
   * The server and the browser can disagree on it (clock, time zone), so put
   * `suppressHydrationWarning` on the element that renders it.
   */
  label: string;
  /** Clears the value and puts focus back on the trigger */
  onClear: () => void;
}

const DefaultTrigger = forwardRef<HTMLButtonElement, Omit<TriggerProps, "ref">>(
  function DefaultTrigger({ picker, open, label, onClear, ...props }, ref) {
    const { cls, icons } = useParts();
    return (
      <div className={cls("triggerRow")}>
        <button ref={ref} {...props} />
        {picker.value !== null && !props.disabled && icons.clear != null && (
          <button
            type="button"
            onClick={onClear}
            aria-label={picker.labels.clear}
            className={cls("clear")}
          >
            {icons.clear}
          </button>
        )}
      </div>
    );
  },
);

export interface PickerTriggerProps {
  picker: SchedulePickerState;
  open: boolean;
  placeholder?: string;
  disabled?: boolean;
  /** id of the panel this button opens */
  controls: string;
  popup?: "dialog" | "menu";
  onToggle: () => void;
  onClear: () => void;
}

export const Trigger = forwardRef<HTMLButtonElement, PickerTriggerProps>(function Trigger(
  { picker, open, placeholder, disabled, controls, popup, onToggle, onClear },
  ref,
) {
  const { cls, text, icons, components } = useParts();
  const Custom = components.Trigger ?? DefaultTrigger;
  const filled = picker.value !== null;
  const valueText = useClientText(picker.value ? picker.formatValue(picker.value) : "");
  const label = filled ? valueText : (placeholder ?? picker.labels.placeholder);

  return (
    <Custom
      ref={ref}
      picker={picker}
      open={open}
      label={label}
      onClear={onClear}
      type="button"
      disabled={disabled}
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={controls}
      aria-haspopup={popup}
      data-state={open ? "open" : "closed"}
      data-filled={flag(filled)}
      className={cls("trigger")}
    >
      <IconSlot
        icon={filled ? icons.calendar : icons.clock}
        name={filled ? "calendar" : "clock"}
        className={cls("triggerIcon")}
      />
      <span className={cls("triggerLabel")} style={text("triggerLabel")} suppressHydrationWarning>
        {label}
      </span>
      <IconSlot
        icon={filled ? icons.check : icons.chevronDown}
        name={filled ? "check" : "chevron"}
        className={cls("triggerIndicator")}
      />
    </Custom>
  );
});
