import * as React from "react";

import { PresentationData } from "../../../common/PresentationData";
import ProfilerModuleDetails from "./profilerModuleDetails";
import { renderRoot } from "../renderRoot";

declare global {
  interface Window {
    presentationData: PresentationData;
  }
}

renderRoot(
  <ProfilerModuleDetails
    presentationData={window.presentationData}
    vscode={undefined}
    moduleName={""}
    onRowSelect={() => {}}
    selectedRow={null}
  />
);
