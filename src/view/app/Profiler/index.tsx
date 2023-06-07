import * as React from "react";
import { createRoot } from "react-dom/client";

import "./profiler.css";
import ProfilerForm from "./profilerForm";
import { IConfig } from "../model";
import { ISettings } from "../../../common/IExtensionSettings";

declare global {
    interface Window {
        acquireVsCodeApi(): any;
        initialData: IConfig;
        configuration: ISettings;
    }
}

const vscode = window.acquireVsCodeApi();

const root = createRoot(document.getElementById("root"));
root.render(
    <ProfilerForm
        configuration={window.configuration}
        vscode={vscode}
    />
);
