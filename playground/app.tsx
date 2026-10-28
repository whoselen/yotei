import { ScheduleTimePicker as OriginalPicker } from "@original";
import {
  AlarmClock,
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  ChevronDown,
  ChevronsUpDown,
  CircleCheck,
  Eraser,
  Send,
} from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  fromDate,
  fromISO,
  SchedulePicker,
  SchedulePickerProvider,
  toLocalISO,
  type DayProps,
  type HourCycle,
  type HourProps,
  type MinuteProps,
  type SchedulePickerComponents,
  type ScheduleTimePickerLabels,
  type ScheduleTimePickerValue,
  type ScheduleValue,
  type ScheduleValueType,
  type TimeColumnsProps,
  type TriggerProps,
} from "../src";
import { cn } from "../src/ui/utils";
import { SchedulePicker as ShadcnSchedulePicker } from "../registry/schedule-picker";

const jaLabels: Partial<ScheduleTimePickerLabels> = {
  placeholder: "日時を選択",
  today: "今日",
  tomorrow: "明日",
  tomorrowShort: "明日",
  hour: "時",
  minute: "分",
  pickHourFirst: "先に時間を選択",
  clear: "クリア",
  back: "戻る",
  scrollLeft: "前の日",
  scrollRight: "次の日",
  pickDateTime: "日時を指定",
  inAnHour: "1時間後",
  thisEvening: "今日の夕方",
  tomorrowMorning: "明日の朝",
  tomorrowAfternoon: "明日の午後",
  nextMonday: "来週の月曜日",
};

type Value = ScheduleTimePickerValue | null;

function Demo({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: ReactNode;
  children: (value: Value, onChange: (value: Value) => void) => ReactNode;
}) {
  const [value, setValue] = useState<Value>(null);
  return (
    <section data-demo={id} className="flex flex-col gap-3 rounded-xl border bg-background p-5">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>
      </div>
      {children(value, setValue)}
      <code data-value className="mt-auto pt-1 text-[11px] text-muted-foreground">
        value: {value ? toLocalISO(value) : "null"}
      </code>
    </section>
  );
}

function Toggle<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: Array<[T, string]>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex rounded-md border p-0.5">
      {options.map(([option, label]) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "rounded px-2.5 py-1 text-xs font-medium transition-colors",
            option === value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function useNarrowScreen() {
  const query = "(max-width: 640px)";
  const [narrow, setNarrow] = useState(() => matchMedia(query).matches);
  useEffect(() => {
    const media = matchMedia(query);
    const update = () => setNarrow(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return narrow;
}

const Code = ({ children }: { children: ReactNode }) => (
  <code className="rounded bg-muted px-1 py-0.5 text-[12px]">{children}</code>
);

// ── Custom components: defined once, outside render ─────────────

// days with something on them, as an app might load them
const isBusy = (date: Date) => date.getDate() % 3 === 0;

const chip =
  "rounded-full transition-colors not-data-selected:hover:bg-accent disabled:pointer-events-none disabled:opacity-35 data-selected:bg-primary data-selected:text-primary-foreground";

function PillDay({ day, label, ...props }: DayProps) {
  return (
    <button {...props} className={cn(chip, "group flex w-12 shrink-0 flex-col items-center gap-1 py-2")}>
      <span className="text-[10px] font-medium opacity-70">{label}</span>
      <span className="text-base leading-none font-semibold">{day.date.getDate()}</span>
      <span
        className={cn(
          "size-1 rounded-full",
          isBusy(day.date) && "bg-orange-500 group-data-selected:bg-primary-foreground",
        )}
      />
    </button>
  );
}

function ChipHour({ hour, ...props }: HourProps) {
  const period = <span className="text-[10px] uppercase opacity-60">{hour.period}</span>;
  return (
    <button {...props} className={cn(chip, "flex items-baseline gap-1 px-3 py-1.5 text-sm")}>
      {hour.periodFirst && period}
      <span className="font-semibold tabular-nums">{hour.label}</span>
      {!hour.periodFirst && period}
    </button>
  );
}

function ChipMinute({ minute, ...props }: MinuteProps) {
  return (
    <button {...props} className={cn(chip, "px-3 py-1.5 text-left text-sm font-semibold tabular-nums")}>
      {minute.label}
    </button>
  );
}

const chipComponents: Partial<SchedulePickerComponents> = {
  Day: PillDay,
  Hour: ChipHour,
  Minute: ChipMinute,
};

/** The whole time section replaced: every open slot of the day as one grid */
function SlotGrid({ picker, onComplete }: TimeColumnsProps) {
  const day = picker.selectedDay;
  const slots = picker.hours.flatMap(({ value: hour }) =>
    picker.minuteSlots
      .filter((minute) => picker.isSlotAvailable(day, hour, minute))
      .map((minute) => ({ hour, minute })),
  );
  if (slots.length === 0) {
    return <p className="p-4 text-center text-sm text-muted-foreground">No times left this day</p>;
  }
  return (
    <div role="group" aria-label="Times" className="grid max-h-52 grid-cols-3 gap-1.5 overflow-y-auto p-3">
      {slots.map(({ hour, minute }) => {
        const selected = picker.selectedHour === hour && picker.selectedMinute === minute;
        return (
          <button
            key={`${hour}:${minute}`}
            type="button"
            aria-pressed={selected}
            onClick={() => {
              const slot = new Date(day);
              slot.setHours(hour, minute);
              if (picker.selectSlot(slot)) onComplete?.();
            }}
            className={cn(
              "rounded-md border px-2 py-1.5 text-xs font-medium tabular-nums transition-colors",
              selected ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent",
            )}
          >
            {picker.fmt.time(hour, minute)}
          </button>
        );
      })}
    </div>
  );
}

const slotComponents: Partial<SchedulePickerComponents> = { TimeColumns: SlotGrid };

/** The trigger replaced: a two-line button, and a text "Clear" beside it */
function SendAtTrigger({ picker, open, label, onClear, ...props }: TriggerProps) {
  const filled = picker.value !== null;
  return (
    <div className="flex items-center gap-3">
      <button
        {...props}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border bg-background px-3 py-2 text-left shadow-xs transition-colors hover:bg-accent aria-expanded:border-ring aria-expanded:ring-3 aria-expanded:ring-ring/30"
      >
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-md",
            filled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          <Send className="size-4" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Send at
          </span>
          <span
            suppressHydrationWarning
            className={cn("truncate text-sm font-medium", !filled && "text-muted-foreground")}
          >
            {label}
          </span>
        </span>
        <ChevronDown
          className={cn("ml-auto size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>
      {filled && !props.disabled && (
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Clear
        </button>
      )}
    </div>
  );
}

const triggerComponents: Partial<SchedulePickerComponents> = { Trigger: SendAtTrigger };

const describeOutput = (value: ScheduleValue<ScheduleValueType> | null) =>
  value === null
    ? "null"
    : typeof value === "string"
      ? JSON.stringify(value)
      : value instanceof Date
        ? `new Date("${value.toISOString()}")`
        : `{ date: ${toLocalISO(value).slice(0, 10)}, hour: ${value.hour}, minute: ${value.minute} }`;

/** One picker per `valueType`: what onChange gets, and what the form submits */
function ValueTypesDemo({ onChange }: { onChange: (value: Value) => void }) {
  const [type, setType] = useState<ScheduleValueType>("iso");
  const [output, setOutput] = useState<ScheduleValue<ScheduleValueType> | null>(null);
  const [submitted, setSubmitted] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  // the hidden input updates with the same render as `output`
  useEffect(() => {
    if (formRef.current) setSubmitted(String(new FormData(formRef.current).get("when") ?? ""));
  }, [output]);

  return (
    <div className="flex flex-col items-start gap-3">
      <Toggle
        options={[["parts", "parts"], ["date", "date"], ["iso", "iso"], ["offset", "offset"], ["local", "local"]]}
        value={type}
        onChange={(next) => {
          setType(next);
          setOutput(null);
          onChange(null);
        }}
      />
      <form ref={formRef} className="w-full" onSubmit={(event) => event.preventDefault()}>
        <SchedulePicker
          key={type}
          variant="popover"
          valueType={type}
          name="when"
          onChange={(next) => {
            setOutput(next);
            onChange(
              next === null
                ? null
                : typeof next === "string"
                  ? fromISO(next)
                  : next instanceof Date
                    ? fromDate(next)
                    : next,
            );
          }}
        />
      </form>
      <dl className="grid w-full grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px]">
        <dt className="text-muted-foreground">onChange</dt>
        <dd data-output className="font-mono break-all">{describeOutput(output)}</dd>
        <dt className="text-muted-foreground">form</dt>
        <dd data-submitted className="font-mono break-all">when={JSON.stringify(submitted)}</dd>
        <dt className="text-muted-foreground">zone</dt>
        <dd className="font-mono">{Intl.DateTimeFormat().resolvedOptions().timeZone}</dd>
      </dl>
    </div>
  );
}

// opening hours in the picker's own zone: `slot` reads its wall clock
const isClosed = (slot: Date) =>
  slot.getDay() === 0 || slot.getDay() === 6 || slot.getHours() < 9 || slot.getHours() >= 17;

/** The same picker in another zone: its today, its opening hours, its offset */
function TimeZoneDemo({ onChange }: { onChange: (value: Value) => void }) {
  const [zone, setZone] = useState("America/New_York");
  const [output, setOutput] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-start gap-3">
      <Toggle
        options={[
          ["America/New_York", "New York"],
          ["Europe/London", "London"],
          ["Asia/Kolkata", "Kolkata"],
          ["Asia/Tokyo", "Tokyo"],
        ]}
        value={zone}
        onChange={(next) => {
          setZone(next);
          setOutput(null);
          onChange(null);
        }}
      />
      <div className="w-full">
        <SchedulePicker
          key={zone}
          variant="popover"
          timeZone={zone}
          valueType="offset"
          isSlotDisabled={isClosed}
          onChange={(next) => {
            setOutput(next);
            onChange(next === null ? null : fromISO(next, zone));
          }}
        />
      </div>
      <dl className="grid w-full grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px]">
        <dt className="text-muted-foreground">onChange</dt>
        <dd data-output className="font-mono break-all">{JSON.stringify(output)}</dd>
        <dt className="text-muted-foreground">your time</dt>
        <dd data-yours className="font-mono">
          {output
            ? new Date(output).toLocaleString("en-US", {
                weekday: "short",
                hour: "numeric",
                minute: "2-digit",
                timeZoneName: "short",
              })
            : "–"}
        </dd>
      </dl>
    </div>
  );
}

function RowsDemo({ value, onChange }: { value: Value; onChange: (value: Value) => void }) {
  const [rows, setRows] = useState(5);
  return (
    <div className="flex flex-col items-start gap-3">
      <Toggle options={[[1, "1 row"], [3, "3 rows"], [5, "5 rows"]]} value={rows} onChange={setRows} />
      <div className="w-full">
        <SchedulePicker variant="popover" dayCount={30} dayRows={rows} value={value} onChange={onChange} />
      </div>
    </div>
  );
}

export function App() {
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
  );
  const [locale, setLocale] = useState<"en-US" | "ja-JP">("en-US");
  const [hourCycle, setHourCycle] = useState<HourCycle>(12);
  const [minuteStep, setMinuteStep] = useState(5);
  const narrow = useNarrowScreen();

  // the pickers follow this `.dark` class on their own -- no theme prop needed
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <SchedulePickerProvider
      locale={locale}
      hourCycle={hourCycle}
      minuteStep={minuteStep}
      labels={locale === "ja-JP" ? jaLabels : undefined}
    >
      <div className="mx-auto max-w-5xl px-4 py-10">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">react-schedule-time-picker</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Three layouts, plain CSS, every part overridable. The original is rendered
              first, untouched. The toggles apply to every picker through{" "}
              <Code>SchedulePickerProvider</Code>.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Toggle options={[["light", "Light"], ["dark", "Dark"]]} value={theme} onChange={setTheme} />
            <Toggle options={[["en-US", "EN"], ["ja-JP", "日本語"]]} value={locale} onChange={setLocale} />
            <Toggle options={[[12, "12h"], [24, "24h"]]} value={hourCycle} onChange={setHourCycle} />
            <Toggle
              options={[[1, "1m"], [5, "5m"], [15, "15m"], [30, "30m"], [60, "1h"]]}
              value={minuteStep}
              onChange={setMinuteStep}
            />
          </div>
        </header>

        <div className="grid items-start gap-6 md:grid-cols-2">
          <Demo
            id="original"
            title="Original"
            description="schedule-picker.tsx as-is, with Tailwind + shadcn tokens. Ignores locale and hour cycle."
          >
            {(value, onChange) => <OriginalPicker value={value} onChange={onChange} />}
          </Demo>

          <Demo
            id="inline"
            title="Inline"
            description="Default styles from styles.css. Expands in place, collapses after the minute."
          >
            {(value, onChange) => <SchedulePicker variant="inline" value={value} onChange={onChange} />}
          </Demo>

          <Demo
            id="popover"
            title="Popover"
            description="Floats over the page, flips upward near the viewport bottom. Esc or outside press closes."
          >
            {(value, onChange) => <SchedulePicker variant="popover" value={value} onChange={onChange} />}
          </Demo>

          <Demo
            id="presets"
            title="Presets"
            description="One-tap quick picks, with the full picker one level deeper."
          >
            {(value, onChange) => <SchedulePicker variant="presets" value={value} onChange={onChange} />}
          </Demo>

          <Demo
            id="responsive"
            title="One component, any layout"
            description={
              <>
                <Code>variant={"{"}isMobile ? "inline" : "popover"{"}"}</Code>. Resize the
                window; the value carries over.
              </>
            }
          >
            {(value, onChange) => (
              <SchedulePicker
                variant={narrow ? "inline" : "popover"}
                value={value}
                onChange={onChange}
              />
            )}
          </Demo>

          <Demo
            id="rows"
            title="A month in rows"
            description={
              <>
                <Code>dayCount={"{30}"}</Code> with <Code>dayRows</Code>: 1 is the scrolling strip,
                more lays every day out at once.
              </>
            }
          >
            {(value, onChange) => <RowsDemo value={value} onChange={onChange} />}
          </Demo>

          <Demo
            id="value-types"
            title="The value you get"
            description={
              <>
                <Code>valueType</Code> picks what <Code>onChange</Code> gives you and what{" "}
                <Code>name</Code> submits. The picker itself works in your time zone.
              </>
            }
          >
            {(_, onChange) => <ValueTypesDemo onChange={onChange} />}
          </Demo>

          <Demo
            id="time-zone"
            title="Another time zone"
            description={
              <>
                <Code>timeZone</Code>: today, times and the value are that zone's. Open 9 to 5 on
                weekdays there, through <Code>isSlotDisabled</Code>.
              </>
            }
          >
            {(_, onChange) => <TimeZoneDemo onChange={onChange} />}
          </Demo>

          <Demo
            id="vars"
            title="Override: CSS variables"
            description={
              <>
                <Code>--yotei-primary</Code>, <Code>--yotei-radius</Code> … through the{" "}
                <Code>style</Code> prop. Works on any ancestor too.
              </>
            }
          >
            {(value, onChange) => (
              <SchedulePicker variant="popover"
                value={value}
                onChange={onChange}
                style={
                  {
                    "--yotei-primary": "oklch(0.541 0.281 293.009)",
                    "--yotei-primary-foreground": "white",
                    "--yotei-ring": "oklch(0.702 0.183 293.541)",
                    "--yotei-radius": "0.875rem",
                  } as CSSProperties
                }
              />
            )}
          </Demo>

          <Demo
            id="tailwind"
            title="Override: Tailwind classNames"
            description={
              <>
                Utilities per part, incl. state variants like <Code>data-selected:</Code>. No{" "}
                <Code>!</Code> needed.
              </>
            }
          >
            {(value, onChange) => (
              <SchedulePicker variant="inline"
                value={value}
                onChange={onChange}
                classNames={{
                  root: "[--yotei-primary:oklch(0.596_0.145_163.225)] [--yotei-primary-foreground:white]",
                  trigger: "rounded-full",
                  clear: "rounded-full",
                  panel: "rounded-2xl",
                  day: "rounded-full",
                  option: "rounded-full data-selected:font-bold",
                }}
              />
            )}
          </Demo>

          <Demo
            id="selectors"
            title="Override: plain CSS selectors"
            description={
              <>
                <Code>.yotei-option[data-selected]</Code>, <Code>.yotei-day[data-today]</Code> … from a
                regular stylesheet.
              </>
            }
          >
            {(value, onChange) => (
              <SchedulePicker variant="presets" value={value} onChange={onChange} className="demo-selectors" />
            )}
          </Demo>

          <Demo
            id="typography"
            title="Typography"
            description={
              <>
                Font family, size, weight, spacing, case and figures per text element via{" "}
                <Code>typography</Code>.
              </>
            }
          >
            {(value, onChange) => (
              <SchedulePicker variant="popover"
                value={value}
                onChange={onChange}
                typography={{
                  root: { fontFamily: "Georgia, 'Times New Roman', serif" },
                  triggerLabel: { fontStyle: "italic" },
                  month: { fontSize: 13, textTransform: "none", letterSpacing: 0 },
                  dayLabel: { textTransform: "none", letterSpacing: 0 },
                  dayNumber: { fontSize: 20, fontWeight: 400 },
                  columnLabel: { fontSize: 12, textTransform: "none", letterSpacing: 0 },
                  option: { fontWeight: 400, fontVariantNumeric: "tabular-nums" },
                  optionPeriod: { fontSize: 11, fontWeight: 400 },
                }}
              />
            )}
          </Demo>

          <Demo
            id="icons"
            title="Your own icons"
            description={
              <>
                Any ReactNode per slot through <Code>icons</Code>; <Code>null</Code> hides one.
                These are lucide-react.
              </>
            }
          >
            {(value, onChange) => (
              <SchedulePicker variant="inline"
                value={value}
                onChange={onChange}
                icons={{
                  clock: <AlarmClock />,
                  calendar: <CalendarCheck />,
                  chevronDown: <ChevronsUpDown />,
                  chevronLeft: <ArrowLeft />,
                  chevronRight: <ArrowRight />,
                  check: <CircleCheck />,
                  clear: <Eraser />,
                }}
              />
            )}
          </Demo>

          <Demo
            id="components"
            title="Your own day, hour and minute"
            description={
              <>
                Any markup per item through <Code>components</Code>. Keyboard, focus and selection
                come with the props you spread. Dots mark busy days.
              </>
            }
          >
            {(value, onChange) => (
              <SchedulePicker variant="popover" value={value} onChange={onChange} components={chipComponents} />
            )}
          </Demo>

          <Demo
            id="trigger"
            title="Your own trigger"
            description={
              <>
                <Code>components.Trigger</Code>: any button, with the picker's state as props.
                Focus, ARIA and the popover's placement come with the props you spread.
              </>
            }
          >
            {(value, onChange) => (
              <SchedulePicker variant="popover" value={value} onChange={onChange} components={triggerComponents} />
            )}
          </Demo>

          <Demo
            id="slots"
            title="Your own time section"
            description={
              <>
                <Code>components.TimeColumns</Code> swapped for a grid of open slots, with{" "}
                <Code>minuteStep={"{30}"}</Code>.
              </>
            }
          >
            {(value, onChange) => (
              <SchedulePicker
                variant="popover"
                minuteStep={30}
                value={value}
                onChange={onChange}
                components={slotComponents}
              />
            )}
          </Demo>

          <Demo
            id="shadcn"
            title="shadcn/ui registry"
            description={
              <>
                The wrapper <Code>npx shadcn add</Code> copies in, mapped to your theme tokens. This
                card only changes shadcn's <Code>--primary</Code>, <Code>--ring</Code> and{" "}
                <Code>--radius</Code>.
              </>
            }
          >
            {(value, onChange) => (
              <div className="[--primary-foreground:white] [--primary:oklch(0.546_0.245_262.881)] [--radius:1rem] [--ring:oklch(0.707_0.165_254.624)]">
                <ShadcnSchedulePicker variant="popover" value={value} onChange={onChange} />
              </div>
            )}
          </Demo>
        </div>
      </div>
    </SchedulePickerProvider>
  );
}
