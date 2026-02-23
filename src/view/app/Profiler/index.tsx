import * as React from "react";
import { createRoot } from "react-dom/client";

import "./profiler.css";
import ProfilerForm from "./profilerForm";
import MuiThemeProvider from "../MuiTheming/MuiThemeProvider";

declare global {
  interface Window {
    acquireVsCodeApi(): any;
  }
}

const root = createRoot(document.getElementById("root"));
root.render(
  <MuiThemeProvider>
    <ProfilerForm />
  </MuiThemeProvider>,
);
