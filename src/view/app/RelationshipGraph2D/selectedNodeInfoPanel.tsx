import * as React from "react";
import {
  Paper,
  Typography,
  alpha,
  useTheme,
  Box,
  Divider,
} from "@mui/material";

interface NodeType {
  id: string;
  name?: string;
  neighbors?: NodeType[];
  links?: LinkType[];
  callCount?: number;
  sessionPercent?: number;
  avgTimePerCall?: number;
  totalTime?: number;
  timesCalled?: number;
}

interface LinkType {
  source: string | NodeType;
  target: string | NodeType;
  value?: number;
}

interface SelectedNodeInfoPanelProps {
  selectedNode: NodeType | null;
}

function formatNumber(value?: number, digits = 0): string {
  if (value === undefined || value === null) {
    return "0";
  }

  return value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatTime(value?: number): string {
  if (value === undefined || value === null) {
    return "0";
  }

  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  });
}

function formatPercent(value?: number): string {
  if (value === undefined || value === null) {
    return "0%";
  }

  return `${value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  })}%`;
}

function InfoStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ minHeight: 56 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6" color="text.primary">
        {value}
      </Typography>
    </Box>
  );
}

function SelectedNodeInfoPanel({ selectedNode }: SelectedNodeInfoPanelProps) {
  const theme = useTheme();

  if (!selectedNode) {
    return null;
  }

  const selectedNodeName = selectedNode.name || selectedNode.id;
  const neighborsCount = selectedNode.neighbors?.length ?? 0;
  const timesCalledCount = selectedNode.timesCalled ?? 0;
  const callsMadeCount = selectedNode.callCount ?? 0;
  const sessionPercent = selectedNode.sessionPercent ?? 0;
  const avgTimePerCall = selectedNode.avgTimePerCall ?? 0;
  const totalTime = selectedNode.totalTime ?? 0;

  return (
    <Paper
      elevation={4}
      sx={{
        position: "absolute",
        bottom: 16,
        left: 16,
        zIndex: 20,
        minWidth: 320,
        maxWidth: 420,
        px: 2,
        py: 1.5,
        borderRadius: 2,
        backgroundColor: alpha(theme.palette.background.paper, 0.96),
      }}
    >
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Selected node
      </Typography>

      <Typography
        variant="body1"
        color="text.primary"
        sx={{ wordBreak: "break-word", fontWeight: 500 }}
      >
        {selectedNodeName}
      </Typography>

      <Divider sx={{ my: 1.5 }} />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 1.5,
        }}
      >
        <InfoStat label="Times called" value={formatNumber(timesCalledCount)} />
        <InfoStat label="Calls made" value={formatNumber(callsMadeCount)} />
        <InfoStat label="Neighbors" value={formatNumber(neighborsCount)} />
        <InfoStat label="Session %" value={formatPercent(sessionPercent)} />
        <InfoStat label="Avg time / call" value={formatTime(avgTimePerCall)} />
        <InfoStat label="Total time" value={formatTime(totalTime)} />
      </Box>
    </Paper>
  );
}

export default SelectedNodeInfoPanel;
