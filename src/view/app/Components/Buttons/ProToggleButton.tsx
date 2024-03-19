import * as React from "react";
import { ToggleButton, ToggleButtonProps } from "@mui/material";

interface ProToggleButtonProps extends ToggleButtonProps {
  variant?: "primary" | "secondary";
}

const primary = {
  backgroundColor: "var(--vscode-button-background)",
  color: "var(--vscode-button-foreground)",
  borderColor: "var(--vscode-button-border)",
  "&:hover": {
    backgroundColor: "var(--vscode-button-hoverBackground)",
  },
  "&.Mui-selected": {
    backgroundColor: "var(--vscode-button-hoverBackground)",
    color: "var(--vscode-button-foreground)",
    "&:hover": {
      backgroundColor: "var(--vscode-button-hoverBackground)",
    },
  },
};

const secondary = {
  color: "var(--vscode-button-secondaryForeground)",
  backgroundColor: "var(--vscode-button-secondaryBackground)",
  borderColor: "var(--vscode-button-border)",
  "&:hover": {
    backgroundColor: "var(--vscode-button-secondaryHoverBackground)",
  },
  "&.Mui-selected": {
    color: "var(--vscode-button-secondaryForeground)",
    backgroundColor: "var(--vscode-button-secondaryHoverBackground)",
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
