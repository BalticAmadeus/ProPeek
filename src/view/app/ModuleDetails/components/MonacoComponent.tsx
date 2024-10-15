import React, { useEffect, useState } from "react";
import MonacoEditor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";

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
              { token: "comment", foreground: "6A9955" }, // Comments light green
              { token: "keyword", foreground: "569CD6" }, // Keywords light blue
              { token: "type", foreground: "4EC9B0" }, // Data types cyan
              { token: "string", foreground: "CE9178" }, // Strings light brownish-orange
              { token: "number", foreground: "B5CEA8" }, // Numbers light green
              { token: "operator", foreground: "D4D4D4" }, // Operators light gray
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
    loader.init().then((monaco) => {
      monaco.languages.register({ id: "abl" });

      monaco.languages.setMonarchTokensProvider("abl", {

        keywords: [
          'accumulate', 'and', 'apply', 'assign', 'backward', 'before', 'break', 'buffer',
          'call', 'cancel', 'case', 'chain', 'class', 'close', 'compile', 'connect',
          'create', 'dataset', 'define', 'delete', 'do', 'down', 'else', 'end', 'error',
          'export', 'find', 'for', 'function', 'get', 'if', 'import', 'index', 'initial',
          'insert', 'leave', 'like', 'lookup', 'method', 'next', 'not', 'on', 'or', 'os-command',
          'output', 'overlay', 'pause', 'preselect', 'procedure', 'put', 'quit', 'readkey',
          'release', 'repeat', 'return', 'revert', 'rollback', 'run', 'save', 'scroll',
          'seek', 'select', 'status', 'stop', 'then', 'to', 'transaction', 'update', 'validate',
          'when', 'while', 'with', 'work', 'write', 'define', 'variable', 'procedure',
          'as', 'integer', 'string', 'decimal', 'do', 'end', 'for', 'each', 'if', 'then',
          'else', 'return', 'while', 'new', 'method', 'class', 'public', 'private',
          'no-undo', 'input', 'output', 'by-value', 'by-reference', 'assign', 'add',
          'subtract', 'delete', 'create', 'where', 'find', 'next', 'break', 'continue',
          'message', 'frame', 'next', 'pause'
        ],

        types: [
          "integer", "string", "decimal", "logical", "handle", "widget", "buffer", "table", "dataset", "dynamic", "static", "input-output", "output", "input"
        ],

        operators: [
          "=", ">", "<", "<=", ">=", "<>", "+", "-", "*", "/", "and", "or", "not", "eq", "ne", "ge", "le", "gt", "lt", "is", "in",
        ],


        // Tokenizer rules
        tokenizer: {
          root: [
            // Case insensitive keywords
            [
              /\b(define|variable|procedure|function|as|integer|string|decimal|do|end|for|each|if|then|else|return|while|new|method|class|public|private|no-undo|input|output|by-value|by-reference|assign|add|subtract|delete|create|where|find|next|break|continue|message|frame|next|pause)\b/i,
              "keyword",
            ],

            // Data types
            [
              /\b(void|integer|int|character|char|string|decimal|logical|handle|widget|buffer|table|dataset|dynamic|static|input-output)\b/i,
              "type",
            ],

            // Strings
            [/".*?"/, "string"],

            // Numbers (both integers and decimals)
            [/\b\d+(\.\d+)?\b/, "number"],

            // Operators
            [/[=><!~?:&|+\-*\/^%]+/, "operator"],

            // Delimiters and punctuation
            [/[{}()\[\]]/, "delimiter"],

            // Comments (single line and block)
            [/\/\/.*$/, "comment"], // Single line comment (//)
            [/\/\*.*\*\//, "comment"], // Block comment (/* */)

            // Identifiers and function names
            [
              /[a-zA-Z_]\w*/,
              {
                cases: {
                  "@keywords": "keyword",
                  "@types": "type",
                  "@default": "identifier",
                },
              },
            ],
          ],
        },
      });

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
      value={selectedModuleCode || `"Could not find code files or listing files." \n"Check if you created openedge-project.json file in project directory."`}
      options={{
        readOnly: true,
        scrollBeyondLastLine: false,
      }}
      onMount={(editor) => setEditorInstance(editor)}
    />
  );
};

export default MonacoComponent;
