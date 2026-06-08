import React from "react";
import {
  Box,
  Paper,
  Typography,
  Divider,
  Fade,
  TextField,
  InputAdornment,
  IconButton,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import ProFAB from "../Components/Buttons/ProFAB";

type GraphStatsPanelProps = {
  totalSessionTime: number;
  nodeCount: number;
  linkCount: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
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
  searchQuery,
  onSearchChange,
}: GraphStatsPanelProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Box
      sx={{
        position: "fixed",
        top: 80,
        left: 16,
        zIndex: 1200,
        display: "flex",
        alignItems: "center",
        gap: 1,
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
          flexShrink: 0,
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          boxShadow: theme.shadows[5],
          "&:hover": {
            bgcolor: theme.palette.action.focus,
            boxShadow: theme.shadows[7],
          },
        })}
      />

      <TextField
        size="small"
        label="Search"
        variant="outlined"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        sx={{ width: 350 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
              </InputAdornment>
            ),
            endAdornment: searchQuery ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => onSearchChange("")}
                  edge="end"
                >
                  <ClearIcon fontSize="small" sx={{ color: "text.secondary" }} />
                </IconButton>
              </InputAdornment>
            ) : null,
          },
        }}
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
