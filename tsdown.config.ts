import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  // One output file per source module, so each keeps its own "use client":
  // components stay client components, and server code can still call the
  // plain helpers (toDate, fromDate, toLocalISO) re-exported from index.
  unbundle: true,
  // ...which is also why Rolldown's "directive may not be preserved" warning doesn't apply
  checks: { moduleLevelDirective: false },
  platform: "neutral",
  target: "es2022",
  dts: true,
  copy: [{ from: "src/styles.css", to: "dist" }],
});
