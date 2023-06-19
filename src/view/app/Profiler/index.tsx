import * as React from "react";
import { createRoot } from "react-dom/client";

import "./profiler.css";
import ProfilerForm from "./profilerForm";
import { IConfig } from "../model";
import { ISettings } from "../../../common/IExtensionSettings";
import { PresentationData } from "../../../common/PresentationData";

declare global {
    interface Window {
        presentationData: PresentationData
    }
}

const root = createRoot(document.getElementById("root"));
root.render(
    <ProfilerForm
        presentationData={window.presentationData}
    />
);
