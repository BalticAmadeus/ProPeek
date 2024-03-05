import * as React from "react";
import { createRoot } from "react-dom/client";

import "./profiler.css";
import ProfilerForm from "./profilerForm";
import { PresentationData } from "../../../common/PresentationData";

declare global {
  interface Window {
    acquireVsCodeApi(): any;
    presentationData: PresentationData;
  }
}

const root = createRoot(document.getElementById("root"));
root.render(<ProfilerForm presentationData={window.presentationData} />);
