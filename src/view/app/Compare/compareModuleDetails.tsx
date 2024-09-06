import * as React from "react";
import { useState, useMemo, useEffect } from "react";
import {
  PresentationData,
  ComparedData,
  ComparedModule,
} from "../../../common/PresentationData";
import type { Column, FormatterProps, SortColumn } from "react-data-grid";
import * as columnDefinition from "./column.json";
import "./compareModuleDetails.css";
import CompareDetailsTable from "./components/CompareDetailsTable";
import { getVSCodeAPI } from "../utils/vscode";
import { Box, FormControlLabel, Switch } from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import LoadingOverlay from "../../../components/loadingOverlay/loadingOverlay";
import ProfilerSummary from "./components/ProfilerSummary";

interface CompareModuleDetailsProps {
  presentationData: PresentationData;
  comparedData: ComparedData;
  fileName: string;
  fileName2: string;
}

interface GenericModuleColumn extends Column<any> {
  key: string;
  name: string;
  width: string;
}

interface ComparedColumn extends GenericModuleColumn {}

const defaultModuleSort: SortColumn = {
  columnKey: "totalTime",
  direction: "DESC",
};

const addConditionalFormatting = (
  columns: Array<GenericModuleColumn>,
  isPercentageView: boolean
): Array<GenericModuleColumn> => {
  const addModuleChangeFormat = (row: ComparedModule, key: string) => {
    let icon = null;
    if (!row.status) {
      icon = <span style={{ width: 16, display: "inline-block" }} />;
    }
    if (row.status === "added") {
      icon = (
        <AddCircleIcon
          style={{ color: "green", fontSize: 16, position: "relative", top: 3 }}
        />
      );
    }
    if (row.status === "removed") {
      icon = (
        <RemoveCircleIcon
          style={{ color: "red", fontSize: 16, position: "relative", top: 3 }}
        />
      );
    }

    return (
      <Box alignSelf="center">
        {icon} {row[key]}
      </Box>
    );
  };

  const addChangeFormat = (row: ComparedModule, key: string) => {
    const changeValue = row[key];
    let displayValue;

    if (isPercentageView) {
      if (key === "totalTimeChange") {
        displayValue = ((changeValue / row.totalTime) * 100).toFixed(2) + "%";
      } else if (key === "avgTimePerCallChange" && row.avgTimePerCall) {
        displayValue =
          ((changeValue / row.avgTimePerCall) * 100).toFixed(2) + "%";
      }
    } else {
      displayValue = changeValue > 0 ? `+${changeValue}` : changeValue;
    }

    const changeType =
      changeValue > 0 ? "Negative" : changeValue < 0 ? "Positive" : "";
    const changeClass = `cell${changeType}Change`;

    return <Box className={`${changeClass}`}>{displayValue}</Box>;
  };

  return columns.map((column) => {
    if (column.key === "moduleName") {
      return {
        ...column,
        formatter: (props: FormatterProps<ComparedModule>) =>
          addModuleChangeFormat(props.row, column.key),
      };
    }

    if (
      column.key === "totalTimeChange" ||
      column.key === "avgTimePerCallChange"
    ) {
      return {
        ...column,
        formatter: (props: FormatterProps<ComparedModule>) =>
          addChangeFormat(props.row, column.key),
      };
    }
    return column;
  });
};

function getComparator(sortColumn: string) {
  switch (sortColumn) {
    case "moduleID":
    case "callerID":
    case "calleeID":
    case "timesCalled":
    case "timesCalledChange":
    case "calleeTotalTimesCalled":
    case "callerTotalTimesCalled":
    case "lineNumber":
    case "avgTimePerCall":
    case "avgTimePerCallChange":
    case "avgTime":
    case "totalTime":
    case "totalTimeChange":
    case "pcntOfSession":
    case "callerPcntOfSession":
    case "calleePcntOfSession":
      return (a, b) => {
        return a[sortColumn] - b[sortColumn];
      };
    case "moduleName":
    case "callerModuleName":
    case "calleeModuleName":
      return (a, b) => {
        return a[sortColumn].localeCompare(b[sortColumn]);
      };
    default:
      throw new Error(`unsupported sortColumn: "${sortColumn}"`);
  }
}

const CompareModuleDetails: React.FC<CompareModuleDetailsProps> = ({
  presentationData,
  comparedData,
  fileName,
  fileName2,
}) => {
  const [moduleRows, setModuleRows] = useState<ComparedModule[]>(
    comparedData.comparedModules
  );

  const [selectedModuleRow, setSelectedModuleRow] =
    useState<ComparedModule | null>(null);

  const [sortModuleColumns, setSortModuleColumns] = useState<
    readonly SortColumn[]
  >([defaultModuleSort]);

  const [selectedRow, setSelectedRow] = useState<ComparedModule>();

  const [moduleNameFilter, setModuleNameFilter] = useState<string>("");

  const [isLoading, setIsLoading] = useState<boolean>(null);

  const vscode = getVSCodeAPI();

  const [isPercentageView, setIsPercentageView] = useState(() => {
    const savedView = vscode.getState();
    return savedView !== undefined ? savedView : false;
  });

  useEffect(() => {
    vscode.setState(isPercentageView);
  }, [isPercentageView, vscode]);

  const formattedMergedColumns: ComparedColumn[] = addConditionalFormatting(
    columnDefinition.moduleColumns,
    isPercentageView
  );

  const sumTotalTime = {
    firstTotalTime: comparedData.firstTotalTime,
    secondTotalTime: comparedData.secondTotalTime,
  };

  const filterTables = (row: ComparedModule) => {
    if (!row) {
      return;
    }
  };

  const getSortedRows = (
    columns: readonly SortColumn[],
    rows: ComparedModule[]
  ) => {
    if (columns.length === 0) {
      return rows;
    }

    return [...rows].sort((a, b) => {
      for (const sort of columns) {
        const comparator = getComparator(sort.columnKey);
        const compResult = comparator(a, b);
        if (compResult !== 0) {
          return sort.direction === "ASC" ? compResult : -compResult;
        }
      }
      return 0;
    });
  };

  const sortedModuleRows = useMemo((): readonly ComparedModule[] => {
    const sortedRows = getSortedRows(
      sortModuleColumns,
      moduleRows
    ) as ComparedModule[];

    if (sortedRows.length > 0 && selectedModuleRow === null) {
      setSelectedModuleRow(sortedRows[0]);
      filterTables(sortedRows[0]);
    }

    return sortedRows;
  }, [moduleRows, sortModuleColumns]);

  const handleToggleProfile = async () => {
    setIsLoading(true);
    vscode.postMessage({
      type: "TOGGLE_PROFILER",
    });
  };

  React.useEffect(() => {
    setIsLoading(false);
  }, [sortedModuleRows]);

  React.useEffect(() => {
    filterTables(selectedRow);
  }, [selectedRow]);

  const handleToggleView = () => {
    setIsPercentageView((prev) => !prev);
  };

  return (
    <div>
      {isLoading && <LoadingOverlay />}
      <ProfilerSummary
        fileName={fileName}
        fileName2={fileName2}
        sumTotalTime={sumTotalTime}
        isPercentageView={isPercentageView}
        handleToggleProfile={handleToggleProfile}
      />

      <div style={{ marginBottom: "10px", marginTop: "10px" }}>
        <FormControlLabel
          control={
            <Switch
              checked={isPercentageView}
              onChange={handleToggleView}
              size="small"
              sx={{ color: "-var(--vscode-editor-foreground)" }}
            />
          }
          label="Show Percentage"
        />
      </div>

      <div className="details-columns">
        <div className="grid-name">Module Details</div>
        {moduleRows.length > 0 ? (
          <CompareDetailsTable
            columns={formattedMergedColumns}
            rows={sortedModuleRows}
            onRowClick={(row) => setSelectedRow(row)}
            onRowsChange={setModuleRows}
            sortColumns={sortModuleColumns}
            onSortColumnsChange={setSortModuleColumns}
            rowClass={(row) => (row === selectedRow ? "rowFormat" : "")}
            searchValue={moduleNameFilter}
            setSearchValue={setModuleNameFilter}
            // sumTotalTime={sumTotalTime}
          />
        ) : null}
      </div>
    </div>
  );
};

export default CompareModuleDetails;
