// Stand-in for next-intl so the untouched original renders in the playground
const messages: Record<string, string> = {
  placeholder: "Pick a date & time",
  clearAria: "Clear",
  scrollLeftAria: "Earlier days",
  scrollRightAria: "Later days",
  hourLabel: "Hour",
  minuteLabel: "Minute",
  pickHourFirst: "Pick an hour first",
};

export function useTranslations(_namespace?: string) {
  return (key: string) => messages[key] ?? key;
}
