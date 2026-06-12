import React from "react";
import { Fab, Tooltip, FabProps, TooltipProps } from "@mui/material";

type ProFABProps = FabProps & {
  openState: boolean;
  onClick: () => void;
  openIcon: React.ReactNode;
  closedIcon: React.ReactNode;
  label: string;
  tooltipPlacement?: TooltipProps["placement"];
};

function ProFAB({
  openState,
  onClick,
  openIcon,
  closedIcon,
  label,
  tooltipPlacement = "left",
  ...fabProps
}: ProFABProps) {
  return (
    <div className="pro-fab">
      <Tooltip
        title={openState ? `Close ${label}` : `Open ${label}`}
        placement={tooltipPlacement}
      >
        <Fab
          color={openState ? "secondary" : "primary"}
          onClick={onClick}
          aria-label={openState ? `Close ${label}` : `Open ${label}`}
          {...fabProps}
        >
          {openState ? openIcon : closedIcon}
        </Fab>
      </Tooltip>
    </div>
  );
}

export default ProFAB;
