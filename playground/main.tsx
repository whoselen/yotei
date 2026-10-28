import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
// imported before Tailwind on purpose: the library's layer order holds either way
import "../src/styles.css";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
