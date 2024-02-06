import * as React from "react";
import { useState, useMemo } from "react";
import {
  PresentationData,
  ModuleDetails,
  CalledModules,
  LineSummary,
} from "../../../common/PresentationData";
import DataGrid from "react-data-grid";
import type { Column, SortColumn } from "react-data-grid";
import * as columnDefinition from "./column.json";
import "./profilerModuleDetails.css";
import { TextField } from "@mui/material";
import ModuleDetailsTable from "./components/ModuleDetailsTable";
import { getVSCodeAPI } from "../utils/vscode";

interface ModuleColumn extends Column<any> {
  key: string;
  name: string;
  width: string;
}

interface IConfigProps {
  presentationData: PresentationData;
  moduleName: string;
}

const filterCSS: React.CSSProperties = {
  inlineSize: "100%",
  padding: "4px",
  fontSize: "14px",
};

const defaultModuleSort: SortColumn = {
  columnKey: "totalTime", // Sort by the "totalTime" column by default
  direction: "DESC", // Use descending order by default
};

const defaultLineSort: SortColumn = {
  columnKey: "lineNumber", // Sort by the "lineNumber" column by default
  direction: "ASC", // Use ascending order by default
};

function moduleRowKeyGetter(row: ModuleDetails) {
  return row.moduleID;
}

const addConditionalFormatting = (
  columns: Array<ModuleColumn>
): Array<ModuleColumn> => {
  return columns.map((column) => {
    if (column.key === "moduleName" || column.key === "lineNumber") {
      return {
        ...column,
        formatter: ({ row }: { row: ModuleDetails | LineSummary }) => {
          const className = row.hasLink ? "link-cell" : "";
          return <div className={className}>{row[column.key]}</div>;
        },
      };
    }
    return column;
  });
};

type ModuleComparator = (a: ModuleDetails, b: ModuleDetails) => number;
type CallingComparator = (a: CalledModules, b: CalledModules) => number;
type CalledComparator = (a: CalledModules, b: CalledModules) => number;
type LineComparator = (a: LineSummary, b: LineSummary) => number;

function getComparator(sortColumn: string) {
  switch (sortColumn) {
    case "moduleID":
    case "callerID":
    case "calleeID":
    case "timesCalled":
    case "calleeTotalTimesCalled":
    case "callerTotalTimesCalled":
    case "lineNumber":
    case "avgTimePerCall":
    case "avgTime":
    case "totalTime":
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

function getModuleComparator(sortColumn: string): ModuleComparator {
  return getComparator(sortColumn);
}

function getCallingComparator(sortColumn: string): CallingComparator {
  return getComparator(sortColumn);
}

function getCalledComparator(sortColumn: string): CalledComparator {
  return getComparator(sortColumn);
}

function getLineComparator(sortColumn: string): LineComparator {
  return getComparator(sortColumn);
}

function ProfilerModuleDetails({
  presentationData,
  moduleName,
}: Readonly<IConfigProps>) {
  const [moduleRows, setModuleRows] = useState(presentationData.moduleDetails);
  const [selectedModuleRow, setSelectedModuleRow] =
    useState<ModuleDetails | null>(null);
  const [sortModuleColumns, setSortModuleColumns] = useState<
    readonly SortColumn[]
  >([defaultModuleSort]);
  const [filteredModuleRows, setFilteredModuleRows] = useState(moduleRows);

  const [callingRows, setCallingRows] = useState(
    presentationData.calledModules
  );
  const [selectedRow, setSelectedRow] = useState<ModuleDetails>(null);
  const [selectedCallingRows, setSelectedCallingRows] = useState(
    presentationData.calledModules
  );
  const [sortCallingColumns, setSortCallingColumns] = useState<
    readonly SortColumn[]
  >([]);

  const [calledRows, setCalledRows] = useState(presentationData.calledModules);
  const [selectedCalledRows, setSelectedCalledRows] = useState(
    presentationData.calledModules
  );
  const [sortCalledColumns, setSortCalledColumns] = useState<
    readonly SortColumn[]
  >([]);

  const [lineRows, setLineRows] = useState(presentationData.lineSummary);
  const [selectedLineRows, setSelectedLineRows] = useState(
    presentationData.lineSummary
  );
  const [sortLineColumns, setSortLineColumns] = useState<readonly SortColumn[]>(
    [defaultLineSort]
  );

  const [formattedModuleColumns] = useState(
    addConditionalFormatting(columnDefinition.moduleColumns)
  );

  // const formattedModuleColumns = useMemo(
  //   () =>
  //     addConditionalFormatting(columnDefinition.moduleColumns).map((column) => {
  //       if (column.key === "moduleName") {
  //         column["filterRenderer"] = function ({
  //           onSort,
  //           sortDirection,
  //           priority,
  //         }) {
  //           function handleClick(event) {
  //             onSort(event.ctrlKey || event.metaKey);
  //           }
  //           console.log("IS THIS RERENDERED?!?!?!?");

  //           return (
  //             <React.Fragment>
  //               <div className={"filter-cell"}>
  //                 <span
  //                   tabIndex={-1}
  //                   style={{
  //                     cursor: "pointer",
  //                     display: "flex",
  //                   }}
  //                   className="rdg-header-sort-cell"
  //                   onClick={handleClick}
  //                 >
  //                   <span
  //                     className="rdg-header-sort-name"
  //                     style={{
  //                       flexGrow: "1",
  //                       overflow: "clip",
  //                       textOverflow: "ellipsis",
  //                     }}
  //                   >
  //                     {column.name}
  //                   </span>
  //                   <span>
  //                     <svg
  //                       viewBox="0 0 12 8"
  //                       width="12"
  //                       height="8"
  //                       className="rdg-sort-arrow"
  //                       style={{
  //                         fill: "currentcolor",
  //                       }}
  //                     >
  //                       {sortDirection === "ASC" && (
  //                         <path d="M0 8 6 0 12 8"></path>
  //                       )}
  //                       {sortDirection === "DESC" && (
  //                         <path d="M0 0 6 8 12 0"></path>
  //                       )}
  //                     </svg>
  //                     {priority}
  //                   </span>
  //                 </span>
  //               </div>
  //               <div className={"filter-cell"}>
  //                 <TextField
  //                   className="textInput"
  //                   style={filterCSS}
  //                   value={moduleNameFilter}
  //                   onChange={(e) => {
  //                     // filterByModuleName(e.target.value);
  //                     setModuleNameFilter(e.target.value);
  //                   }}
  //                 />
  //               </div>
  //             </React.Fragment>
  //           );
  //         };
  //       }

  //       if (column.key === "pcntOfSession") {
  //         addPercentage(column);
  //       }
  //       // Other customizations like addPercentage
  //       return column;
  //     }),
  //   [addConditionalFormatting, columnDefinition.moduleColumns]
  // );

  const [formattedLineColumns] = useState(
    addConditionalFormatting(columnDefinition.LineColumns)
  );

  const [moduleNameFilter, setModuleNameFilter] =
    React.useState<string>(moduleName);

  const vscode = getVSCodeAPI();

  const calledColumns = columnDefinition.CalledColumns;
  const callingColumns = columnDefinition.CallingColumns;

  const sumTotalTime = presentationData.moduleDetails.reduce(
    (acc, module) => acc + module.totalTime,
    0
  );

  console.log("COMPLETE COMPONNET RERENDER");

  React.useEffect(() => {
    console.log("THIS IS LOADED ONCE!!", moduleNameFilter);
  }, [moduleNameFilter]);
  // React.useEffect(() => {
  //   filterByModuleName(moduleName);
  // }, [moduleName]);

  calledColumns.forEach((column) => {
    if (column.key === "calleePcntOfSession") {
      addPercentage(column);
    }
  });

  callingColumns.forEach((column) => {
    if (column.key === "callerPcntOfSession") {
      addPercentage(column);
    }
  });

  React.useEffect(() => {
    console.log("moduleNameFilter", moduleNameFilter);
  }, [moduleNameFilter]);

  const filterByModuleName = (value: string) => {
    console.log("filterColumn", value);

    // setModuleNameFilter(value);

    if (value === "") {
      setFilteredModuleRows(moduleRows);
    } else {
      setFilteredModuleRows(
        moduleRows.filter(
          (row) =>
            !row.moduleName
              .toString()
              .toLowerCase()
              .includes(moduleNameFilter.toLowerCase())
        )
      );
    }
    setSelectedModuleRow(null);
  };

  const sortedModuleRows = useMemo((): readonly ModuleDetails[] => {
    if (sortModuleColumns.length === 0) {
      return filteredModuleRows;
    }

    const sortedRows = [...filteredModuleRows].sort((a, b) => {
      for (const sort of sortModuleColumns) {
        const comparator = getModuleComparator(sort.columnKey);
        const compResult = comparator(a, b);
        if (compResult !== 0) {
          return sort.direction === "ASC" ? compResult : -compResult;
        }
      }
      return 0;
    });

    if (sortedRows.length > 0 && selectedModuleRow === null) {
      setSelectedModuleRow(sortedRows[0]);
      filterTables(sortedRows[0]);
    }

    return sortedRows;
  }, [filteredModuleRows, sortModuleColumns]);

  const sortedCallingRows = useMemo((): readonly CalledModules[] => {
    if (sortCallingColumns.length === 0) {
      return selectedCallingRows;
    }

    return [...selectedCallingRows].sort((a, b) => {
      for (const sort of sortCallingColumns) {
        const comparator = getCallingComparator(sort.columnKey);
        const compResult = comparator(a, b);
        if (compResult !== 0) {
          return sort.direction === "ASC" ? compResult : -compResult;
        }
      }
      return 0;
    });
  }, [selectedCallingRows, sortCallingColumns]);

  const sortedCalledRows = useMemo((): readonly CalledModules[] => {
    if (sortCalledColumns.length === 0) {
      return selectedCalledRows;
    }

    return [...selectedCalledRows].sort((a, b) => {
      for (const sort of sortCalledColumns) {
        const comparator = getCalledComparator(sort.columnKey);
        const compResult = comparator(a, b);
        if (compResult !== 0) {
          return sort.direction === "ASC" ? compResult : -compResult;
        }
      }
      return 0;
    });
  }, [selectedCalledRows, sortCalledColumns]);

  const sortedLineRows = useMemo((): readonly LineSummary[] => {
    if (sortLineColumns.length === 0) {
      return selectedLineRows;
    }

    return [...selectedLineRows].sort((a, b) => {
      for (const sort of sortLineColumns) {
        const comparator = getLineComparator(sort.columnKey);
        const compResult = comparator(a, b);
        if (compResult !== 0) {
          return sort.direction === "ASC" ? compResult : -compResult;
        }
      }
      return 0;
    });
  }, [selectedLineRows, sortLineColumns]);

  // formattedModuleColumns.forEach((column) => {
  //   if (column.key === "moduleName") {
  //     column["headerRenderer"] = function ({
  //       onSort,
  //       sortDirection,
  //       priority,
  //     }) {
  //       function handleClick(event) {
  //         onSort(event.ctrlKey || event.metaKey);
  //       }
  //       console.log("IS THIS RERENDERED?!?!?!?");

  //       return (
  //         <React.Fragment>
  //           <div className={"filter-cell"}>
  //             <span
  //               tabIndex={-1}
  //               style={{
  //                 cursor: "pointer",
  //                 display: "flex",
  //               }}
  //               className="rdg-header-sort-cell"
  //               onClick={handleClick}
  //             >
  //               <span
  //                 className="rdg-header-sort-name"
  //                 style={{
  //                   flexGrow: "1",
  //                   overflow: "clip",
  //                   textOverflow: "ellipsis",
  //                 }}
  //               >
  //                 {column.name}
  //               </span>
  //               <span>
  //                 <svg
  //                   viewBox="0 0 12 8"
  //                   width="12"
  //                   height="8"
  //                   className="rdg-sort-arrow"
  //                   style={{
  //                     fill: "currentcolor",
  //                   }}
  //                 >
  //                   {sortDirection === "ASC" && <path d="M0 8 6 0 12 8"></path>}
  //                   {sortDirection === "DESC" && (
  //                     <path d="M0 0 6 8 12 0"></path>
  //                   )}
  //                 </svg>
  //                 {priority}
  //               </span>
  //             </span>
  //           </div>
  //           <div className={"filter-cell"}>
  //             <TextField
  //               className="textInput"
  //               style={filterCSS}
  //               value={moduleNameFilter}
  //               onChange={(e) => {
  //                 // filterByModuleName(e.target.value);
  //                 setModuleNameFilter(e.target.value);
  //               }}
  //             />
  //           </div>
  //         </React.Fragment>
  //       );
  //     };
  //   }

  //   if (column.key === "pcntOfSession") {
  //     addPercentage(column);
  //   }
  // });

  function addPercentage(column) {
    column["headerRenderer"] = function ({}) {
      return <span>{column.name}</span>;
    };

    column["formatter"] = function ({ row }) {
      const percentage = row[column.key];
      const progressStyle: React.CSSProperties = {
        width: `${percentage}%`,
        height: "10px",
        backgroundColor: "#007bff",
      };

      const borderStyle: React.CSSProperties = {
        border: "1px solid #ccc",
        boxSizing: "border-box",
      };

      return (
        <div className="progress" style={{ height: "10px" }}>
          <div className="progress-border" style={borderStyle}>
            <div
              className="progress-bar"
              role="progressbar"
              style={progressStyle}
              aria-valuenow={percentage}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              {percentage}%
            </div>
          </div>
        </div>
      );
    };
  }

  React.useLayoutEffect(() => {
    window.addEventListener("message", (event) => {
      const message = event.data as PresentationData;

      setModuleRows(message.moduleDetails);
      setFilteredModuleRows(message.moduleDetails);
      setFilters({
        columns: {},
      });

      setCallingRows(message.calledModules);
      setCalledRows(message.calledModules);
      setLineRows(message.lineSummary);
    });
  }, []);

  const showSelected = (row) => {
    setSelectedRow(row);
    filterTables(row);
  };

  function filterTables(row) {
    if (!row) return;
    setSelectedCallingRows(
      callingRows.filter((element) => element.calleeID === row.moduleID)
    );
    setSelectedCalledRows(
      calledRows.filter((element) => element.callerID === row.moduleID)
    );
    setSelectedLineRows(
      lineRows.filter((element) => element.moduleID === row.moduleID)
    );
  }

  React.useEffect(() => {
    filterTables(selectedRow);
  }, [selectedRow]);

  const openFileForLineSummary = (row: LineSummary): void => {
    if (!row.hasLink) {
      return;
    }

    const moduleRow = sortedModuleRows.find(
      (moduleRow) => moduleRow.moduleID === row.moduleID
    );

    vscode.postMessage({
      type: "MODULE_NAME",
      columns: moduleRow.moduleName,
      lines: row.lineNumber,
    });
  };

  return (
    <div>
      {moduleRows.length > 0 ? (
        <ModuleDetailsTable
          columns={formattedModuleColumns}
          // columns={columnDefinition.moduleColumns}
          rows={sortedModuleRows}
          onRowClick={showSelected}
          rowKeyGetter={moduleRowKeyGetter}
          onRowsChange={setModuleRows}
          sortColumns={sortModuleColumns}
          onSortColumnsChange={setSortModuleColumns}
          rowClass={(row) => (row === selectedRow ? "rowFormat" : "")}
          sumTotalTime={sumTotalTime}
        />
      ) : // <div className="details-columns">
      //   <div className="grid-name">Module Details</div>
      //   <DataGrid
      //     columns={formattedModuleColumns}
      //     // columns={columnDefinition.moduleColumns}
      //     rows={sortedModuleRows}
      //     defaultColumnOptions={{
      //       sortable: true,
      //       resizable: true,
      //     }}
      //     onRowClick={showSelected}
      //     headerRowHeight={70}
      //     rowKeyGetter={moduleRowKeyGetter}
      //     onRowsChange={setModuleRows}
      //     sortColumns={sortModuleColumns}
      //     onSortColumnsChange={setSortModuleColumns}
      //     onRowDoubleClick={openFileForModuleDetails}
      //     rowClass={(row) => (row === selectedRow ? "rowFormat" : "")}
      //   />
      //   <div className="total-time">
      //     Total Time: {sumTotalTime.toFixed(6)}s
      //   </div>
      // </div>
      null}
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
              filterByModuleName(row.callerModuleName);
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
              filterByModuleName(row.calleeModuleName);
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
          onRowDoubleClick={openFileForLineSummary}
        />
      </div>
    </div>
  );
}

export default ProfilerModuleDetails;
