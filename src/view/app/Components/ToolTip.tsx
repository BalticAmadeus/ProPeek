import React from "react";
import InfoIcon from "@mui/icons-material/Info";
import "./ToolTip.css";

interface ToolTipProps {
  message: string;
  show: boolean;
  iconSize?: string | number;
  style?: React.CSSProperties;
}

const TOOLTIP_WIDTH = 240;
const TOOLTIP_MAX_HEIGHT = 140;

const ToolTip: React.FC<ToolTipProps> = ({ message, show, iconSize = 20, style = {} }) => {
  const [position, setPosition] = React.useState<{ top: number; left: number } | null>(null);

  if (!show) {
    return null;
  }

  const updatePosition = (target: Element) => {
    const rect = target.getBoundingClientRect();
    const left = Math.max(
      8,
      Math.min(rect.right - TOOLTIP_WIDTH, window.innerWidth - TOOLTIP_WIDTH - 8)
    );
    const fitsBelow = rect.bottom + 6 + TOOLTIP_MAX_HEIGHT <= window.innerHeight - 8;
    const top = fitsBelow
      ? rect.bottom + 6
      : Math.max(8, rect.top - TOOLTIP_MAX_HEIGHT - 6);
    setPosition({ top, left });
  };

  return (
    <>
      <InfoIcon
        style={{
          marginLeft: "5px",
          cursor: "help",
          fontSize: iconSize,
          verticalAlign: "middle",
          ...style,
        }}
        onMouseEnter={(event) => updatePosition(event.currentTarget)}
        onMouseLeave={() => setPosition(null)}
      />
      {position && (
        <span
          className="tooltiptext"
          style={{ position: "fixed", top: position.top, left: position.left }}
        >
          {message}
        </span>
      )}
    </>
  );
};

export default ToolTip;