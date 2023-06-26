import * as React from "react";
import { useState } from "react";
import { PresentationData, ModuleDetails } from "../../../common/PresentationData";
import DataGrid from "react-data-grid";
import * as columnName from "./column.json";

interface IConfigProps {
    presentationData: PresentationData
}

const filterCSS: React.CSSProperties = {
    inlineSize: "100%",
    padding: "4px",
    fontSize: "14px",
};

function moduleRowKeyGetter(row: ModuleDetails) {
    return row.moduleID;
}

function ProfilerForm({ presentationData }: IConfigProps) {
    const [moduleRows, setModuleRows] = useState(presentationData.moduleDetails);
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

    columnName.moduleColumns.forEach((column) => {
        if (column.key === "moduleName") {
            column["headerRenderer"] = function ({
            }) {

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
                            <span>
                                <span>
                                    {column.name}
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



            combineRows(message.callingModules);
            combineRows(message.calledModules);

            setCallingRows(message.callingModules);
            setCalledRows(message.calledModules);
            setLineRows(message.lineSummary);
        });
    });

    function combineRows(list) {
        list.forEach((rowOne, indexOne) => {
            list.forEach((rowTwo, indexTwo) => {
                if (indexOne !== indexTwo) {
                    if (rowOne.moduleID === rowTwo.moduleID) {
                        if (rowOne.callingModuleName === rowTwo.callingModuleName) {

                            rowOne.timesCalling += rowTwo.timesCalling;
                            list.splice(indexTwo, 1);
                        }
                    }
                }
            });
        });
    }

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
                        rows={filteredModuleRows}
                        defaultColumnOptions={{
                            sortable: true,
                            resizable: true,
                        }}
                        onRowClick={showSelected}
                        headerRowHeight={filters.enabled ? 70 : undefined}
                        rowKeyGetter={moduleRowKeyGetter}
                        onRowsChange={setModuleRows}
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