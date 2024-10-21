import * as React from "react";
import { useState, useMemo, useEffect, useRef } from "react";
import {
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
import AddCircleIcon from "@mui/icons-material/AddCircle";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";

interface CompareModuleDetailsProps {
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

const addConditionalFormatting = (
  columns: Array<GenericModuleColumn>,
  isPercentageView: boolean
): Array<GenericModuleColumn> => {
  const formatWithSixDecimals = (value: number) =>
    value === 0 ? value : value?.toFixed(6);

  const getPercentageValue = (changeValue: number, rowValue: number) =>
    `${((changeValue / rowValue) * 100).toFixed(2)}%`;

  const addPercentageFormat = (value: number) => (
    <PercentageFill value={value} />
  );

  const getChangeClass = (changeValue: number) => {
    const changeType =
      changeValue > 0 ? "Negative" : changeValue < 0 ? "Positive" : "";
    return `cell${changeType}Change`;
  };

  const addCallingChangeFormat = (row: ComparedCalledModule, key: string) => {
    const changeValue = row[key];
    let displayValue;
    const changeClass = getChangeClass(changeValue);

    if (isPercentageView) {
      if (key === "calleeTotalTimesCalledChange")
        displayValue = getPercentageValue(
          changeValue,
          row.calleeTotalTimesCalled
        );
      if (key === "timesCalledChange")
        displayValue = getPercentageValue(changeValue, row.timesCalled);
    } else {
      displayValue = changeValue;
    }
    return (
      <Box className={`${changeClass}`}>
        {changeValue > 0 ? `+${displayValue}` : displayValue}
      </Box>
    );
  };

  const addChangeFormat = (row: ComparedModule, key: string) => {
    const changeValue = row[key];
    let displayValue;
    let changeClass = "";

    if (isPercentageView) {
      if (key === "totalTimeChange") {
        displayValue = getPercentageValue(changeValue, row.totalTime);
      } else if (key === "avgTimePerCallChange" && row.avgTimePerCall) {
        displayValue = getPercentageValue(changeValue, row.avgTimePerCall);
      } else if (key === "timesCalledChange") {
        displayValue = getPercentageValue(changeValue, row.timesCalled);
      }
    } else {
      if (key === "totalTimeChange" || key === "avgTimePerCallChange") {
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
      changeClass = getChangeClass(changeValue);
    }
    return <Box className={`${changeClass}`}>{displayValue}</Box>;
  };

  return columns.map((column) => {
    if (column.key === "totalTime" || column.key === "avgTimePerCall") {
      return {
        ...column,
        formatter: (props: FormatterProps<ComparedModule>) => (
          <Box>{formatWithSixDecimals(props.row[column.key])}</Box>
        ),
      };
    }
    if (
      column.key === "totalTimeChange" ||
      column.key === "avgTimePerCallChange" ||
      column.key === "timesCalledChange"
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
    if (
      column.key === "timesCalledChange" ||
      column.key === "calleeTotalTimesCalledChange"
    ) {
      return {
        ...column,
        formatter: (props: FormatterProps<ComparedCalledModule>) =>
          addCallingChangeFormat(props.row, column.key),
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
    case "calleeTotalTimesCalledChange":
    case "avgTimePerCall":
    case "avgTimePerCallChange":
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

  const sumTotalTime = {
    firstTotalTime: comparedData.firstTotalTime,
    secondTotalTime: comparedData.secondTotalTime,
  };

  const checkOverflow = (columns: GenericModuleColumn[]) => {
    return columns.map((col) => {
      const overflow =
        col.key === "callerModuleName" || col.key === "calleeModuleName";

      if (overflow) {
        return {
          ...col,
          formatter: ({ row }: FormatterProps<ComparedModule>) => {
            const [isOverflow, setIsOverflow] = React.useState(false);
            const [isHovered, setIsHovered] = React.useState(false);
            const cellRef = useRef<HTMLDivElement>(null);
            let icon = null;
            if (!row.status) {
              icon = <span style={{ width: 16, display: "inline-block" }} />;
            }
            if (row.status === "added") {
              icon = (
                <AddCircleIcon
                  style={{
                    color: "green",
                    fontSize: 16,
                    position: "relative",
                    top: "5px",
                  }}
                />
              );
            }
            if (row.status === "removed") {
              icon = (
                <RemoveCircleIcon
                  style={{
                    color: "red",
                    fontSize: 16,
                    position: "relative",
                    top: "5px",
                  }}
                />
              );
            }

            const checkOverflow = () => {
              if (cellRef.current) {
                const isOverflowing =
                  cellRef.current.scrollWidth > cellRef.current.clientWidth;
                setIsOverflow(isOverflowing);
              }
            };

            React.useEffect(() => {
              if (isHovered && cellRef.current) {
                checkOverflow();
              } else {
                setIsOverflow(false);
              }
            }, [isHovered, row[col.key], cellRef.current]);

            return (
              <div
                ref={cellRef}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  cursor: isOverflow ? "pointer" : "default",
                }}
                title={isHovered && isOverflow ? row[col.key] : undefined}
              >
                {icon} {row[col.key]}
              </div>
            );
          },
        };
      }

      return col;
    });
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
  };

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

  const overflowCallingColumns = useMemo(() => {
    return checkOverflow(callingColumns);
  }, [callingColumns]);

  const overflowCalledColumns = useMemo(() => {
    return checkOverflow(calledColumns);
  }, [calledColumns]);

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
          />
        ) : null}
      </div>

      <div className="columns">
        <div className="calling-columns-compare">
          <div className="grid-name">Calling Modules</div>
          <DataGrid
            columns={overflowCallingColumns}
            rows={sortedCallingRows}
            defaultColumnOptions={{
              sortable: true,
              resizable: true,
            }}
            onRowsChange={setSelectedCallingRows}
            sortColumns={sortCallingColumns}
            onSortColumnsChange={setSortCallingColumns}
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
        <div className="called-columns-compare">
          <div className="grid-name">Called Modules</div>
          <DataGrid
            columns={overflowCalledColumns}
            rows={sortedCalledRows}
            defaultColumnOptions={{
              sortable: true,
              resizable: true,
            }}
            onRowsChange={setSelectedCalledRows}
            sortColumns={sortCalledColumns}
            onSortColumnsChange={setSortCalledColumns}
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
