import { Box } from "@mui/material";
import * as React from "react";
import "./PercentageFill.css";

interface PercentageFillProps {
  value: number;
}

const PercentageFill: React.FC<PercentageFillProps> = ({ value }) => {
  return (
    <Box className="progressBox">
      <Box className="progressWrapper">
        <Box
          role="progressbar"
          className="progressBar"
          style={{ width: `${value}%` }}
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={100}
        />
        <Box className="progressBarText">{value}%</Box>
      </Box>
    </Box>
  );
};

export default PercentageFill;
