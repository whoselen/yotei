import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const path = (relative: string) => fileURLToPath(new URL(relative, import.meta.url));

export default defineConfig({
  root: "playground",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // the shadcn registry wrapper imports the package by name; serve it from source
      "react-schedule-time-picker/styles.css": path("./src/styles.css"),
      "react-schedule-time-picker": path("./src/index.ts"),
      // ...and its `cn` from the app's utils
      "@/lib/utils": path("./playground/shims/utils.ts"),
    },
  },
  build: { outDir: "../dist-playground", emptyOutDir: true },
});
