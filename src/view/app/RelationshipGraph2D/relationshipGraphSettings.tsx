import React from "react";
import {
  Box,
  Paper,
  Typography,
  Divider,
  Fade,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import SettingsIcon from "@mui/icons-material/Settings";
import CloseIcon from "@mui/icons-material/Close";
import ProFAB from "../Components/Buttons/ProFAB";

export type RelationshipLevel = "method" | "class" | "package";
export type DisplayThreshold = "none" | "25" | "50" | "75";
export type NodeMetricMode =
  | "connections"
  | "calls"
  | "sessionPercent"
  | "avgTimePerCall";

type FloatingSettingsPanelProps = {
  relationshipLevel: RelationshipLevel;
  onRelationshipLevelChange: (value: RelationshipLevel) => void;
  displayThreshold: DisplayThreshold;
  onDisplayThresholdChange: (value: DisplayThreshold) => void;
  nodeMetricMode: NodeMetricMode;
  onNodeMetricModeChange: (value: NodeMetricMode) => void;
};

const toggleGroupSx = {
  "& .MuiToggleButton-root": {
    color: "text.secondary",
    borderColor: "divider",
    "&:hover": {
      backgroundColor: "action.hover",
    },
  },
  "& .MuiToggleButton-root.Mui-selected": {
    color: "primary.contrastText",
    backgroundColor: "primary.main",
  },
  "& .MuiToggleButton-root.Mui-selected:hover": {
    backgroundColor: "primary.dark",
  },
};

export default function FloatingSettingsPanel({
  relationshipLevel,
  onRelationshipLevelChange,
  displayThreshold,
  onDisplayThresholdChange,
  nodeMetricMode,
  onNodeMetricModeChange,
}: FloatingSettingsPanelProps) {
  const [open, setOpen] = React.useState(false);

  const isLimited = displayThreshold !== "none";

  return (
    <Box
      sx={{
        position: "fixed",
        top: 80,
        right: 16,
        zIndex: 1200,
      }}
    >
      <ProFAB
        openState={open}
        onClick={() => setOpen((prev) => !prev)}
        openIcon={<CloseIcon />}
        closedIcon={<SettingsIcon />}
        label="Settings"
      />

      <Fade in={open} unmountOnExit>
        <Paper
          elevation={8}
          sx={{
            position: "absolute",
            top: 64,
            right: 0,
            width: 460,
            p: 2,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6">Settings</Typography>
          <Divider sx={{ mt: 1.5, mb: 2 }} />

          <Stack spacing={2.5}>
            <SettingsRow
              label="Relationship level"
              description="Choose how relationships are grouped in the graph."
            >
              <ToggleButtonGroup
                size="small"
                exclusive
                value={relationshipLevel}
                onChange={(_, value: RelationshipLevel | null) => {
                  if (value) onRelationshipLevelChange(value);
                }}
                sx={toggleGroupSx}
              >
                <ToggleButton value="method">Method</ToggleButton>
                <ToggleButton value="class">Class/File</ToggleButton>
                <ToggleButton value="package">Package</ToggleButton>
              </ToggleButtonGroup>
            </SettingsRow>

            <SettingsRow
              label="Node metric"
              description="Choose how node size and filtering are calculated."
            >
              <ToggleButtonGroup
                size="small"
                exclusive
                value={nodeMetricMode}
                onChange={(_, value: NodeMetricMode | null) => {
                  if (value) {
                    onNodeMetricModeChange(value);
                  }
                }}
                sx={toggleGroupSx}
              >
                <ToggleButton value="sessionPercent">Session %</ToggleButton>
                <ToggleButton value="avgTimePerCall">Avg/call</ToggleButton>
                <ToggleButton value="connections">Neighbours</ToggleButton>
                <ToggleButton value="calls">Calls</ToggleButton>
              </ToggleButtonGroup>
            </SettingsRow>

            <SettingsRow
              label="Display threshold"
              description="Higher thresholds show fewer, more important nodes."
            >
              <ToggleButtonGroup
                size="small"
                exclusive
                value={displayThreshold}
                onChange={(_, value: DisplayThreshold | null) => {
                  if (value) onDisplayThresholdChange(value);
                }}
                sx={toggleGroupSx}
              >
                <ToggleButton value="none">No limit</ToggleButton>
                <ToggleButton value="25">25%</ToggleButton>
                <ToggleButton value="50">50%</ToggleButton>
                <ToggleButton value="75">75%</ToggleButton>
              </ToggleButtonGroup>
            </SettingsRow>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: isLimited ? "warning.main" : "text.secondary",
                mt: -1,
              }}
            >
              {isLimited ? (
                <WarningAmberOutlinedIcon fontSize="small" />
              ) : (
                <InfoOutlinedIcon fontSize="small" />
              )}
              <Typography variant="body2">
                {isLimited
                  ? "Filtering is active; some graph details may be hidden or simplified. Data accuracy is not guaranteed."
                  : "No filtering is applied."}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Fade>
    </Box>
  );
}

type SettingsRowProps = {
  label: string;
  description?: string;
  children: React.ReactNode;
};

function SettingsRow({ label, description, children }: SettingsRowProps) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        columnGap: 2,
        rowGap: 0.5,
        alignItems: "start",
      }}
    >
      <Box>
        <Typography variant="body1" fontWeight={500}>
          {label}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        )}
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          minHeight: 40,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
