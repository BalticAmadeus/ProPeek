import * as React from "react";
import { ToggleButton, ToggleButtonProps } from "@mui/material";

const ProToggleButton: React.FC<ToggleButtonProps> = ({
  children,
  ...props
}) => {
  const afterElement = {
    content: '""',
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: "inherit", // Match the button's border radius
  };

  return (
    <ToggleButton
      sx={{
        color: "var(--vscode-button-foreground)",
        borderColor: "var(--vscode-button-border)",
        "&:hover": {
          "&:after": {
            ...afterElement,
            backgroundColor: "rgba(255, 255, 255, 0.1)",
          },
        },
        "&.Mui-selected": {
          color: "var(--vscode-button-foreground)",
          "&:after": {
            ...afterElement,
            backgroundColor: "rgba(255, 255, 255, 0.2)",
          },
          "&:hover": {
            "&:after": {
              ...afterElement,
              backgroundColor: "rgba(255, 255, 255, 0.25)",
            },
          },
        },
      }}
      {...props}
    >
      {children}
    </ToggleButton>
  );
};

export default ProToggleButton;
