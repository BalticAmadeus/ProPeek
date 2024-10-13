import React, { useEffect, useState } from "react";
import MonacoEditor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";

const MonacoComponent = ({ selectedModuleCode, lineNumber }) => {
  const [editorInstance, setEditorInstance] =
    useState<monaco.editor.IStandaloneCodeEditor>();
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

  useEffect(() => {
    if (editorInstance && lineNumber) {
      editorInstance.revealLineInCenterIfOutsideViewport(lineNumber);
      editorInstance.setPosition({ lineNumber, column: 1 });
    }
  }, [lineNumber, editorInstance]);

  return (
    <MonacoEditor
      height="300px"
      width="65%"
      language="typescript"
      theme="myCustomTheme"
      value={selectedModuleCode || ""}
      options={{
        readOnly: true,
        scrollBeyondLastLine: false,
      }}
      onMount={(editor) => setEditorInstance(editor)}
    />
  );
};

export default MonacoComponent;
