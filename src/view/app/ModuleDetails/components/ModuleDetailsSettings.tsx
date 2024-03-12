import { Box, ToggleButton, ToggleButtonGroup } from "@mui/material";
import * as React from "react";

const ModuleDetailsSettings: React.FC = () => {
  return (
    <Box>
      <ToggleButtonGroup exclusive>
        <ToggleButton value="test">Test13</ToggleButton>
        <ToggleButton value="test2">Test14</ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default ModuleDetailsSettings;
