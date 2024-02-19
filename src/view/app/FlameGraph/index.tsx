import * as React from "react";

import { PresentationData } from "../../../common/PresentationData";
import FlameGraph from "./profilerFlameGraph";
import { renderRoot } from "../renderRoot";

declare global {
  interface Window {
    presentationData: PresentationData;
  }
}

renderRoot(
  <FlameGraph
    presentationData={window.presentationData}
    handleNodeSelection={undefined}
    vscode={undefined}
    hasTracingData={false}
  />
);
