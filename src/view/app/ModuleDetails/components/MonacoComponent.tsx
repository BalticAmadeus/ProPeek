import React, { useEffect, useState } from "react";
import MonacoEditor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";

const MonacoComponent = ({ selectedModuleCode, lineNumber }) => {
  const [editorInstance, setEditorInstance] =
    useState<monaco.editor.IStandaloneCodeEditor>();
  const [theme, setTheme] = useState<monaco.editor.BuiltinTheme>("vs-dark");

  useEffect(() => {
    // Listen for messages from the extension
    window.addEventListener("message", (event) => {
      const message = event.data;

      if (message.type === "themeChange") {
        console.log(message.themeKind);
        const themeKind = message.themeKind;
        let monacoTheme;
        // Map VS Code theme to Monaco Editor theme
        switch (themeKind) {
          case 1:
            monacoTheme = "vs";
            break;
          case 2:
            monacoTheme = "vs-dark";
            break;
          case 3:
            monacoTheme = "hc-black";
            break;
          case 4:
            monacoTheme = "hc-light";
            break;
          default:
            monacoTheme = "vs";
        }
        setTheme(monacoTheme);
      }
    });
  }, []);

  useEffect(() => {
    loader.init().then((monaco) => {
      monaco.editor.defineTheme("myCustomTheme", {
        base: theme,
        inherit: true,
        rules: [
          { token: "comment", foreground: "008000" }, // Green for comments
          { token: "string", foreground: "FFA500" }, // Orange for strings
          { token: "keyword", foreground: "0000FF" }, // Blue for keywords
          { token: "number", foreground: "FF0000" }, // Red for numbers
        ],
        colors: {},
      });
    });
  }, [theme]);

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
