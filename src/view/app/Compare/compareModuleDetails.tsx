import * as React from "react";
import { useState, useMemo, useEffect } from "react";
import {
  PresentationData,
  ComparedData,
  ComparedModule,
} from "../../../common/PresentationData";
import type { Column, FormatterProps, SortColumn } from "react-data-grid";
import columnDefinition from "./column.json";
import "./compareModuleDetails.css";
import CompareDetailsTable from "./components/CompareDetailsTable";
import { getVSCodeAPI } from "../utils/vscode";
import { Box, FormControlLabel, Switch } from "@mui/material";
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

const defaultModuleSort: SortColumn = {
  columnKey: "totalTime",
  direction: "DESC",
};

const addConditionalFormatting = (
  columns: Array<GenericModuleColumn>,
  isPercentageView: boolean
): Array<GenericModuleColumn> => {
  const addChangeFormat = (row: ComparedModule, key: string) => {
    const changeValue = row[key];
    let displayValue;
    let changeType = "";
    let changeClass = "";

    const formatWithSixDecimals = (value: number) =>
      value === 0 ? value : value?.toFixed(6);

    if (isPercentageView) {
      if (key === "totalTimeChange") {
        displayValue = ((changeValue / row.totalTime) * 100).toFixed(2) + "%";
      } else if (key === "avgTimePerCallChange" && row.avgTimePerCall) {
        displayValue =
          ((changeValue / row.avgTimePerCall) * 100).toFixed(2) + "%";
      } else if (key === "timesCalledChange") {
        displayValue = ((changeValue / row.timesCalled) * 100).toFixed(2) + "%";
      }
    } else {
      if (key === "totalTime" || key === "avgTimePerCall") {
        displayValue = formatWithSixDecimals(changeValue);
      } else if (key === "totalTimeChange" || key === "avgTimePerCallChange") {
        displayValue =
          changeValue > 0
            ? `+${formatWithSixDecimals(changeValue)}`
            : formatWithSixDecimals(changeValue);
      } else {
        displayValue = changeValue;
      }
    }
    if (
      key === "totalTimeChange" ||
      key === "avgTimePerCallChange" ||
      key === "timesCalledChange"
    ) {
      changeType =
        changeValue > 0 ? "Negative" : changeValue < 0 ? "Positive" : "";
      changeClass = `cell${changeType}Change`;
    }
    return <Box className={`${changeClass}`}>{displayValue}</Box>;
  };

  return columns.map((column) => {
    if (
      column.key === "totalTimeChange" ||
      column.key === "avgTimePerCallChange" ||
      column.key === "timesCalledChange" ||
      column.key === "totalTime" ||
      column.key === "avgTimePerCall"
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

  const [isBlockSize, setIsBlockSize] = useState<string>("350px");

  const vscode = getVSCodeAPI();

  const [isPercentageView, setIsPercentageView] = useState(() => {
    const savedView = vscode.getState();
    return savedView !== undefined ? savedView : false;
  });

  useEffect(() => {
    vscode.setState(isPercentageView);
  }, [isPercentageView, vscode]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1500) {
        setIsBlockSize("350px");
      } else {
        setIsBlockSize("660px");
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const formattedMergedColumns: GenericModuleColumn[] =
    addConditionalFormatting(columnDefinition.moduleColumns, isPercentageView);

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
              sx={{ color: "-var(--vscode-editor-foreground)", ml: 1 }}
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
            style={{ blockSize: isBlockSize }}
          />
        ) : null}
      </div>
    </div>
  );
};

export default CompareModuleDetails;
