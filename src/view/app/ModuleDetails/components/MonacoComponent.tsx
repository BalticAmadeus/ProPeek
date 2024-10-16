import React, { useEffect, useState } from "react";
import MonacoEditor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { getVSCodeAPI } from "../../utils/vscode";
import { conf, language } from "./abl.config";

const MonacoComponent = ({ selectedModuleCode, lineNumber }) => {
  const [editorInstance, setEditorInstance] =
    useState<monaco.editor.IStandaloneCodeEditor>();
  const [theme, setTheme] = useState<monaco.editor.BuiltinTheme>("vs-dark");
  const [syntaxHighlightRules, setSyntaxHighlightRules] = useState<
    monaco.editor.ITokenThemeRule[]
  >([]);

  useEffect(() => {
    window.addEventListener("message", (event) => {
      const message = event.data;

      if (message.type === "themeChange") {
        const themeKind = message.themeKind;
        let monacoTheme;

        switch (themeKind) {
          case 1:
            monacoTheme = "vs";
            setSyntaxHighlightRules([
              { token: "comment", foreground: "008000" }, // Comments green
              { token: "keyword", foreground: "0000FF" }, // Keywords blue
              { token: "type", foreground: "2B91AF" }, // Data types cyan
              { token: "string", foreground: "A31515" }, // Strings red
              { token: "number", foreground: "09885A" }, // Numbers green
              { token: "operator", foreground: "000000" }, // Operators black
              { token: "delimiter", foreground: "AF00DB" }, // Delimiters purple
              { token: "identifier", foreground: "333333" }, // Identifiers default grey
            ]);
            break;
          case 2:
            monacoTheme = "vs-dark";
            setSyntaxHighlightRules([
              { token: "comment", foreground: "6A9955", fontStyle: "italic" },
              { token: "keyword", foreground: "569CD6", fontStyle: "bold" },
              {
                token: "preprocessor",
                foreground: "FF00FF",
                fontStyle: "bold",
              },
              { token: "type", foreground: "4EC9B0" }, // Data types cyan
              { token: "string", foreground: "CE9178" }, // Strings light brownish-orange
              { token: "number", foreground: "B5CEA8" }, // Numbers light green
              { token: "operator", foreground: "D4D4D4" }, // Operators light gray
              { token: "bracket", foreground: "DCDCAA" },
              { token: "delimiter", foreground: "C586C0" }, // Delimiters pink/purple
              { token: "identifier", foreground: "9CDCFE" }, // Identifiers light cyan
            ]);
            break;
          case 3:
            monacoTheme = "hc-black";
            setSyntaxHighlightRules([
              { token: "comment", foreground: "A8FF60" }, // Comments bright green
              { token: "keyword", foreground: "FFFF00" }, // Keywords bright yellow
              { token: "type", foreground: "00FFFF" }, // Data types bright cyan
              { token: "string", foreground: "FF6B6B" }, // Strings bright red
              { token: "number", foreground: "FFAA00" }, // Numbers bright orange
              { token: "operator", foreground: "FFFFFF" }, // Operators bright white
              { token: "delimiter", foreground: "FF00FF" }, // Delimiters bright magenta
              { token: "identifier", foreground: "FFFFFF" }, // Identifiers bright white
            ]);
            break;
          case 4:
            monacoTheme = "hc-light";
            setSyntaxHighlightRules([
              { token: "comment", foreground: "005000" }, // Comments dark green
              { token: "keyword", foreground: "0000D6" }, // Keywords bold blue
              { token: "type", foreground: "005FAF" }, // Data types bold cyan
              { token: "string", foreground: "B30000" }, // Strings dark red
              { token: "number", foreground: "005500" }, // Numbers dark green
              { token: "operator", foreground: "000000" }, // Operators black
              { token: "delimiter", foreground: "6A00FF" }, // Delimiters bold purple
              { token: "identifier", foreground: "2F2F2F" }, // Identifiers dark gray
            ]);
            break;
          default:
            monacoTheme = "vs";
        }
        setTheme(monacoTheme);
      }
    });
  }, []);

  useEffect(() => {
    getVSCodeAPI().postMessage({
      type: "THEME",
    });
  }, []);

  useEffect(() => {
    loader.init().then((monaco) => {
      monaco.languages.register({ id: "abl" });
      monaco.languages.setLanguageConfiguration("abl", conf);
      monaco.languages.setMonarchTokensProvider("abl", language);

      monaco.editor.defineTheme("myCustomTheme", {
        base: theme,
        inherit: true,
        rules: syntaxHighlightRules,
        colors: {},
      });
    });
  }, [theme, syntaxHighlightRules]);

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
      language="abl"
      theme="myCustomTheme"
      value={
        selectedModuleCode ||
        `"Could not find code files or listing files." \n"Check if you created openedge-project.json file in project directory."`
      }
      options={{
        readOnly: true,
        scrollBeyondLastLine: false,
      }}
      onMount={(editor) => setEditorInstance(editor)}
    />
  );
};

export default MonacoComponent;
