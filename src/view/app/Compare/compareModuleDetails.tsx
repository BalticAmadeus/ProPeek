import * as React from "react";
import { useState, useMemo } from "react";
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
import { Box, Button, Typography } from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import LoadingOverlay from "../../../components/loadingOverlay/loadingOverlay";

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
  columns: Array<GenericModuleColumn>
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
  fileName2
}) => {
  const [moduleRows, setModuleRows] = useState<ComparedModule[]>(comparedData.comparedModules);

  const [selectedModuleRow, setSelectedModuleRow] =
    useState<ComparedModule | null>(null);

  const [sortModuleColumns, setSortModuleColumns] = useState<
    readonly SortColumn[]
  >([defaultModuleSort]);

  const [selectedRow, setSelectedRow] = useState<ComparedModule>();

  const [moduleNameFilter, setModuleNameFilter] = useState<string>("");

  const formattedMergedColumns: ComparedColumn[] = addConditionalFormatting(columnDefinition.moduleColumns);

  const [isLoading, setIsLoading] = useState(false);

  const sumTotalTime = {
    firstTotalTime: comparedData.firstTotalTime,
    secondTotalTime: comparedData.secondTotalTime
  }

  const vscode = getVSCodeAPI();

  const filterTables = (row: ComparedModule) => {
    if (!row) {
      return;
    }
  };

  const getModuleID = (moduleID: number) => {
    const MODULE_ID_MULT = 100000;
    const firstModuleId = Math.floor(moduleID / MODULE_ID_MULT);
    const secondtModuleId = moduleID % MODULE_ID_MULT;

    return {
      firstModuleId,
      secondtModuleId,
    };
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
    filterTables(selectedRow);
    setIsLoading(false);
  }, [selectedRow]);

  return (
    <div>
      <div style={{ display: "flex", marginTop: "10px", justifyContent: "space-between" }}>
        <Button variant="outlined" onClick={handleToggleProfile} sx={{ mr: 5 }}>
          Swap Profilers
        </Button>
        <Typography color="-var(--vscode-editor-foreground)" fontSize={24} sx={{ mr: 5 }}>
          {fileName} &#x2194; {fileName2}
        </Typography>
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
            sumTotalTime={sumTotalTime}
            searchValue={moduleNameFilter}
            setSearchValue={setModuleNameFilter}
          />
        ) : null}
      </div>
      {isLoading && <LoadingOverlay />}
    </div>
  );
};

export default CompareModuleDetails;
