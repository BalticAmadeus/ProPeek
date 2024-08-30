import * as React from "react";
import { useState, useMemo } from "react";
import {
  ModuleDetails,
  CalledModules,
  LineSummary,
  PresentationData,
  ComparedData,
} from "../../../common/PresentationData";
import DataGrid from "react-data-grid";
import type { Column, FormatterProps, SortColumn } from "react-data-grid";
import * as columnDefinition from "./column.json";
import "./compareModuleDetails.css";
import CompareDetailsTable from "./components/CompareDetailsTable";
import { getVSCodeAPI } from "../utils/vscode";
import PercentageFill from "../Components/PercentageBar/PercentageFill";
import { Box, Button } from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import LoadingOverlay from "../../../components/loadingOverlay/loadingOverlay";

interface CompareModuleDetailsProps {
  presentationData: PresentationData;
  comparedData: ComparedData[];
}

interface GenericModuleColumn extends Column<any> {
  key: string;
  name: string;
  width: string;
}

interface ComparedColumn extends GenericModuleColumn {}
interface CallingColumn extends GenericModuleColumn {}
interface CalledColumn extends GenericModuleColumn {}
interface LineColumn extends GenericModuleColumn {}

const defaultModuleSort: SortColumn = {
  columnKey: "totalTime", // Sort by the "totalTime" column by default
  direction: "DESC", // Use descending order by default
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
  direction: "ASC", // Use ascending order by default
};

const addConditionalFormatting = (
  columns: Array<GenericModuleColumn>
): Array<GenericModuleColumn> => {
  const addPercentageFormat = (value: number) => (
    <PercentageFill value={value} />
  );

  const addModuleChangeFormat = (row: ComparedData, key: string) => {
    let icon = null;
    if (!row.status) {
      icon = <span style={{ width: 16, display: "inline-block" }} />;
    }
    if (row.status === "added") {
      icon = <AddCircleIcon style={{ color: "green", fontSize: 16 }} />;
    }
    if (row.status === "removed") {
      icon = <RemoveCircleIcon style={{ color: "red", fontSize: 16 }} />;
    }

    return (
      <Box alignSelf="center">
        {icon} {row[key]}
      </Box>
    );
  };

  const addChangeFormat = (row: ComparedData, key: string) => {
    const changeValue = row[key];
    const changeType =
      changeValue > 0 ? "Negative" : changeValue < 0 ? "Positive" : "";
    const changeClass = `cell${changeType}Change`;
    const displayValueSign = changeValue > 0 ? `+${changeValue}` : changeValue;

    return <Box className={`${changeClass}`}>{displayValueSign}</Box>;
  };

  return columns.map((column) => {
    if (column.key === "moduleName") {
      return {
        ...column,
        formatter: (props: FormatterProps<ComparedData>) =>
          addModuleChangeFormat(props.row, column.key),
      };
    }
    if (
      column.key === "calleePcntOfSession" ||
      column.key === "callerPcntOfSession"
    ) {
      return {
        ...column,
        formatter: (props: FormatterProps<CalledModules>) =>
          addPercentageFormat(props.row[column.key]),
      };
    }

    if (
      column.key === "totalTimeChange" ||
      column.key === "avgTimePerCallChange"
    ) {
      return {
        ...column,
        formatter: (props: FormatterProps<ComparedData>) =>
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
}) => {
  const [moduleRows, setModuleRows] = useState<ComparedData[]>(comparedData);
  const [selectedModuleRow, setSelectedModuleRow] =
    useState<ComparedData | null>(null);
  const [sortModuleColumns, setSortModuleColumns] = useState<
    readonly SortColumn[]
  >([defaultModuleSort]);

  const [selectedRow, setSelectedRow] = useState<ComparedData>();
  const [selectedCallingRows, setSelectedCallingRows] = useState<
    CalledModules[]
  >(presentationData.calledModules);

  const [sortCallingColumns, setSortCallingColumns] = useState<
    readonly SortColumn[]
  >([defaultCallerSort]);

  const [selectedCalledRows, setSelectedCalledRows] = useState<CalledModules[]>(
    presentationData.calledModules
  );

  const [sortCalledColumns, setSortCalledColumns] = useState<
    readonly SortColumn[]
  >([defaultCalleeSort]);

  const [selectedLineRows, setSelectedLineRows] = useState<LineSummary[]>(
    presentationData.lineSummary
  );
  const [sortLineColumns, setSortLineColumns] = useState<readonly SortColumn[]>(
    [defaultLineSort]
  );

  const [moduleNameFilter, setModuleNameFilter] = useState<string>("");

  const formattedMergedColumns: ComparedColumn[] = addConditionalFormatting(
    columnDefinition.moduleColumns
  );

  const callingColumns: CallingColumn[] = addConditionalFormatting(
    columnDefinition.CallingColumns
  );
  const calledColumns: CalledColumn[] = addConditionalFormatting(
    columnDefinition.CalledColumns
  );
  const formattedLineColumns: LineColumn[] = addConditionalFormatting(
    columnDefinition.LineColumns
  );

  const [isLoading, setIsLoading] = React.useState(false);

  const sumTotalTime = presentationData.moduleDetails.reduce(
    (acc, module) => acc + module.totalTime,
    0
  );

  const vscode = getVSCodeAPI();

  const filterTables = (row: ComparedData) => {
    if (!row) {
      return;
    }

    setSelectedCallingRows(
      presentationData.calledModules.filter(
        (element) => element.calleeID === row.moduleID
      )
    );
    setSelectedCalledRows(
      presentationData.calledModules.filter(
        (element) => element.callerID === row.moduleID
      )
    );
    setSelectedLineRows(
      presentationData.lineSummary.filter(
        (element) => element.moduleID === row.moduleID
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
    rows: ComparedData[] | CalledModules[] | LineSummary[]
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

  const sortedModuleRows = useMemo((): readonly ComparedData[] => {
    const sortedRows = getSortedRows(
      sortModuleColumns,
      moduleRows
    ) as ComparedData[];

    if (sortedRows.length > 0 && selectedModuleRow === null) {
      setSelectedModuleRow(sortedRows[0]);
      filterTables(sortedRows[0]);
    }

    return sortedRows;
  }, [moduleRows, sortModuleColumns]);

  const sortedCallingRows = useMemo((): readonly CalledModules[] => {
    return getSortedRows(
      sortCallingColumns,
      selectedCallingRows
    ) as CalledModules[];
  }, [selectedCallingRows, sortCallingColumns]);

  const sortedCalledRows = useMemo((): readonly CalledModules[] => {
    return getSortedRows(
      sortCalledColumns,
      selectedCalledRows
    ) as CalledModules[];
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
    filterTables(selectedRow);
    setIsLoading(false);
  }, [selectedRow]);


  return (
    <div>
      <Button variant="outlined" onClick={handleToggleProfile}>Swap Profilers</Button>
      {isLoading && <LoadingOverlay/>}
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
            sumTotalTime={sumTotalTime}
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

      <div className="line-columns">
        <div className="grid-name">Line Summary</div>
        <DataGrid
          columns={formattedLineColumns}
          rows={sortedLineRows}
          defaultColumnOptions={{
            sortable: true,
            resizable: true,
          }}
          onRowsChange={setSelectedLineRows}
          sortColumns={sortLineColumns}
          onSortColumnsChange={setSortLineColumns}
        />
      </div>
    </div>
  );
};

export default CompareModuleDetails;
