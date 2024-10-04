import * as React from "react";
import { useState, useMemo, useEffect } from "react";
import {
  PresentationData,
  ComparedData,
  ComparedModule,
  LineSummary,
  ComparedCalledModule,
} from "../../../common/PresentationData";
import type { Column, FormatterProps, SortColumn } from "react-data-grid";
import columnDefinition from "./column.json";
import "./compareModuleDetails.css";
import CompareDetailsTable from "./components/CompareDetailsTable";
import { getVSCodeAPI } from "../utils/vscode";
import { Box, FormControlLabel, Switch } from "@mui/material";
import LoadingOverlay from "../../../components/loadingOverlay/loadingOverlay";
import ProfilerSummary from "./components/ProfilerSummary";
import DataGrid from "react-data-grid";
import PercentageFill from "../Components/PercentageBar/PercentageFill";

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

const defaultCallerSort: SortColumn = {
  columnKey: "callerPcntOfSession",
  direction: "DESC",
};

const defaultCalleeSort: SortColumn = {
  columnKey: "calleePcntOfSession",
  direction: "DESC",
};

const defaultLineSort: SortColumn = {
  columnKey: "lineNumber", // Sort by the "lineNumber" column by default
  direction: "ASC", // Use ascending order
};

const addConditionalFormatting = (
  columns: Array<GenericModuleColumn>,
  isPercentageView: boolean
): Array<GenericModuleColumn> => {
  const addPercentageFormat = (value: number) => (
    <PercentageFill value={value} />
  );
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
      } else if (key === "timesCalledChange") {
        displayValue = changeValue > 0 ? `+${changeValue}` : changeValue;
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
    if (
      column.key === "calleePcntOfSession" ||
      column.key === "callerPcntOfSession"
    ) {
      return {
        ...column,
        formatter: (props: FormatterProps<ComparedCalledModule>) =>
          addPercentageFormat(props.row[column.key]),
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

  const [selectedCallingRows, setSelectedCallingRows] = useState<
    ComparedCalledModule[]
  >(comparedData.comparedCalledModules);
  const [sortCallingColumns, setSortCallingColumns] = useState<
    readonly SortColumn[]
  >([defaultCallerSort]);
  const [selectedCalledRows, setSelectedCalledRows] = useState<
    ComparedCalledModule[]
  >(comparedData.comparedCalledModules);
  const [sortCalledColumns, setSortCalledColumns] = useState<
    readonly SortColumn[]
  >([defaultCalleeSort]);
  const [selectedLineRows, setSelectedLineRows] = useState<LineSummary[]>(
    presentationData.lineSummary
  );
  const [sortLineColumns, setSortLineColumns] = useState<readonly SortColumn[]>(
    [defaultLineSort]
  );

  useEffect(() => {
    vscode.setState(isPercentageView);
  }, [isPercentageView, vscode]);

  const formattedMergedColumns: GenericModuleColumn[] =
    addConditionalFormatting(columnDefinition.moduleColumns, isPercentageView);

  const callingColumns: GenericModuleColumn[] = addConditionalFormatting(
    columnDefinition.CallingColumns,
    isPercentageView
  );

  const calledColumns: GenericModuleColumn[] = addConditionalFormatting(
    columnDefinition.CalledColumns,
    isPercentageView
  );

  const formattedLineColumns: GenericModuleColumn[] = addConditionalFormatting(
    columnDefinition.LineColumns,
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

    setSelectedCallingRows(
      comparedData.comparedCalledModules.filter(
        (element) => element.calleeID === row.moduleID
      )
    );
    setSelectedCalledRows(
      comparedData.comparedCalledModules.filter(
        (element) => element.callerID === row.moduleID
      )
    );
    setSelectedLineRows(
      presentationData.lineSummary.filter(
        (element) => element.moduleID === row.moduleID
      )
    );
  };

  //
  const setMatchingRow = (
    selectedRow,
    matchKeys,
    targetRows,
    setSelectedRow
  ) => {
    const matchingRow = targetRows.find((row) =>
      matchKeys.some((key) => row.moduleID === selectedRow[key])
    );
    if (matchingRow) {
      setSelectedRow(matchingRow);
    }
  };

  //

  const getSortedRows = (
    columns: readonly SortColumn[],
    rows: ComparedModule[] | ComparedCalledModule[] | LineSummary[]
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

  const sortedCallingRows = useMemo((): readonly ComparedCalledModule[] => {
    return getSortedRows(
      sortCallingColumns,
      selectedCallingRows
    ) as ComparedCalledModule[];
  }, [selectedCallingRows, sortCallingColumns]);

  const sortedCalledRows = useMemo((): readonly ComparedCalledModule[] => {
    return getSortedRows(
      sortCalledColumns,
      selectedCalledRows
    ) as ComparedCalledModule[];
  }, [selectedCalledRows, sortCalledColumns]);

  const sortedLineRows = useMemo((): readonly LineSummary[] => {
    return getSortedRows(sortLineColumns, selectedLineRows) as LineSummary[];
  }, [selectedLineRows, sortLineColumns]);

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
            onRowClick={(row) => {
              setSelectedRow(row);
              console.log("mod", row);
            }}
            onRowsChange={setModuleRows}
            sortColumns={sortModuleColumns}
            onSortColumnsChange={setSortModuleColumns}
            rowClass={(row) => (row === selectedRow ? "rowFormat" : "")}
            searchValue={moduleNameFilter}
            setSearchValue={setModuleNameFilter}
          />
        ) : null}
      </div>

      <div className="columns">
        <div className="calling-columns">
          <div className="grid-name">Calling Modules</div>
          <DataGrid
            className="columns"
            columns={callingColumns}
            rows={sortedCallingRows}
            defaultColumnOptions={{
              sortable: true,
              resizable: true,
            }}
            onRowsChange={setSelectedCallingRows}
            sortColumns={sortCallingColumns}
            onSortColumnsChange={setSortCallingColumns}
            onRowClick={(row) => console.log("calling", row)}
            onRowDoubleClick={(row) => {
              setModuleNameFilter(row.callerModuleName);
              setMatchingRow(
                row,
                ["callerID"],
                sortedModuleRows,
                setSelectedRow
              );
            }}
          />
        </div>
        <div className="called-columns">
          <div className="grid-name">Called Modules</div>
          <DataGrid
            className="columns"
            columns={calledColumns}
            rows={sortedCalledRows}
            defaultColumnOptions={{
              sortable: true,
              resizable: true,
            }}
            onRowsChange={setSelectedCalledRows}
            sortColumns={sortCalledColumns}
            onSortColumnsChange={setSortCalledColumns}
            onRowClick={(row) => console.log("called", row)}
            onRowDoubleClick={(row) => {
              setModuleNameFilter(row.calleeModuleName);
              setMatchingRow(
                row,
                ["calleeID"],
                sortedModuleRows,
                setSelectedRow
              );
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CompareModuleDetails;
