import * as React from "react";
import { useState, useMemo } from "react";
import { PresentationData, ModuleDetails } from "../../../common/PresentationData";
import DataGrid from "react-data-grid";
import type { SortColumn } from "react-data-grid";
import * as columnName from "./column.json";

interface IConfigProps {
    presentationData: PresentationData
}

const filterCSS: React.CSSProperties = {
    inlineSize: "100%",
    padding: "4px",
    fontSize: "14px",
};

function rowKeyGetter(row: ModuleDetails) {
    return row.moduleID;
}

type Comparator = (a: ModuleDetails, b: ModuleDetails) => number;
function getComparator(sortColumn: string): Comparator {
    switch (sortColumn) {
        case "moduleID":
        case "timesCalled":
        case "avgTimePerCall":
        case "totalTime":
        case "pcntOfSession":
            return (a, b) => {
                return a[sortColumn] - b[sortColumn];
            };
        case "moduleName":
            return (a, b) => {
                return a[sortColumn].localeCompare(b[sortColumn]);
            };
        default:
            throw new Error(`unsupported sortColumn: "${sortColumn}"`);
    }
}

function ProfilerForm({ presentationData }: IConfigProps) {
    const [moduleRows, setModuleRows] = useState(presentationData.moduleDetails);
    const [sortModuleColumns, setsortModuleColumns] = useState<readonly SortColumn[]>([]);
    const [filteredModuleRows, setFilteredModuleRows] = useState(moduleRows);

    const [callingRows, setCallingRows] = useState(presentationData.callingModules);
    const [calledRows, setCalledRows] = useState(presentationData.calledModules);
    const [lineRows, setLineRows] = useState(presentationData.lineSummary);

    const [selectedCallingRows, setSelectedCallingRows] = useState(presentationData.callingModules);
    const [selectedCalledRows, setSelectedCalledRows] = useState(presentationData.calledModules);
    const [selectedLineRows, setSelectedLineRows] = useState(presentationData.lineSummary);

    const [filters, _setFilters] = React.useState({
        columns: {},
        enabled: true,
    });
    const filtersRef = React.useRef(filters);
    const setFilters = (data) => {
        filtersRef.current = data;
        _setFilters(data);
    };

    const sortedRows = useMemo((): readonly ModuleDetails[] => {
        if (sortModuleColumns.length === 0) {
            return filteredModuleRows;
        }

        return [...filteredModuleRows].sort((a, b) => {
            for (const sort of sortModuleColumns) {
                const comparator = getComparator(sort.columnKey);
                const compResult = comparator(a, b);
                if (compResult !== 0) {
                    return sort.direction === "ASC" ? compResult : -compResult;
                }
            }
            return 0;
        });
    }, [filteredModuleRows, sortModuleColumns]);

    columnName.moduleColumns.forEach((column) => {
        if (column.key === "moduleName") {
            column["headerRenderer"] = function ({
                onSort,
                sortDirection,
                priority,
            }) {

                function handleClick(event) {
                    onSort(event.ctrlKey || event.metaKey);
                }

                function handleInputKeyDown(event) {
                    var tempFilters = filters;
                    if (event.target.value === "") {
                        delete tempFilters.columns[column.key];
                    } else {
                        tempFilters.columns[column.key] = event.target.value;
                    }
                    setFilters(tempFilters);

                    if (Object.keys(filters.columns).length === 0) {
                        setFilteredModuleRows(moduleRows);
                    } else {
                        setFilteredModuleRows(moduleRows.filter((row) => {
                            for (let [key] of Object.entries(filters.columns)) {
                                if (!row[key].toString().toLowerCase().includes(filters.columns[key].toLowerCase())) {
                                    return false;
                                }
                            }
                            return true;
                        }));
                    }
                }

                return (
                    <React.Fragment>
                        <div className={filters.enabled ? "filter-cell" : undefined}>
                            <span
                                tabIndex={-1}
                                style={{
                                    cursor: "pointer",
                                    display: "flex",
                                }}
                                className="rdg-header-sort-cell"
                                onClick={handleClick}
                            >
                                <span
                                    className="rdg-header-sort-name"
                                    style={{
                                        flexGrow: "1",
                                        overflow: "clip",
                                        textOverflow: "ellipsis",
                                    }}
                                >
                                    {column.name}
                                </span>
                                <span>
                                    <svg
                                        viewBox="0 0 12 8"
                                        width="12"
                                        height="8"
                                        className="rdg-sort-arrow"
                                        style={{
                                            fill: "currentcolor",
                                        }}
                                    >
                                        {sortDirection === "ASC" && <path d="M0 8 6 0 12 8"></path>}
                                        {sortDirection === "DESC" && <path d="M0 0 6 8 12 0"></path>}
                                    </svg>
                                    {priority}
                                </span>
                            </span>
                        </div>
                        {filters.enabled && (
                            <div className={"filter-cell"}>
                                <input
                                    className="textInput"
                                    style={filterCSS}
                                    defaultValue={filters.columns[column.key]}
                                    onChange={handleInputKeyDown}
                                />
                            </div>
                        )}
                    </React.Fragment>
                );
            };
        }
    });

    React.useLayoutEffect(() => {
        window.addEventListener("message", (event) => {
            const message = event.data as PresentationData;

            setModuleRows(message.moduleDetails);
            setFilteredModuleRows(message.moduleDetails);
            setFilters({
                columns: {},
                enabled: true
            });


            setCallingRows(message.callingModules);
            setCalledRows(message.calledModules);
            setLineRows(message.lineSummary);
        });
    });

    const showSelected = (row) => {
        setSelectedCallingRows(callingRows.filter(element => element.moduleID === row.moduleID));
        setSelectedCalledRows(calledRows.filter(element => element.moduleID === row.moduleID));
        setSelectedLineRows(lineRows.filter(element => element.moduleID === row.moduleID));
    };

    return (
        <React.Fragment>
            <div className="details-columns">
                <div className="grid-name">
                    Module Details
                </div>
                {moduleRows.length > 0 ? (
                    <DataGrid
                        columns={columnName.moduleColumns}
                        rows={sortedRows}
                        defaultColumnOptions={{
                            sortable: true,
                            resizable: true,
                        }}
                        onRowClick={showSelected}
                        headerRowHeight={filters.enabled ? 70 : undefined}
                        rowKeyGetter={rowKeyGetter}
                        onRowsChange={setModuleRows}
                        sortColumns={sortModuleColumns}
                        onSortColumnsChange={setsortModuleColumns}
                    />
                ) : null}
            </div>

            <div className="calling-columns">
                <div className="grid-name">
                    Calling Modules
                </div>
                <DataGrid
                    columns={columnName.CallingColumns}
                    rows={selectedCallingRows}
                    defaultColumnOptions={{
                        sortable: true,
                        resizable: true,
                    }}
                />
            </div>

            <div className="called-columns">
                <div className="grid-name">
                    Called Modules
                </div>
                <DataGrid
                    columns={columnName.CalledColumns}
                    rows={selectedCalledRows}
                    defaultColumnOptions={{
                        sortable: true,
                        resizable: true,
                    }}
                />
            </div>

            <div className="line-columns">
                <div className="grid-name">
                    Line Summary
                </div>
                <DataGrid
                    columns={columnName.LineColumns}
                    rows={selectedLineRows}
                    defaultColumnOptions={{
                        sortable: true,
                        resizable: true,
                    }}
                />
            </div>
        </React.Fragment >
    );
}

export default ProfilerForm;