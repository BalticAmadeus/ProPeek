import React from "react";
import { Box, Paper, Typography, Divider, Fade } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CloseIcon from "@mui/icons-material/Close";
import ProFAB from "../Components/Buttons/ProFAB";

type GraphStatsPanelProps = {
  totalSessionTime: number;
  nodeCount: number;
  linkCount: number;
};

function formatTime(value?: number): string {
  if (value === undefined || value === null) {
    return "0";
  }

  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  });
}

function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 2,
        alignItems: "center",
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" color="text.primary" fontWeight={500}>
        {value}
      </Typography>
    </Box>
  );
}

export default function GraphStatsPanel({
  totalSessionTime,
  nodeCount,
  linkCount,
}: GraphStatsPanelProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Box
      sx={{
        position: "fixed",
        top: 80,
        left: 16,
        zIndex: 1200,
      }}
    >
      <ProFAB
        openState={open}
        onClick={() => setOpen((prev) => !prev)}
        openIcon={<CloseIcon />}
        closedIcon={<InfoOutlinedIcon />}
        label="Graph Stats"
        tooltipPlacement="right"
        size="small"
        sx={(theme) => ({
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          boxShadow: theme.shadows[5],
          "&:hover": {
            bgcolor: theme.palette.action.focus,
            boxShadow: theme.shadows[7],
          },
        })}
      />

      <Fade in={open} unmountOnExit>
        <Paper
          elevation={8}
          sx={{
            position: "absolute",
            top: 52,
            left: 0,
            width: 210,
            p: 2,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6">Graph Stats</Typography>
          <Divider sx={{ mt: 1.5, mb: 2 }} />

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
            <StatRow
              label="Total session time"
              value={formatTime(totalSessionTime)}
            />
            <StatRow label="Nodes shown" value={nodeCount} />
            <StatRow label="Links shown" value={linkCount} />
          </Box>
        </Paper>
      </Fade>
    </Box>
  );
}
