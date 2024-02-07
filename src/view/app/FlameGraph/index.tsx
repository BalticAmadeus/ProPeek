import * as React from "react";
import { createRoot } from "react-dom/client";

import { PresentationData } from "../../../common/PresentationData";
import FlameGraph from "./profilerFlameGraph";

declare global {
  interface Window {
    presentationData: PresentationData;
  }
}

const root = createRoot(document.getElementById("root"));
root.render(
  <FlameGraph
    presentationData={window.presentationData}
    handleNodeSelection={undefined}
    vscode={undefined}
    hasTracingData={false}
  />
);
