// A neobrutalist skin, to show how far swapping parts goes: the playground's
// components demo (and the local showcase's Components scene). Markup here,
// looks and states in brutal.css
import { AlarmClock, ChevronDown, X } from "lucide-react";
import type {
  DayProps,
  HourProps,
  MinuteProps,
  SchedulePickerComponents,
  TriggerProps,
} from "../src";
import { cn } from "../src/ui/utils";
import "./brutal.css";

function Trigger({ picker, open, label, onClear, ...props }: TriggerProps) {
  return (
    <div className="flex gap-3">
      <button
        {...props}
        className="brutal-key brutal-trigger flex h-12 min-w-0 flex-1 items-center gap-3 pr-4 text-left"
      >
        <span className="brutal-trigger-icon grid aspect-square h-full place-items-center">
          <AlarmClock className="size-5" />
        </span>
        <span
          className="flex-1 truncate text-[0.95rem] font-bold tracking-wide uppercase"
          suppressHydrationWarning
        >
          {label}
        </span>
        <ChevronDown
          className={cn(
            "size-5 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      {picker.value && (
        <button
          type="button"
          onClick={onClear}
          aria-label={picker.labels.clear}
          className="brutal-key brutal-clear grid size-12 shrink-0 place-items-center"
        >
          <X className="size-5" />
        </button>
      )}
    </div>
  );
}

function Day({ day, label, ...props }: DayProps) {
  return (
    <button
      {...props}
      className="brutal-key brutal-day flex w-12 shrink-0 flex-col items-center gap-0.5 py-1.5"
    >
      <span className="brutal-day-label px-1 text-[0.625rem] font-bold tracking-wide uppercase">
        {label}
      </span>
      <span className="text-xl leading-tight font-bold tabular-nums">
        {day.date.getDate()}
      </span>
    </button>
  );
}

function Hour({ hour, ...props }: HourProps) {
  const period = hour.period && (
    <span className="text-[0.7rem] font-bold">{hour.period}</span>
  );
  return (
    <button
      {...props}
      className="brutal-key brutal-hour flex shrink-0 items-baseline justify-between px-3 py-1.5 text-[0.95rem] font-bold tabular-nums"
    >
      {hour.periodFirst && period}
      <span>{hour.label}</span>
      {!hour.periodFirst && period}
    </button>
  );
}

function Minute({ minute, ...props }: MinuteProps) {
  return (
    <button
      {...props}
      className="brutal-key brutal-minute shrink-0 px-3 py-1.5 text-left text-[0.95rem] font-bold tabular-nums"
    >
      {minute.label}
    </button>
  );
}

export const brutalComponents: Partial<SchedulePickerComponents> = {
  Trigger,
  Day,
  Hour,
  Minute,
};
