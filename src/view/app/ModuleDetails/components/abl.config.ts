import * as monaco from "monaco-editor";

export const conf: monaco.languages.LanguageConfiguration = {
  // Default separators except `@$`
  wordPattern:
    /(-?\d*\.\d\w*)|([^\`\~\!\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
  comments: {
    lineComment: "//",
    blockComment: ["/*", "*/"],
  },
  brackets: [
    ["{", "}"],
    ["[", "]"],
    ["(", ")"],
  ],
  autoClosingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
  surroundingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
    { open: "<", close: ">" },
  ],
  folding: {
    markers: {
      start: new RegExp("^\\s*//\\s*(?:(?:#?region\\b)|(?:<editor-fold\\b))"),
      end: new RegExp("^\\s*//\\s*(?:(?:#?endregion\\b)|(?:</editor-fold>))"),
    },
  },
};

export const language = <monaco.languages.IMonarchLanguage>{
  defaultToken: "",
  ignoreCase: true,
  tokenPostfix: ".abl",

  keywords: [
    "accumulate",
    "and",
    "apply",
    "assign",
    "backward",
    "before",
    "break",
    "buffer",
    "call",
    "cancel",
    "case",
    "chain",
    "class",
    "close",
    "compile",
    "connect",
    "create",
    "dataset",
    "define",
    "delete",
    "do",
    "down",
    "else",
    "end",
    "error",
    "no-error",
    "export",
    "find",
    "for",
    "function",
    "get",
    "if",
    "import",
    "index",
    "initial",
    "insert",
    "leave",
    "like",
    "lookup",
    "method",
    "next",
    "not",
    "on",
    "or",
    "os-command",
    "output",
    "overlay",
    "pause",
    "parameter",
    "preselect",
    "procedure",
    "publish",
    "put",
    "quit",
    "readkey",
    "release",
    "repeat",
    "return",
    "revert",
    "rollback",
    "run",
    "save",
    "scroll",
    "seek",
    "select",
    "status",
    "stop",
    "then",
    "to",
    "transaction",
    "update",
    "validate",
    "when",
    "while",
    "with",
    "work",
    "write",
    "define",
    "var",
    "variable",
    "as",
    "integer",
    "int",
    "character",
    "char",
    "decimal",
    "new",
    "method",
    "class",
    "public",
    "private",
    "no-undo",
    "input",
    "output",
    "by-value",
    "by-reference",
    "break",
    "continue",
    "message",
    "frame",
    "pause",
  ],

  types: [
    "integer",
    "character",
    "decimal",
    "logical",
    "handle",
    "widget",
    "dynamic",
    "static",
  ],

  operators: [
    "=",
    ">",
    "<",
    "<=",
    ">=",
    "<>",
    "+",
    "-",
    "*",
    "/",
    "and",
    "or",
    "not",
    "eq",
    "ne",
    "ge",
    "le",
    "gt",
    "lt",
    "is",
    "in",
  ],

  // Common regular expressions
  symbols: /[=><!~?:&|+\-*\/\^%]+/,
  escapes:
    /~(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
  digits: /\d+(_+\d+)*/,

  // The main tokenizer for our language
  tokenizer: {
    root: [
      // Identifiers and keywords
      [
        /[a-zA-Z_$][\w$]*/,
        {
          cases: {
            "@keywords": "keyword",
            "@types": "type",
            "@default": "identifier",
          },
        },
      ],
      // Whitespace
      { include: "@whitespace" },

      // Delimiters and operators
      [/[{}()\[\]]/, "@brackets"],
      [/[<>]/, "@brackets"],
      [
        /@symbols/,
        {
          cases: {
            "@operators": "operator",
            "@default": "delimiter",
          },
        },
      ],

      // Numbers
      [/(@digits)[fFdD]?/, "number"],

      // Delimiter: after number because of .\d floats
      [/[;,.]/, "delimiter"],

      // Strings
      [/"/, "string", "@string"],
      [/'/, "string"], // Characters
    ],

    whitespace: [
      [/[ \t\r\n]+/, ""],
      [/\/\*/, "comment", "@comment"],
      [/\/\/.*$/, "comment"],
    ],

    comment: [
      [/[^\/*]+/, "comment"],
      [/\/\*/, "comment.invalid"], // This breaks block comments in the shape of /* //*/
      [/\*\//, "comment", "@pop"],
      [/[\/*]/, "comment"],
    ],

    string: [
      [/[^"]+/, "string"],
      [/"/, { token: "string", next: "@pop" }],
      [/\n/, "invalid"],
    ],
  },
  folding: {
    markers: {
      start: new RegExp(
        "^\\s*(procedure|function|class|method|if|for|while|case|do|region)\\b"
      ),
      end: new RegExp("^\\s*(end|endregion)\\b"),
    },
  },
};
