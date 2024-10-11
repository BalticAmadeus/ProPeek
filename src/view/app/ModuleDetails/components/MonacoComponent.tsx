import React, { useEffect } from "react";
import MonacoEditor, { loader } from "@monaco-editor/react";

const MonacoComponent = ({ selectedModuleCode }) => {
  useEffect(() => {
    loader.init().then((monaco) => {
      monaco.editor.defineTheme("myCustomTheme", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "comment", foreground: "008000" }, // Green for comments
          { token: "string", foreground: "FFA500" }, // Orange for strings
          { token: "keyword", foreground: "0000FF" }, // Blue for keywords
          { token: "number", foreground: "FF0000" }, // Red for numbers
        ],
        colors: {
          "editor.foreground": "FFFFFF",
          "editor.background": "#1E1E1E",
        },
      });
    });
  }, []);

  return (
    <MonacoEditor
      height="300px"
      width="60%"
      language="typescript"
      theme="myCustomTheme"
      value={selectedModuleCode || ""}
      options={{
        readOnly: true,
        scrollBeyondLastLine: false,
      }}
    />
  );
};

export default MonacoComponent;
