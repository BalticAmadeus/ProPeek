import * as React from "react";
import { ISettings } from "../../../common/IExtensionSettings";
import DataGrid, { Column, SelectColumn } from "react-data-grid";

interface IConfigProps {
    vscode: any;
    configuration: ISettings;
}

function ProfilerForm({ }: IConfigProps) {
    interface Row {
        id: number;
        title: string;
        count: number;
    }

    const columns: readonly Column<Row>[] = [
        SelectColumn,
        { key: 'id', name: 'ID' },
        { key: 'title', name: 'Title' },
        { key: 'count', name: 'Count' }
    ];

    const rows: readonly Row[] = [];

    function rowKeyGetter(row: Row) {
        return row.id;
    }
    const [selectedRows, onSelectedRowsChange] = React.useState((): ReadonlySet<number> => new Set());

    return (
        <DataGrid
            columns={columns}
            rows={rows}
            selectedRows={selectedRows}
            onSelectedRowsChange={onSelectedRowsChange}
            rowKeyGetter={rowKeyGetter}
        />
    );
}

export default ProfilerForm;