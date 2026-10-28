/**
 * Every user-facing string. Day, month and time names come from `Intl`
 * via the `locale` prop; pass your i18n results (e.g. next-intl `t()`)
 * here for the rest.
 */
export interface ScheduleTimePickerLabels {
  placeholder: string;
  today: string;
  tomorrow: string;
  /** Narrow form used in the day strip */
  tomorrowShort: string;
  hour: string;
  minute: string;
  pickHourFirst: string;
  clear: string;
  back: string;
  scrollLeft: string;
  scrollRight: string;
  pickDateTime: string;
  inAnHour: string;
  thisEvening: string;
  tomorrowMorning: string;
  tomorrowAfternoon: string;
  nextMonday: string;
}

export const defaultLabels: ScheduleTimePickerLabels = {
  placeholder: "Pick a date & time",
  today: "Today",
  tomorrow: "Tomorrow",
  tomorrowShort: "Tmrw",
  hour: "Hour",
  minute: "Minute",
  pickHourFirst: "Pick an hour first",
  clear: "Clear",
  back: "Back",
  scrollLeft: "Earlier days",
  scrollRight: "Later days",
  pickDateTime: "Pick date & time",
  inAnHour: "In 1 hour",
  thisEvening: "This evening",
  tomorrowMorning: "Tomorrow morning",
  tomorrowAfternoon: "Tomorrow afternoon",
  nextMonday: "Next Monday",
};
