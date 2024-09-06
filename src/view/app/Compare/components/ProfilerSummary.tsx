import * as React from "react";
import { Button, Typography } from "@mui/material";

interface ProfilerSummaryProps {
  fileName: string;
  fileName2: string;
  sumTotalTime: {
    firstTotalTime: number;
    secondTotalTime: number;
  };
  isPercentageView: boolean;
  handleToggleProfile: () => void;
}

const ProfilerSummary: React.FC<ProfilerSummaryProps> = ({
  fileName,
  fileName2,
  sumTotalTime,
  isPercentageView,
  handleToggleProfile,
}) => {
  return (
    <div>
      <div
        style={{
          display: "flex",
          marginTop: "10px",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Button
          variant="outlined"
          onClick={handleToggleProfile}
          sx={{ mr: 5, backgroundColor: "-var(--vscode-editor-foreground)" }}
        >
          {"Swap Profilers"}
        </Button>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 16,
            border: "1px solid var(--vscode-editor-foreground)",
            marginRight: "2rem",
          }}
        >
          <div style={{ textAlign: "center", padding: "0 10px" }}>
            <Typography color="-var(--vscode-editor-foreground)" sx={{ mb: 1 }}>
              Total time: {fileName}
            </Typography>
            <Typography color="-var(--vscode-editor-foreground)">
              {sumTotalTime.firstTotalTime.toFixed(6)} s
            </Typography>
          </div>

          <div style={{ textAlign: "center", padding: "0 10px" }}>
            <Typography color="-var(--vscode-editor-foreground)" sx={{ mb: 1 }}>
              Total time: {fileName2}
            </Typography>
            <Typography color="-var(--vscode-editor-foreground)">
              {sumTotalTime.secondTotalTime.toFixed(6)} s
            </Typography>
          </div>

          <div style={{ textAlign: "center", padding: "0 10px" }}>
            <Typography color="-var(--vscode-editor-foreground)" sx={{ mb: 1 }}>
              Difference
            </Typography>
            <Typography
              color={
                sumTotalTime.secondTotalTime - sumTotalTime.firstTotalTime > 0
                  ? "red"
                  : "green"
              }
            >
              {isPercentageView
                ? `${(
                    ((sumTotalTime.secondTotalTime -
                      sumTotalTime.firstTotalTime) /
                      sumTotalTime.firstTotalTime) *
                    100
                  ).toFixed(2)}%`
                : `${(
                    sumTotalTime.secondTotalTime - sumTotalTime.firstTotalTime
                  ).toFixed(6)} s`}
            </Typography>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilerSummary;
