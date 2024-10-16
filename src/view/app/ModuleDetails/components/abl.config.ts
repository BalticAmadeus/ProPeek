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
    "preselect",
    "procedure",
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
    "variable",
    "as",
    "integer",
    "string",
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
    "string",
    "decimal",
    "logical",
    "handle",
    "widget",
    "buffer",
    "table",
    "dataset",
    "dynamic",
    "static",
    "input-output",
    "output",
    "input",
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
    /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
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
      [/(@digits)[eE]([\-+]?(@digits))?[fFdD]?/, "number.float"],
      [/(@digits)\.(@digits)([eE][\-+]?(@digits))?[fFdD]?/, "number.float"],
      [/0[xX](@digits)[Ll]?/, "number.hex"],
      [/0(@digits)[Ll]?/, "number.octal"],
      [/0[bB](@digits)[Ll]?/, "number.binary"],
      [/(@digits)[fFdD]?/, "number"],

      // Delimiter: after number because of .\d floats
      [/[;,.]/, "delimiter"],

      // Strings
      [/"/, "string", "@string"],
      [/'/, "string"], // Characters

      [/&\w+/, "preprocessor"],

      // Invalid or error characters
      [/[^\x00-\x7F]+/, "invalid"],
    ],

    whitespace: [
      [/[ \t\r\n]+/, ""],
      [/\/\*\*/, "comment.doc", "@javadoc"],
      [/\/\*/, "comment", "@comment"],
      [/\/\/.*$/, "comment"],
    ],

    comment: [
      [/[^\/*]+/, "comment"],
      [/\/\*/, "comment.invalid"], // This breaks block comments in the shape of /* //*/
      [/\*\//, "comment", "@pop"],
      [/[\/*]/, "comment"],
    ],

    javadoc: [
      [/[^\/*]+/, "comment.doc"],
      [/\/\*/, "comment.doc.invalid"],
      [/\\\*\//, "comment.doc", "@pop"],
      [/[\/*]/, "comment.doc"],
    ],

    string: [
      [/[^\\"]+/, "string"],
      [/\\./, "string.escape"],
      [/"/, "string", "@pop"],
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
