import * as React from "react";

import { PresentationData } from "../../../common/PresentationData";
import ProfilerTreeView from "./profilerTreeView";
import { renderRoot } from "../renderRoot";

declare global {
  interface Window {
    presentationData: PresentationData;
  }
}

renderRoot(
  <ProfilerTreeView
    presentationData={window.presentationData}
    handleNodeSelection={() => {}}
  />
);
