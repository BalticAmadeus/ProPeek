import React from "react";
import InfoIcon from "@mui/icons-material/Info";

interface ToolTipProps {
  message: string;
  show: boolean;
  iconSize?: string | number;
  style?: React.CSSProperties;
}

const ToolTip: React.FC<ToolTipProps> = ({ message, show, iconSize = 20, style = {} }) => {
  if (!show) return null;

  return (
    <div className="tooltip-container" style={{ display: "inline-block", position: "relative" }}>
      <InfoIcon
        className="tooltip-icon"
        style={{
          marginLeft: "5px",
          cursor: "help",
          fontSize: iconSize,
          verticalAlign: "middle",
          ...style,
        }}
      />
      <span className="tooltiptext">{message}</span>
    </div>
  );
};

export default ToolTip;