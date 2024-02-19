import { createRoot } from "react-dom/client";
import * as React from "react";

export const renderRoot = (children: React.ReactNode): void => {
  let rootContainer = document.getElementById("root");

  if (!rootContainer) {
    rootContainer = document.createElement("div");
    rootContainer.id = "root";
    document.body.appendChild(rootContainer);
  }

  const root = createRoot(rootContainer!);

  root.render(children);
};
