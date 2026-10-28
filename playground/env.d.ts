/// <reference types="vite/client" />

// Aliased to ../../schedule-picker.tsx in vite.config.ts. Declared here so the
// typecheck stays scoped to the library and doesn't need the original's app paths.
declare module "@original" {
  import type { ComponentType } from "react";

  type Value = { date: Date; hour: number; minute: number };

  export const ScheduleTimePicker: ComponentType<{
    value?: Value | null;
    onChange?: (value: Value | null) => void;
    dayCount?: number;
    placeholder?: string;
  }>;
}
