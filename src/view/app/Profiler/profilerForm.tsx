import * as React from "react";
import { useState } from "react";
import { PresentationData } from "../../../common/PresentationData";
import DataGrid from "react-data-grid";
import * as columnName from "./column.json";

interface IConfigProps {
    presentationData: PresentationData
}

function ProfilerForm({ presentationData }: IConfigProps) {
    const [moduleDetailsRows, setModuleDetailsRows] = useState(presentationData.moduleDetails);
    const [callingModulesRows, setCallingModulesRows] = useState(presentationData.callingModules);
    const [calledModulesRows, setCalledModulesRows] = useState(presentationData.calledModules);
    const [lineSummaryRows, setLineSummaryRows] = useState(presentationData.lineSummary);

    const [selectedCallingModulesRows, setSelectedCallingModulesRows] = useState(presentationData.callingModules);
    const [selectedCalledModulesRows, setSelectedCalledModulesRows] = useState(presentationData.calledModules);
    const [selectedLineSummaryRows, setSelectedLineSummaryRows] = useState(presentationData.lineSummary);





    React.useLayoutEffect(() => {
        window.addEventListener("message", (event) => {
            const message = event.data as PresentationData;
            setModuleDetailsRows(message.moduleDetails);
            setCallingModulesRows(message.callingModules);
            setCalledModulesRows(message.calledModules);
            setLineSummaryRows(message.lineSummary);
        });
    });

    const showSelected = (row) => {

        setSelectedCallingModulesRows(callingModulesRows.filter(element => element.moduleID === row.moduleID));
        setSelectedCalledModulesRows(calledModulesRows.filter(element => element.moduleID === row.moduleID));
        setSelectedLineSummaryRows(lineSummaryRows.filter(element => element.moduleID === row.moduleID));
    };

    return (
        <React.Fragment>
            <div className="details-columns">
                <div className="grid-name">
                    Module Details
                </div>
                <DataGrid
                    columns={columnName.detailsColumns}
                    rows={moduleDetailsRows}
                    defaultColumnOptions={{
                        sortable: true,
                        resizable: true,
                    }}
                    onRowClick={showSelected}
                />
            </div>
            <div className="calling-columns">
                <div className="grid-name">
                    Calling Modules
                </div>
                <DataGrid
                    columns={columnName.CallingColumns}
                    rows={selectedCallingModulesRows}
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
                    rows={selectedCalledModulesRows}
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
                    rows={selectedLineSummaryRows}
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