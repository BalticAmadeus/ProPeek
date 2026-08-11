import * as React from "react";
import { IconButton, Button, Typography, Box } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { getVSCodeAPI } from "../utils/vscode";

export interface BannerMessageProps {
  message: string;
  buttonText: string;
  actionUrl: string;
  dismissKey: string;
  onDismiss: (dismissKey: string) => void;
}

const BannerMessage: React.FC<BannerMessageProps> = ({
  message,
  buttonText,
  actionUrl,
  dismissKey,
  onDismiss,
}) => {
  const handleAction = () => {
    getVSCodeAPI().postMessage({
      type: "OPEN_BANNER_URL",
      url: actionUrl,
    });
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        width: "100%",
        padding: "6px 12px",
        backgroundColor: "var(--vscode-editorWidget-background)",
        borderBottom: "1px solid var(--vscode-editorWidget-border)",
        boxSizing: "border-box",
      }}
    >
      <Typography
        variant="body2"
        sx={{
          flex: 1,
          color: "var(--vscode-editor-foreground)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {message}
      </Typography>
      <Button
        size="small"
        variant="contained"
        onClick={handleAction}
        sx={{
          flexShrink: 0,
          textTransform: "none",
          backgroundColor: "var(--vscode-button-background)",
          color: "var(--vscode-button-foreground)",
          "&:hover": {
            backgroundColor: "var(--vscode-button-hoverBackground)",
          },
        }}
      >
        {buttonText}
      </Button>
      <IconButton
        size="small"
        onClick={() => onDismiss(dismissKey)}
        sx={{
          flexShrink: 0,
          color: "var(--vscode-foreground)",
          "&:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.2)",
          },
        }}
        aria-label="Close"
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};

export default BannerMessage;