import * as React from "react";
import { createRoot } from "react-dom/client";

import "./profiler.css";
import ProfilerForm from "./profilerForm";

declare global {
  interface Window {
    acquireVsCodeApi(): any;
  }
}

const root = createRoot(document.getElementById("root"));
root.render(<ProfilerForm />);
