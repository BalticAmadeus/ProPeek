import { Box } from "@mui/material";
import * as React from "react";

interface PercentageFillProps {
  value: number;
}

const PercentageFill: React.FC<PercentageFillProps> = ({ value }) => {
  return (
    <Box style={{ height: "10px" }}>
      <Box style={{ border: "1px solid #ccc", boxSizing: "border-box" }}>
        <Box
          role="progressbar"
          style={{
            width: `${value}%`,
            height: "10px",
            backgroundColor: "#007bff",
          }}
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {value}%
        </Box>
      </Box>
    </Box>
  );
};

export default PercentageFill;
