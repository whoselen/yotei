# react-schedule-time-picker

**A date & time picker for React that only picks the future.** A day strip,
hour and minute columns, and every time that has already passed disabled and
cleared as the clock moves. Built for scheduling: sending later, reminders,
bookings, deliveries, meetings.

[![npm](https://img.shields.io/npm/v/react-schedule-time-picker)](https://www.npmjs.com/package/react-schedule-time-picker)
[![license](https://img.shields.io/npm/l/react-schedule-time-picker)](https://www.npmjs.com/package/react-schedule-time-picker)

```tsx
import "react-schedule-time-picker/styles.css";
import { SchedulePicker } from "react-schedule-time-picker";

<SchedulePicker
  variant="popover"
  valueType="iso"
  onChange={(when) => save(when)}
/>;
// when === "2026-10-31T22:30:00.000Z"
```

_The project's name is yotei (予定, Japanese for "plan" or "schedule"), which
is why its CSS classes and variables start with `yotei-`._

## Highlights

- **Future-only by design.** Past days, hours and minutes are disabled as the
  clock moves, "Today" rolls over at midnight, and a picked time that slips
  into the past is cleared.
- **Three layouts, one API.** `inline`, `popover` and `presets` ("In 1 hour",
  "Tomorrow morning"…) take the same props, so switching is one prop.
- **The value you need.** `{ date, hour, minute }`, a `Date`, a UTC ISO
  string, an ISO string with offset, or a zoneless local string. Forms and
  server actions get it through `name`.
- **Any time zone.** Let a user in Tokyo book New York times. "Today", past
  times, labels and the value all follow the zone, and daylight saving is
  handled. There's no date library, only `Intl`.
- **Opening hours and bookings.** `isSlotDisabled` blocks any slot, and
  hours and days with nothing left disable themselves.
- **Plain CSS that loses every fight.** Change it with CSS variables,
  selectors or Tailwind `classNames`, without `!important`. Dark mode is
  built in, and a shadcn/ui registry item maps it to your theme.
- **Swap any part.** Bring your own trigger, day, hour or minute, or replace
  the whole day strip or time section. Keyboard navigation and focus keep
  working.
- **Keyboard and screen-reader friendly.** Arrow keys inside each list, one Tab
  stop per list, ARIA states, and focus returned to the trigger.
- **Ready for server rendering.** It renders from React Server Components and
  on statically prerendered Next.js pages without hydration errors.
- **Small, with no runtime dependencies.** About 8.6 kB min+gzip for all three
  layouts, about 7.5 kB for one, plus 4.2 kB of CSS. It's ESM, tree-shakable
  and fully typed.

## Contents

- [Install](#install)
- [Quick start](#quick-start)
- [Layouts](#layouts)
- [The value](#the-value)
- [Forms](#forms)
- [Time zones](#time-zones)
- [Availability: opening hours, bookings, past times](#availability-opening-hours-bookings-past-times)
- [Minute step](#minute-step)
- [Days in rows](#days-in-rows)
- [Presets](#presets)
- [Localization](#localization)
- [Styling](#styling)
- [Custom components](#custom-components)
- [App-wide defaults](#app-wide-defaults)
- [Server rendering](#server-rendering)
- [Accessibility and keyboard](#accessibility-and-keyboard)
- [Headless: build your own layout](#headless-build-your-own-layout)
- [API reference](#api-reference)
- [Requirements](#requirements)

## Install

```sh
npm install react-schedule-time-picker
# or: pnpm add, yarn add, bun add react-schedule-time-picker
```

React 18 or 19. The package is ESM only and has no runtime dependencies. Using
shadcn/ui? See [shadcn/ui](#shadcnui) for a wrapper that follows your theme.

## Quick start

Import the stylesheet once, anywhere in your app, then render a picker:

```tsx
import { useState } from "react";
import "react-schedule-time-picker/styles.css";
import { SchedulePicker } from "react-schedule-time-picker";

export function SendLater() {
  const [when, setWhen] = useState<string | null>(null);
  return (
    <SchedulePicker
      variant="popover"
      valueType="iso"
      value={when}
      onChange={setWhen}
      placeholder="Send at…"
    />
  );
}
```

The user picks a day, then an hour, then a minute. The panel closes once the
minute is picked, and `onChange` gets the value, or `null` when it's cleared.
Leave out `value` to let the picker hold it (`defaultValue` sets the first
one).

## Layouts

| `variant`            |                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"inline"` (default) | Expands in place, pushing the content below it down, and collapses after the pick. Best on phones.                     |
| `"popover"`          | Floats over the page and flips above the trigger near the bottom of the viewport. Escape or a click outside closes it. |
| `"presets"`          | One-tap choices ("In 1 hour", "This evening", "Tomorrow morning"…), with the full picker one level deeper.             |

Every layout takes the same props, so `variant={isMobile ? "inline" : "popover"}`
just works. Changing `variant` remounts the layout, so keep `value` controlled
if you switch at runtime. Layout-specific props are typed to their layout:
`presets` only compiles with `variant="presets"`, and `align` only with
`"popover"` or `"presets"`.

`SchedulePicker` includes all three layouts. If you only use one, import it
directly so only that layout ends up in your bundle:

```tsx
import { PopoverSchedulePicker } from "react-schedule-time-picker"; // also InlineSchedulePicker, PresetSchedulePicker
```

## The value

By default the value is `{ date, hour, minute }`, with `date` at local
midnight of the picked day. `valueType` chooses what `onChange` gives you
instead, and what `value` and `defaultValue` take:

| `valueType`         | `onChange` gets               | Good for                                                  |
| ------------------- | ----------------------------- | --------------------------------------------------------- |
| `"parts"` (default) | `{ date, hour, minute }`      | Working with the picked day and time separately           |
| `"date"`            | a `Date`                      | Working with the moment in code                           |
| `"iso"`             | `"2026-10-31T22:30:00.000Z"`  | APIs and databases: the exact moment, in UTC              |
| `"offset"`          | `"2026-10-31T15:30:00-07:00"` | The exact moment, plus the local time the user saw        |
| `"local"`           | `"2026-10-31T15:30"`          | A time with no zone, like `<input type="datetime-local">` |

```tsx
const [when, setWhen] = useState<string | null>(null);
<SchedulePicker valueType="iso" value={when} onChange={setWhen} />;

const [at, setAt] = useState<Date | null>(null);
<SchedulePicker valueType="date" value={at} onChange={setAt} />;
```

- **Exact moments travel; local times don't.** `"date"`, `"iso"` and
  `"offset"` are exact moments, so a server or a user in another zone gets
  the same moment. `"local"` and parts have no zone, so a server reads them in
  its own. Use them only when the zone doesn't matter, or send the zone along.
- **TypeScript checks it.** `value`, `defaultValue` and `onChange` are typed
  by the `valueType` you choose. `valueType="iso"` with a `Date` value doesn't
  compile.
- **Runtime is forgiving.** `value` and `defaultValue` accept any of the
  forms, so a server can pass down an ISO string. A string with a zone (`Z`,
  `-07:00`) is read as an exact moment, and one without is taken as written.
  Anything unreadable counts as empty.
- **Helpers** convert between the forms: `toDate`, `toISO`, `toOffsetISO` and
  `toLocalISO` turn parts into each form, and `fromDate` and `fromISO` read
  them back. They're plain functions that also run on the server, and each
  takes an optional time zone as its last argument.

```ts
import { fromISO, toISO, toOffsetISO } from "react-schedule-time-picker";

const value = fromISO("2026-10-31T22:30:00.000Z"); // { date, hour, minute } in local time
toISO(value); // "2026-10-31T22:30:00.000Z"

const tokyo = fromISO("2026-10-31T22:30:00.000Z", "Asia/Tokyo"); // Nov 1, 7:30 on Tokyo's clock
toOffsetISO(tokyo, "Asia/Tokyo"); // "2026-11-01T07:30:00+09:00"
```

The zone says whose clock the parts are on, so read and write them with the
same zone.

## Forms

**React Hook Form:** spread the field. `onBlur` fires when the panel closes,
and `ref` lands on the trigger so a validation error can focus it.

```tsx
<Controller
  name="sendAt"
  control={control}
  rules={{ required: true }}
  render={({ field }) => (
    <SchedulePicker variant="popover" valueType="iso" {...field} />
  )}
/>
```

**Plain forms and server actions:** `name` renders a hidden input carrying
the value:

| `valueType`          | The form submits            |
| -------------------- | --------------------------- |
| `"parts"`, `"local"` | `2026-10-31T15:30`          |
| `"date"`, `"iso"`    | `2026-10-31T22:30:00.000Z`  |
| `"offset"`           | `2026-10-31T15:30:00-07:00` |

```tsx
// app/actions.ts
"use server";
export async function schedule(formData: FormData) {
  const at = new Date(String(formData.get("at"))); // the same moment on any server
}

// a client component
<form action={schedule}>
  <SchedulePicker valueType="iso" name="at" />
  <button type="submit">Schedule</button>
</form>;
```

With `"iso"`, `new Date(...)` gives the right moment whatever time zone the
server runs in.

## Time zones

The picker works in the browser's time zone unless you give it another one.
Here a patient in Tokyo books a New York clinic, in New York time:

```tsx
<SchedulePicker
  timeZone="America/New_York"
  valueType="offset" // "2026-10-31T15:30:00-04:00"
  isSlotDisabled={(slot, moment) =>
    slot.getHours() < 9 || slot.getHours() >= 17 || booked.has(moment.getTime())
  }
/>
```

- **Everything follows the zone:** which day is "Today", which times have
  passed, the labels, and what the value means. `"iso"` and `"date"` are the
  exact moment, `"offset"` carries the zone's offset, and `"local"` and parts
  read New York's clock.
- **Daylight saving:** times the zone skips when clocks spring forward (2:30
  AM) are disabled. A time that happens twice when clocks fall back means the
  first one.
- **Show the zone.** Users read the times as the zone's, not their own.
  `picker.timeZone` is available to a [custom trigger](#the-trigger).
- **Servers agree.** With a fixed zone, a server renders the same time the
  browser will show, whatever zone the server runs in. The helpers take the
  zone too: `toISO(value, "America/New_York")`.
- Set it once for the app with `<SchedulePickerProvider timeZone="…">`. An
  unknown zone logs a warning and falls back to local time.
- One edge case: a time that the _browser's own_ zone skips (its
  spring-forward hour) can't be picked in another zone either, for that one
  hour a year. It shows as disabled, never as a wrong time.

## Availability: opening hours, bookings, past times

Three rules decide what can be picked:

1. **Time:** only times after now, and only within `dayCount` days
   (starting today).
2. **Existence:** times skipped by daylight saving are disabled.
3. **Your rule:** `isSlotDisabled(slot, moment)` returns `true` to block a
   slot.

```tsx
<SchedulePicker
  isSlotDisabled={(slot, moment) => {
    const day = slot.getDay();
    const hour = slot.getHours();
    if (day === 0 || day === 6) return true; // weekends
    if (hour < 9 || hour >= 17) return true; // outside 9 to 5
    return bookedTimes.has(moment.getTime()); // already booked
  }}
/>
```

- `slot` reads in the picker's time zone (`slot.getHours()` is the hour on
  screen). `moment` is the exact moment, to compare with stored times. They
  only differ when `timeZone` is set.
- You decide per minute slot, and hours and days follow. An hour is disabled
  only when all its minutes are, and a day only when it has no open time
  left. If only 2:00–2:30 is booked, 2 PM stays open with `:00` to `:25`
  disabled. Blocked presets are hidden.
- Disabled items get `data-disabled`, so CSS can restyle or hide them:
  `.yotei-option[data-disabled] { display: none }`. Keyboard navigation skips
  them either way.
- The function runs for every slot when the picker renders, so keep it fast
  (look up a `Set`, not an array).
- If a controlled value becomes unavailable, for example because it passed
  or got booked, the picker clears it and calls `onChange(null)`.

## Minute step

`minuteStep` sets the gap between selectable times, from every minute to every
hour:

```tsx
<SchedulePicker minuteStep={1} />   // :00 :01 :02 … :59
<SchedulePicker minuteStep={15} />  // :00 :15 :30 :45
<SchedulePicker minuteStep={60} />  // hourly: no minute column, picking the hour completes it
```

- **On opening,** the minute list scrolls to the selected minute, or to the
  first one still in the future (`:38` at 10:37 with a 1-minute step).
- **Keyboard:** each list is one Tab stop. `↑` `↓` `Home` `End` `PgUp` `PgDn`
  move inside it, so 60 minutes are as quick to reach as 4.
- **Presets round up to the step:** "In 1 hour" at 10:12 becomes 11:15 with
  `minuteStep={15}`.
- **Values between steps are kept:** a loaded value of 10:07 with
  15-minute steps is shown selected, not silently changed.
- Steps that divide 60 (1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30) space evenly.
  Others restart at `:00` each hour, and anything outside 1 to 60 is clamped.

## Days in rows

By default the days are one scrolling strip, which suits a week or two. With
more days, `dayRows` lays them all out at once:

```tsx
<SchedulePicker dayCount={30} dayRows={5} />  // a month: 5 rows of 6
<SchedulePicker dayCount={28} dayRows={4} />  // 4 weeks: each column is one weekday
<SchedulePicker dayCount={14} dayRows={2} />  // 2 weeks of 7
```

- **Layout:** each row holds `ceil(dayCount / dayRows)` days, read left to
  right, then top to bottom. The rows share the panel's width and never
  scroll sideways.
- **Cells:** the 1st of a month shows the month's name ("NOV"), so a 1 after a
  31 reads right. A cell too narrow for its label (10 or more days to a row on
  a phone) shows just the date. The header names every month in view, e.g.
  "Oct – Nov 2026".
- **Keyboard:** all the days are one Tab stop. `←` `→` move a day, `↑` `↓` move
  a row, and `Home` `End` jump to the first and last open day.
- **Height:** each extra row adds about 48px, and popovers account for it
  when deciding whether to open above or below.

## Presets

The `"presets"` layout opens on one-tap choices, with "Pick date & time"
leading to the full picker. The defaults are "In 1 hour", "This evening"
(6 PM), "Tomorrow morning" (9 AM), "Tomorrow afternoon" (2 PM) and "Next
Monday" (9 AM). Bring your own:

```tsx
import { getDefaultPresets, defaultLabels, type SchedulePreset } from "react-schedule-time-picker";

const presets: SchedulePreset[] = [
  {
    label: "In 30 minutes",
    getDate: (now) => new Date(now.getTime() + 30 * 60_000),
  },
  ...getDefaultPresets(defaultLabels),
  {
    label: "Friday at noon",
    getDate: (now) => {
      const d = new Date(now);
      d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7 || 7));
      d.setHours(12, 0, 0, 0);
      return d;
    },
  },
];

<SchedulePicker variant="presets" presets={presets} />;
```

- `getDate(now)` returns the preset's time, or `null` to hide the row. `now`
  reads in the picker's time zone.
- Times are rounded up to `minuteStep`. Presets in the past, beyond
  `dayCount`, blocked by `isSlotDisabled`, or duplicating another preset are
  hidden.
- Each row shows when it lands ("Wed 9:00 AM"), and the picked preset is
  checked.

## Localization

Day, month and time names come from `Intl` through `locale`. Everything else
is in `labels`:

```tsx
<SchedulePicker
  locale="ja-JP"
  hourCycle={24}
  labels={{
    placeholder: "日時を選択",
    today: "今日",
    tomorrow: "明日",
    tomorrowShort: "明日",
  }}
/>
```

`hourCycle` is `12` or `24`. Locales that put the period first, like
Japanese, Korean and Chinese, show "午後 3" rather than "3 PM". Pass your i18n
library's strings straight into `labels`, e.g. `labels={{ placeholder:
t("pickTime") }}`.

| Label           | Default            |     | Label               | Default            |
| --------------- | ------------------ | --- | ------------------- | ------------------ |
| `placeholder`   | Pick a date & time |     | `scrollLeft`        | Earlier days       |
| `today`         | Today              |     | `scrollRight`       | Later days         |
| `tomorrow`      | Tomorrow           |     | `pickDateTime`      | Pick date & time   |
| `tomorrowShort` | Tmrw               |     | `inAnHour`          | In 1 hour          |
| `hour`          | Hour               |     | `thisEvening`       | This evening       |
| `minute`        | Minute             |     | `tomorrowMorning`   | Tomorrow morning   |
| `pickHourFirst` | Pick an hour first |     | `tomorrowAfternoon` | Tomorrow afternoon |
| `clear`         | Clear              |     | `nextMonday`        | Next Monday        |
| `back`          | Back               |     |                     |                    |

## Styling

`react-schedule-time-picker/styles.css` is plain CSS and doesn't need
Tailwind. It's built to lose every fight: all rules sit in `@layer components`
behind zero-specificity `:where()` selectors, so your styles win without
`!important`. It only styles the picker's own elements, so your custom
components keep your page's styles. You can mix the approaches below.

### CSS variables

```css
:root {
  --yotei-primary: #6d28d9; /* both modes */
  --yotei-dark-surface: #18181b; /* dark mode only */
  --yotei-radius: 0.875rem;
}
```

| Variable                                                         | Used for                                                 |
| ---------------------------------------------------------------- | -------------------------------------------------------- |
| `--yotei-primary`, `--yotei-primary-foreground`                  | Selected day, hour and minute; the filled trigger's icon |
| `--yotei-surface`, `--yotei-foreground`                          | Panel background and text                                |
| `--yotei-field`                                                  | Trigger and clear button background                      |
| `--yotei-muted`, `--yotei-muted-foreground`                      | Subtle backgrounds, secondary text                       |
| `--yotei-accent`, `--yotei-accent-foreground`                    | Hover                                                    |
| `--yotei-border`, `--yotei-input`, `--yotei-ring`                | Panel border, trigger border, focus ring                 |
| `--yotei-radius`, `--yotei-list-height`, `--yotei-popover-width` | Sizes                                                    |

Each color also has `--yotei-light-*` and `--yotei-dark-*` versions for one
mode only. Set the variables on `:root`, on any ancestor, or on one picker
through `style`. A plain `--yotei-primary` on `:root` covers both modes when
`.dark` sits on `<html>` (as with next-themes and shadcn/ui). For a dark
section further down the page, use the `--yotei-dark-*` versions.

### Selectors

Every element has a stable `yotei-*` class, and state is in data attributes:

```css
.yotei-option[data-selected] {
  background: hotpink;
}
.yotei-day[data-today] .yotei-day-number {
  color: orange;
}
.yotei-popover[data-side="top"] {
  margin-bottom: 1rem;
}
```

| Attribute                 | On                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| `data-selected`           | `.yotei-day`, `.yotei-option`, `.yotei-preset`                                             |
| `data-disabled`           | `.yotei-day`, `.yotei-option` (past or blocked); `.yotei-root` when `disabled`             |
| `data-today`              | `.yotei-day`                                                                               |
| `data-month-start`        | `.yotei-day` on the 1st of a month                                                         |
| `data-layout`             | `.yotei-day-list`: `strip` or `grid`                                                       |
| `data-filled`             | `.yotei-trigger` once a time is picked                                                     |
| `data-state`              | `open` or `closed` on `.yotei-root`, `.yotei-trigger`, `.yotei-collapse`, `.yotei-popover` |
| `data-side`, `data-align` | `.yotei-popover`                                                                           |
| `data-variant`            | `.yotei-root`: `inline`, `popover` or `presets`                                            |
| `data-column`             | `.yotei-column`: `hour` or `minute`                                                        |

### Tailwind

Pass utilities per part through `classNames`. State variants work directly:

```tsx
<SchedulePicker
  classNames={{
    root: "[--yotei-primary:var(--color-violet-600)]",
    trigger: "rounded-full",
    option: "data-selected:font-bold",
  }}
/>
```

Part keys: `root` · `triggerRow` · `trigger` · `triggerIcon` · `triggerLabel` ·
`triggerIndicator` · `clear` · `collapse` · `popover` · `panel` ·
`panelHeader` · `back` · `days` · `daysHeader` · `month` · `nav` ·
`navButton` · `dayList` · `day` · `dayLabel` · `dayNumber` · `dayWeekday` ·
`todayDot` · `time` · `column` · `columnLabel` · `list` · `option` ·
`optionLabel` · `optionPeriod` · `optionCheck` · `empty` · `presets` ·
`preset` · `presetIcon` · `presetLabel` · `presetHint` · `presetCheck` ·
`presetArrow` · `separator`. Each key's class is its kebab-case form:
`optionPeriod` is `.yotei-option-period`.

### Typography

Each element that shows text takes its own font settings. They apply inline,
so they win over any stylesheet, and `root` is inherited by all of them:

```tsx
<SchedulePicker
  typography={{
    root: { fontFamily: "Inter, sans-serif" },
    dayNumber: { fontSize: 20, fontWeight: 600 },
    option: { fontVariantNumeric: "tabular-nums" },
  }}
/>
```

Keys: `root`, `triggerLabel`, `month`, `dayLabel`, `dayNumber`, `dayWeekday`,
`columnLabel`, `option`, `optionPeriod`, `empty`, `presetLabel`,
`presetHint` and `back`. Each accepts `fontFamily`, `fontSize`, `fontWeight`,
`fontStyle`, `lineHeight`, `letterSpacing`, `textTransform` and
`fontVariantNumeric`.

### Icons

Swap any icon for any React node. Icons are sized by the slot they sit in, and
`null` hides one (`clear: null` removes the clear button):

```tsx
import { AlarmClock, CalendarCheck, Eraser } from "lucide-react";

<SchedulePicker
  icons={{
    clock: <AlarmClock />,
    calendar: <CalendarCheck />,
    clear: <Eraser />,
  }}
/>;
```

Slots: `clock` (the empty trigger), `calendar` (the filled trigger and "Pick
date & time"), `chevronDown`, `chevronLeft`, `chevronRight`, `check` and
`clear`.

### Dark mode

The picker turns dark inside `.dark` or `[data-theme="dark"]`, so next-themes
and shadcn/ui work without setup. The `theme` prop forces `"light"`, `"dark"`
or `"system"` on one picker.

### shadcn/ui

The registry item adds `components/ui/schedule-picker.tsx`, a short wrapper
that points the `--yotei-*` variables at your theme tokens (`--primary`,
`--popover`, `--border`, `--radius`…), and installs the package:

```sh
npx shadcn@latest add https://<github>/r/schedule-picker.json
```

```tsx
import { SchedulePicker } from "@/components/ui/schedule-picker";

<SchedulePicker variant="popover" value={value} onChange={setValue} />;
```

The file is yours to edit like any shadcn component. It follows your theme
and its `.dark` class. If you write your own wrapper instead, make it generic
over the value type, as this one is, so `valueType` keeps typing `onChange`.

### Fully custom

Skip `styles.css`. The pickers still open, close and keep focus correctly,
and you style the `yotei-*` classes from scratch. To change markup rather than
styles, use [custom components](#custom-components).

## Custom components

When styling isn't enough, render parts yourself through `components`: the
trigger, a single day, hour or minute, or a whole section. Define these
components outside render, or memoize them; a new component on every render
remounts the items and loses keyboard focus.

### The trigger

`Trigger` replaces the button that opens the panel, and the clear button
beside it. It receives:

- `picker`: the picker's state (what `useSchedulePicker` returns: `value`,
  `formatValue`, `timeZone`, `clear`…);
- `open`: whether the panel is open;
- `label`: what the default trigger shows ("Tomorrow, 3:30 PM", or the
  placeholder);
- `onClear`: clears the value and puts focus back on the trigger;
- the props to spread on your `<button>`: the click handler, ref, ARIA,
  `data-state` and `data-filled`.

```tsx
import { Button } from "@/components/ui/button";
import type { TriggerProps } from "react-schedule-time-picker";

function ButtonTrigger({
  picker,
  open,
  label,
  onClear,
  ...props
}: TriggerProps) {
  return (
    <div className="flex gap-2">
      <Button variant="outline" {...props} className="flex-1 justify-start">
        <CalendarIcon />
        <span suppressHydrationWarning>{label}</span>
      </Button>
      {picker.value && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onClear}
          aria-label="Clear"
        >
          <XIcon />
        </Button>
      )}
    </div>
  );
}

<SchedulePicker variant="popover" components={{ Trigger: ButtonTrigger }} />;
```

- **The ref has to reach your button.** The popover is placed against it,
  focus returns to it after a pick, and a `ref` on `<SchedulePicker>` points
  to it. Spreading the props passes it on in React 19. In React 18, wrap your
  component in `forwardRef`.
- **Server rendering:** the server and the browser can disagree on `label`
  (clock, time zone), so put `suppressHydrationWarning` on the element that
  renders it, as above.
- **Keep the default content** by not passing children:
  `<Button variant="outline" {...props} />` puts the picker's icon, label and
  chevron inside your own button.

### One day, hour or minute

`Day`, `Hour` and `Minute` replace a single item. Each gets its data (`day`,
`hour` or `minute`) plus the props to spread on a `<button>`: the click
handler, roving focus, ARIA, `data-*` state and the default class. Spread
them, and keyboard navigation, scrolling and selection keep working:

```tsx
import type { DayProps, HourProps } from "react-schedule-time-picker";

function MyDay({ day, label, ...props }: DayProps) {
  return (
    <button {...props} className="my-day">
      <small>{label}</small>
      <strong>{day.date.getDate()}</strong>
      {hasEvents(day.date) && <span className="dot" />}
    </button>
  );
}

function MyHour({ hour, ...props }: HourProps) {
  return (
    <button {...props}>
      {hour.label} {hour.period}
    </button>
  );
}

<SchedulePicker components={{ Day: MyDay, Hour: MyHour }} />;
```

- `className` and `children` hold the default class and content. Pass your own
  after the spread to replace them, or keep them:
  `<button {...props}>{props.children}<Badge /></button>`.
- State is on the data (`day.isSelected`, `isDisabled`, `isToday`…) and on the
  element (`data-selected`, `data-disabled`, `data-today`), so Tailwind's
  `data-selected:bg-primary` works.

### A whole section

`DayStrip` and `TimeColumns` replace a whole section, e.g. a month calendar or
a grid of open slots like Calendly's. Each gets the picker's state as `picker`.
`TimeColumns` calls `onComplete` once a pick is done, which closes the panel:

```tsx
import type { TimeColumnsProps } from "react-schedule-time-picker";

function SlotGrid({ picker, onComplete }: TimeColumnsProps) {
  const day = picker.selectedDay;
  return (
    <div className="slots">
      {picker.hours.flatMap(({ value: hour }) =>
        picker.minuteSlots
          .filter((minute) => picker.isSlotAvailable(day, hour, minute))
          .map((minute) => (
            <button
              key={`${hour}:${minute}`}
              aria-pressed={
                picker.selectedHour === hour && picker.selectedMinute === minute
              }
              onClick={() => {
                const slot = new Date(day);
                slot.setHours(hour, minute);
                if (picker.selectSlot(slot)) onComplete?.();
              }}
            >
              {picker.fmt.time(hour, minute)}
            </button>
          )),
      )}
    </div>
  );
}

<SchedulePicker minuteStep={30} components={{ TimeColumns: SlotGrid }} />;
```

## App-wide defaults

`SchedulePickerProvider` sets defaults for every picker below it: variant,
time zone, locale, hour cycle, labels, minute step, day count and rows, theme,
icons, components, classNames and typography. A picker's own props still win.
Class names from both levels are combined, and icons, components, labels and
typography merge per key. Providers can be nested.

```tsx
<SchedulePickerProvider
  variant="popover"
  timeZone="Europe/Berlin"
  locale="de-DE"
  hourCycle={24}
  minuteStep={15}
  typography={{ root: { fontFamily: "var(--font-sans)" } }}
>
  <App />
</SchedulePickerProvider>
```

## Server rendering

The pickers are client components (`"use client"`), so Server Components can
render them directly. They also work on statically prerendered pages,
including Next.js with Cache Components, without a `<Suspense>` boundary. The
value helpers (`toISO`, `fromISO`…) and `defaultLabels` are plain functions you
can call on the server.

The server can't know the browser's clock, so it renders only the closed
trigger. A value shows as a date ("Oct 31, 3:30 PM") and becomes "Tomorrow,
3:30 PM" once the page hydrates, without hydration warnings. The panels render
in the browser only.

## Accessibility and keyboard

Days, hours, minutes and presets are native buttons with `aria-pressed`. Each
day has its full date as its label, and the popover is a labelled `dialog`.
The trigger announces `aria-expanded` and `aria-controls`.

| Where                 | Keys                                                                                                        |
| --------------------- | ----------------------------------------------------------------------------------------------------------- |
| Trigger               | `Enter` / `Space` opens and closes                                                                          |
| Day strip             | `←` `→` previous / next day · `↑` `↓` a row up / down (with `dayRows`) · `Home` `End` first / last open day |
| Hour and minute lists | `↑` `↓` · `PgUp` `PgDn` (5 at a time) · `Home` `End`                                                        |
| Anywhere in the panel | `Escape` closes and returns focus to the trigger                                                            |

Each list is a single Tab stop with roving focus, and disabled items are
skipped. After a pick, focus returns to the trigger.

## Headless: build your own layout

`useSchedulePicker` is the core every layout is built on: selection state,
availability rules, formatters and the clock. It takes the same options as the
component (`valueType`, `value`, `defaultValue`, `onChange`, `dayCount`,
`minuteStep`, `hourCycle`, `locale`, `labels`, `timeZone`, `isSlotDisabled`).

```tsx
import { useSchedulePicker, DayStrip, TimeColumns } from "react-schedule-time-picker";

function MyPicker() {
  const picker = useSchedulePicker({ valueType: "iso", onChange: console.log });
  return (
    <div className="my-layout">
      <DayStrip picker={picker} rows={2} />
      <TimeColumns picker={picker} onComplete={() => {}} />
    </div>
  );
}
```

| Field                                                                                |                                                                                         |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `value`                                                                              | The pick as `{ date, hour, minute }`, whatever the `valueType`                          |
| `days`                                                                               | `{ date, key, isToday, isTomorrow, isSelected, isDisabled }` for each day               |
| `hours`, `minutes`                                                                   | `{ value, label, isSelected, isDisabled }` (hours add `period`)                         |
| `selectedDay`, `selectedHour`, `selectedMinute`                                      | The pick in progress                                                                    |
| `selectDay(date)`, `selectHour(h)`, `selectMinute(m)`, `selectSlot(date)`, `clear()` | Actions; each returns whether it did anything                                           |
| `isSlotAvailable(day, h, m)`, `isHourAvailable(day, h)`, `isDayAvailable(day)`       | The availability rules                                                                  |
| `now`, `today`, `timeZone`                                                           | The clock, read in the picker's zone. `now` is `null` until the browser's clock is read |
| `minuteSlots`, `minuteStep`, `hourCycle`, `valueType`, `labels`                      | Settings in effect                                                                      |
| `fmt`, `formatDay(date)`, `formatValue(value)`                                       | Locale-aware formatting ("Tomorrow", "3:30 PM")                                         |

While server-rendering and hydrating, `now` is `null`: `days` is empty, no
slot is available, and `formatDay` returns dates rather than "Today". Render
anything that depends on the time only once `now` is set.

## API reference

### Props

All layouts take these props. The **Provider** column marks the props that can
also be set on `SchedulePickerProvider`.

| Prop                 | Type                                                  | Default              | Provider |                                                                              |
| -------------------- | ----------------------------------------------------- | -------------------- | -------- | ---------------------------------------------------------------------------- |
| `variant`            | `"inline"`, `"popover"` or `"presets"`                | `"inline"`           | ✓        | `SchedulePicker` only. See [Layouts](#layouts)                               |
| `valueType`          | `"parts"`, `"date"`, `"iso"`, `"offset"` or `"local"` | `"parts"`            |          | See [The value](#the-value)                                                  |
| `value`              | the `valueType`'s value, or `null`                    |                      |          | Controlled value                                                             |
| `defaultValue`       | the `valueType`'s value, or `null`                    | `null`               |          | Initial value when uncontrolled                                              |
| `onChange`           | `(value) => void`                                     |                      |          | A complete value, or `null` when cleared                                     |
| `onBlur`             | `() => void`                                          |                      |          | Called when the panel closes                                                 |
| `name`               | `string`                                              |                      |          | Renders a hidden input for forms. See [Forms](#forms)                        |
| `timeZone`           | `string` (IANA)                                       | the browser's        | ✓        | See [Time zones](#time-zones)                                                |
| `isSlotDisabled`     | `(slot: Date, moment: Date) => boolean`               |                      |          | See [Availability](#availability-opening-hours-bookings-past-times)          |
| `dayCount`           | `number`                                              | `14`                 | ✓        | Days that can be picked, starting today                                      |
| `dayRows`            | `number`                                              | `1`                  | ✓        | See [Days in rows](#days-in-rows)                                            |
| `minuteStep`         | `number`, 1 to 60                                     | `5`                  | ✓        | See [Minute step](#minute-step)                                              |
| `hourCycle`          | `12` or `24`                                          | `12`                 | ✓        |                                                                              |
| `locale`             | `string` (BCP 47)                                     | `"en-US"`            | ✓        | Day, month and time names                                                    |
| `labels`             | `Partial<ScheduleTimePickerLabels>`                   | English              | ✓        | See [Localization](#localization)                                            |
| `placeholder`        | `string`                                              | `labels.placeholder` |          | Trigger text before a pick                                                   |
| `disabled`           | `boolean`                                             | `false`              |          | Disables the whole picker                                                    |
| `theme`              | `"light"`, `"dark"` or `"system"`                     | follows the page     | ✓        |                                                                              |
| `className`, `style` |                                                       |                      |          | On the root element                                                          |
| `classNames`         | `Partial<Record<SchedulePickerPart, string>>`         |                      | ✓        | See [Tailwind](#tailwind)                                                    |
| `typography`         | `SchedulePickerTypography`                            |                      | ✓        | See [Typography](#typography)                                                |
| `icons`              | `Partial<SchedulePickerIcons>`                        | built-in             | ✓        | See [Icons](#icons)                                                          |
| `components`         | `Partial<SchedulePickerComponents>`                   |                      | ✓        | See [Custom components](#custom-components)                                  |
| `align`              | `"start"` or `"end"`                                  | `"start"`            |          | `"popover"` and `"presets"` only: which trigger edge the panel lines up with |
| `presets`            | `SchedulePreset[]`                                    | 5 defaults           |          | `"presets"` only. See [Presets](#presets)                                    |
| `ref`                | `Ref<HTMLButtonElement>`                              |                      |          | Forwarded to the trigger                                                     |

### Exports

| Export                                                                  |                                                                      |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `SchedulePicker`                                                        | Every layout behind one component (`ScheduleTimePicker` is an alias) |
| `InlineSchedulePicker`, `PopoverSchedulePicker`, `PresetSchedulePicker` | One layout each, for smaller bundles                                 |
| `SchedulePickerProvider`                                                | App-wide defaults                                                    |
| `useSchedulePicker`                                                     | The headless core                                                    |
| `DayStrip`, `TimeColumns`                                               | Building blocks for your own layout                                  |
| `toDate`, `toISO`, `toOffsetISO`, `toLocalISO`, `fromDate`, `fromISO`   | Value helpers (server-safe)                                          |
| `getDefaultPresets`, `defaultLabels`                                    | The built-in presets and strings, to extend                          |

Types: `SchedulePickerProps`, `ScheduleValue`, `ScheduleValueType`,
`ScheduleTimePickerValue`, `SchedulePickerState`, `SchedulePickerConfig`,
`SchedulePreset`, `ScheduleTimePickerLabels`, `TriggerProps`, `DayProps`,
`HourProps`, `MinuteProps`, `DayStripProps`, `TimeColumnsProps`,
`PickerDay`, `PickerHour`, `PickerMinute`, `SchedulePickerComponents`,
`SchedulePickerIcons`, `SchedulePickerPart`, `SchedulePickerTypography` and
more. The type definitions carry doc comments, so your editor shows them on
hover.

## Requirements

- React 18 or 19 (`react` and `react-dom` are peer dependencies).
- ESM only, with a CSS import (`react-schedule-time-picker/styles.css`). Vite
  and Next.js (App Router) handle both out of the box.
- Browsers: Chrome and Edge 111+, Safari 16.2+, Firefox 113+. The stylesheet
  uses `oklch()` and `color-mix()`.

## Development

```sh
npm install
npm run dev               # playground: every layout and option
npm run typecheck
npm run build             # dist/: ESM, one file per module, types, styles.css
npm run check:package     # build, then publint and arethetypeswrong on the packed tarball
npm run build:playground  # the docs site, with the shadcn registry at /r/schedule-picker.json
```

## License

MIT. The built-in icons are adapted from [Lucide](https://lucide.dev) (ISC) and
Feather (MIT); see `LICENSE`.
