import * as React from "react";

import "./profiler.css";
import ProfilerForm from "./profilerForm";
import { PresentationData } from "../../../common/PresentationData";
import { renderRoot } from "../renderRoot";

declare global {
  interface Window {
    acquireVsCodeApi(): any;
    presentationData: PresentationData;
  }
}

const vscode = window.acquireVsCodeApi();

renderRoot(
  <ProfilerForm presentationData={window.presentationData} vscode={vscode} />
);
