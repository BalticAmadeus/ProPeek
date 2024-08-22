import * as React from "react";
import { ToggleButton, ToggleButtonProps } from "@mui/material";

interface ProToggleButtonProps extends ToggleButtonProps {
  variant?: "primary" | "secondary";
}

const primary = {
  color: "var(--vscode-button-background)",
  backgroundColor: "transparent",
  borderColor: "var(--vscode-button-background)",
  "&:hover": {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    color: "var(--vscode-button-background)",
  },
  "&.Mui-selected": {
    backgroundColor: "var(--vscode-button-background)",
    color: "var(--vscode-button-foreground)",
    borderColor: "var(--vscode-button-border)",
    "&:hover": {
      backgroundColor: "var(--vscode-button-hoverBackground)",
    },
  },
};

const secondary = {
  color: "var(--vscode-button-secondaryBackground)",
  backgroundColor: "transparent",
  borderColor: "var(--vscode-button-secondaryBackground)",
  "&:hover": {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    color: "var(--vscode-button-secondaryBackground)",
  },
  "&.Mui-selected": {
    backgroundColor: "var(--vscode-button-secondaryBackground)",
    color: "var(--vscode-button-secondaryForeground)",
    borderColor: "var(--vscode-button-border)",
    "&:hover": {
      backgroundColor: "var(--vscode-button-secondaryHoverBackground)",
    },
  },
};

const ProToggleButton: React.FC<ProToggleButtonProps> = ({
  variant = "primary",
  children,
  ...props
}) => {
  const styles = variant === "primary" ? primary : secondary;
  return (
    <ToggleButton color={variant} sx={styles} {...props}>
      {children}
    </ToggleButton>
  );
};

export default ProToggleButton;
