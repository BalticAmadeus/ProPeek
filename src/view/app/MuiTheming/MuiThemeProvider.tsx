import { Theme, ThemeProvider, createTheme } from "@mui/material/styles";
import React, { useEffect } from "react";
import { getVSCodeAPI } from "../utils/vscode";

type ThemeMode = "light" | "dark";

function getCSSVarValue(variable: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(variable);
}

const fontFamily = [
  "-apple-system",
  "BlinkMacSystemFont",
  '"Segoe UI"',
  '"Roboto"',
  '"Helvetica Neue"',
  "Arial",
  "sans-serif",
].join(",");

// reference from https://gist.github.com/estruyf/ba49203e1a7d6868e9320a4ea480c27a
const getVscodePalette = (themeMode: "light" | "dark") => {
  const editorBackground =
    getCSSVarValue("--vscode-editor-background") || "#0e131f";
  const editorForeground =
    getCSSVarValue("--vscode-editor-foreground") || "#f3eff5";

  return {
    primary: {
      main: getCSSVarValue("--vscode-button-background") || "#46a1f0",
    },
    secondary: {
      main: getCSSVarValue("--vscode-button-secondaryForeground") || "#15c2cb",
    },
    success: {
      main:
        getCSSVarValue("--vscode-notebookStatusSuccessIcon-foreground") ||
        "#89d185",
    },
    error: {
      main: getCSSVarValue("--vscode-editorError-foreground") || "#fe4a49",
    },
    warning: {
      main: getCSSVarValue("--vscode-editorWarning-foreground") || "#ffe45e",
    },
    info: {
      main: getCSSVarValue("--vscode-editorInfo-foreground") || "#5eadf2",
    },
    background: {
      default: editorBackground,
      paper: getCSSVarValue("--vscode-editorWidget-background") || "#141c2d",
    },
    text: {
      primary: editorForeground,
      secondary:
        getCSSVarValue("--vscode-descriptionForeground") ||
        "rgba(243, 239, 245, 0.7)",
    },
    divider:
      getCSSVarValue("--vscode-editor-selectionBackground") ||
      "rgba(243, 239, 245, 0.2)",
    action: {
      active: getCSSVarValue("--vscode-textLink-foreground") || "#46a1f0",
    },
    mode: themeMode,
  };
};

function createThemeObject(themeMode: ThemeMode): Theme {
  const vscodePalette = getVscodePalette(themeMode);

  let theme = createTheme({
    palette: vscodePalette,
    typography: {
      fontFamily: fontFamily,
    },
  });

  theme = createTheme(theme, {
    components: {
      MuiFormLabel: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            color: theme.palette.text.primary,
          },
        },
      },
      MuiRadio: {
        styleOverrides: {
          root: {
            "& .MuiSvgIcon-root": {
              fontSize: 18,
            },
          },
        },
      },
    },
  });

  return theme;
}

function MuiThemeProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [currentTheme, setCurrentTheme] = React.useState<Theme>(
    createThemeObject("dark"),
  );

  useEffect(() => {
    globalThis.addEventListener("message", (event) => {
      // Verify the origin of the received message
      if (event.origin !== globalThis.location.origin) {
        return;
      }

      const message = event.data;

      if (message.type === "themeChange") {
        let themeMode: ThemeMode = null;

        const themeKind = message.themeKind;
        switch (themeKind) {
          case 1:
          case 4:
            themeMode = "light";
            break;
          case 2:
          case 3:
            themeMode = "dark";
            break;
        }
        const newTheme = createThemeObject(themeMode);

        setCurrentTheme(newTheme);
      }
    });
  }, []);

  useEffect(() => {
    getVSCodeAPI().postMessage({
      type: "THEME",
    });
  }, []);

  return <ThemeProvider theme={currentTheme}>{children}</ThemeProvider>;
}

export default MuiThemeProvider;
