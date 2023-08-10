import * as React from "react";
import { createRoot } from "react-dom/client";

import { PresentationData } from "../../../common/PresentationData";
import ProfilerModuleDetails from "./ProfilerModuleDetails";

declare global {
    interface Window {
        presentationData: PresentationData
    }
}

const root = createRoot(document.getElementById("root"));
root.render(
    <ProfilerModuleDetails
        presentationData={window.presentationData}
    />
);
