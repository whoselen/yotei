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
      // The rest exists only to render the untouched ../schedule-picker.tsx next
      // to the variants (and give the wrapper its `cn`) -- the library imports none of it.
      "@original": path("../schedule-picker.tsx"),
      "next-intl": path("./playground/shims/next-intl.ts"),
      "@/lib/utils": path("./playground/shims/utils.ts"),
      "@/components/ui/button": path("./playground/shims/button.tsx"),
    },
    // the original lives outside this package, so make its imports resolve here
    dedupe: ["react", "react-dom", "lucide-react"],
  },
  server: { fs: { allow: [path("..")] } },
  build: { outDir: "../dist-playground", emptyOutDir: true },
});
