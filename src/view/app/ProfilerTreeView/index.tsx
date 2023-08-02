import * as React from "react";
import { createRoot } from "react-dom/client";

import { PresentationData } from "../../../common/PresentationData";
import ProfilerTreeView from "./profilerTreeView";

declare global {
    interface Window {
        presentationData: PresentationData
    }
}

const root = createRoot(document.getElementById("root"));
root.render(
    <ProfilerTreeView
        presentationData={window.presentationData}
    />
);
