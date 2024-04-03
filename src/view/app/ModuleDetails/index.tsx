import * as React from "react";
import { createRoot } from "react-dom/client";

import ProfilerModuleDetails from "./profilerModuleDetails";

const root = createRoot(document.getElementById("root"));
root.render(<ProfilerModuleDetails presentationData={null} moduleName={""} />);
