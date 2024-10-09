import * as React from "react";
import { useState, useMemo } from "react";
import {
  ModuleDetails,
  CalledModules,
  LineSummary,
  PresentationData,
} from "../../../common/PresentationData";
import DataGrid from "react-data-grid";
import type { Column, FormatterProps, SortColumn } from "react-data-grid";
import columnDefinition from "./column.json";
import "./profilerModuleDetails.css";
import ModuleDetailsTable from "./components/ModuleDetailsTable";
import { getVSCodeAPI } from "../utils/vscode";
import PercentageFill from "../Components/PercentageBar/PercentageFill";
import { Box, Typography } from "@mui/material";
import FileTypeSettings from "../Components/FileTypeSettings";
import { useFileTypeSettingsContext } from "../Components/FileTypeSettingsContext";
import { OpenFileTypeEnum } from "../../../common/openFile";

interface ProfilerModuleDetailsProps {
  presentationData: PresentationData;
  moduleName: string;
  selectedModuleId: number;
}

interface GenericModuleColumn extends Column<any> {
  key: string;
  name: string;
  width: string;
}

interface ModuleColumn extends GenericModuleColumn {}
interface CallingColumn extends GenericModuleColumn {}
interface CalledColumn extends GenericModuleColumn {}
interface LineColumn extends GenericModuleColumn {}

const defaultModuleSort: SortColumn = {
  columnKey: "totalTime", // Sort by the "totalTime" column by default
  direction: "DESC", // Use descending order by default
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

  const addFixedFormat = (row: ModuleDetails | LineSummary, key: string) => (
    <>{row[key] !== 0 ? row[key]?.toFixed(6) : row[key]}</>
  );

  const addLinkFormat = (row: ModuleDetails | LineSummary, key: string) => (
    <Box className={row.hasLink ? "link-cell" : ""}>{row[key]}</Box>
  );

  return columns.map((column) => {
    if (column.key === "moduleName" || column.key === "lineNumber") {
      return {
        ...column,
        formatter: (props: FormatterProps<ModuleDetails | LineSummary>) =>
          addLinkFormat(props.row, column.key),
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
      column.key === "totalTime" ||
      column.key === "avgTimePerCall" ||
      column.key === "avgTime"
    ) {
      return {
        ...column,
        formatter: (props: FormatterProps<ModuleDetails | LineSummary>) =>
          addFixedFormat(props.row, column.key),
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
function jumpToLine(row: LineSummary) {
  const lineElement = document.getElementById(`line-${row.lineNumber}`);
  if (lineElement) {
    document
      .querySelectorAll(".highlight")
      .forEach((el) => el.classList.remove("highlight"));
    lineElement.classList.add("highlight");
    lineElement.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

const ProfilerModuleDetails: React.FC<ProfilerModuleDetailsProps> = ({
  presentationData,
  moduleName,
  selectedModuleId,
}) => {
  const [moduleRows, setModuleRows] = useState<ModuleDetails[]>(
    presentationData.moduleDetails
  );
  const fileString = `1   
2   // function function1 returns integer (pi as integer):
3   //     define variable iCount as integer no-undo.
4   //     do iCount = 1 to 25000:
5   //     end.
6   //     if pi <> 0 then do:
7   //         pi = pi - 1.
8   //         return function1(pi).
9   //     end.
10   //     else
11   //       return 0.
12   // end function.
13   
14   // define variable iCount as integer no-undo initial 1000. aaaaaaaaaaaaaaaaaaaaa
15   // define variable iNum as integer no-undo.
16   define variable class1 as class1 no-undo.
17   define variable class2 as class2 no-undo.
18   // define variable class3 as class3 no-undo.
19   // define variable class4 as class4 no-undo.
20   
21   class1 = new class1().
22   class2 = new class2().
23   // class3 = new class3().
24   // class4 = new class4().
25   
26   class1:method2().
27   class1:method2(1, 1).
28   
29   class2:method2(1).
30   class2:method2(1, 1).
31   
32   // iNum = function1(17).
33   // class3:method1(7).
34   
35   //  do iNum = 1 to 50:
36   //      class1:method1(iCount).
37   //      class1:method3().
38   //  end.
39   
40   // iNum = function1(17).
41   // class3:method1(8).
42   
43   // do iNum = 1 to 30:       
44   //     class2:method1(1000).
45   //     class2:method3().    
46   // end.                     
47   
48   // iNum = function1(15).
49   // class3:method1(25).
50   
51   // iNum = function1(9).
52   // class3:method1(9).
53   
54   // iNum = function1(20).
55   // class3:method1(5).
56   
57   // class4:method2(20).
58   // class4:method3(25).
59   // class4:method4(10).
60   // class4:method5(15).
61   
62   
63   // iNum = function1(10).
64   // class3:method1(19).
65   
66   // iNum = function1(20).
67   // class3:method1(10).
`;
  const lines = fileString.split("\n");
  const [selectedModuleRow, setSelectedModuleRow] =
    useState<ModuleDetails | null>(null);
  const [sortModuleColumns, setSortModuleColumns] = useState<
    readonly SortColumn[]
  >([defaultModuleSort]);

  const [selectedRow, setSelectedRow] = useState<ModuleDetails>(
    moduleRows.find((moduleRow) => moduleRow.moduleID === selectedModuleId) ||
      null
  );
  const [selectedCallingRows, setSelectedCallingRows] = useState<
    CalledModules[]
  >(presentationData.calledModules);
  const [sortCallingColumns, setSortCallingColumns] = useState<
    readonly SortColumn[]
  >([]);

  const [selectedCalledRows, setSelectedCalledRows] = useState<CalledModules[]>(
    presentationData.calledModules
  );
  const [sortCalledColumns, setSortCalledColumns] = useState<
    readonly SortColumn[]
  >([]);

  const [selectedLineRows, setSelectedLineRows] = useState<LineSummary[]>(
    presentationData.lineSummary
  );
  const [sortLineColumns, setSortLineColumns] = useState<readonly SortColumn[]>(
    [defaultLineSort]
  );

  const [moduleNameFilter, setModuleNameFilter] =
    React.useState<string>(moduleName);

  const vscode = getVSCodeAPI();

  const formattedModuleColumns: ModuleColumn[] = addConditionalFormatting(
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

  const settingsContext = useFileTypeSettingsContext();

  const sumTotalTime = presentationData.moduleDetails
    .reduce((acc, module) => acc + module.totalTime, 0)
    .toFixed(6);

  const filterTables = (row: ModuleDetails) => {
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
    rows: ModuleDetails[] | CalledModules[] | LineSummary[]
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

  const sortedModuleRows = useMemo((): readonly ModuleDetails[] => {
    const sortedRows = getSortedRows(
      sortModuleColumns,
      moduleRows
    ) as ModuleDetails[];

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

  React.useEffect(() => {
    filterTables(selectedRow);
  }, [selectedRow]);

  React.useEffect(() => {
    const { hasXREFs, hasListings } = presentationData;
    if (hasXREFs && !hasListings) {
      settingsContext.setOpenFileType(OpenFileTypeEnum.XREF);
    } else if (!hasXREFs && hasListings) {
      settingsContext.setOpenFileType(OpenFileTypeEnum.LISTING);
    }
  }, [presentationData.hasXREFs, presentationData.hasListings]);

  const openFileForLineSummary = (row: LineSummary): void => {
    const foundModule = sortedModuleRows.find(
      (moduleRow) => moduleRow.moduleID === row.moduleID
    );

    if (!foundModule || !foundModule?.hasLink) return;

    vscode.postMessage({
      type: settingsContext.openFileType,
      name: foundModule.moduleName,
      listingFile: foundModule?.listingFile,
      lineNumber: row.lineNumber,
    });
  };

  return (
    <div>
      <div className="details-columns">
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div className="grid-name">Module Details</div>
          <div className="total-time">
            <Typography color="-var(--vscode-editor-foreground)">
              Total Time: {sumTotalTime} s
            </Typography>
          </div>
        </div>
        <FileTypeSettings
          showOpenFileType={
            presentationData.hasXREFs && presentationData.hasListings
          }
        />
        {moduleRows.length > 0 ? (
          <ModuleDetailsTable
            columns={formattedModuleColumns}
            rows={sortedModuleRows}
            onRowClick={(row) => {
              setSelectedRow(row);
              console.log(row);
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
        <div style={{ display: "flex", flexDirection: "row", width: "100%" }}>
          <DataGrid
            columns={formattedLineColumns}
            rows={sortedLineRows}
            defaultColumnOptions={{
              sortable: true,
              resizable: true,
            }}
            style={{ textAlign: "end", width: "50%" }}
            onRowsChange={setSelectedLineRows}
            sortColumns={sortLineColumns}
            onSortColumnsChange={setSortLineColumns}
            onRowDoubleClick={openFileForLineSummary}
            onRowClick={(row) => jumpToLine(row)}
          />
          <div
            className="line-columns"
            style={{
              display: "flex",
              width: "50%",
              maxHeight: "400px",
              overflow: "hidden",
              border: "1px solid var(--vscode-editorWidget-border)",
              padding: "10px",
              backgroundColor: "var(--vscode-editor-background)",
              color: "var(--vscode-editor-foreground)",
              marginLeft: "5px",
            }}
            id="codeContainer"
          >
            {/* Wrapper for synchronized scrolling line and code numbers*/}
            <div
              style={{
                display: "flex",
                overflowX: "auto",
                overflowY: "auto",
                maxHeight: "400px",
                width: "100%",
              }}
            >
              {/* Line numbers column */}
              <div
                style={{
                  textAlign: "right",
                  paddingRight: "10px",
                  userSelect: "none",
                  color: "var(--vscode-editorLineNumber-foreground)",
                  minWidth: "25px",
                  backgroundColor: "var(--vscode-editor-background)",
                }}
              >
                {lines.map((_, index) => (
                  <pre
                    key={index}
                    id={`line-${index + 1}`}
                    style={{ margin: 0 }}
                  >
                    {index + 1}
                  </pre>
                ))}
              </div>

              {/* Code lines column */}
              <div style={{ width: "100%" }}>
                {lines.map((line, index) => (
                  <pre key={index} style={{ whiteSpace: "pre", margin: 0 }}>
                    {line}
                  </pre>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilerModuleDetails;
