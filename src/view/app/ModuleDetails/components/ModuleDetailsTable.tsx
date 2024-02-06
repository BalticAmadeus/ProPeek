import DataGrid, { Column, DataGridProps } from "react-data-grid";
import { ModuleDetails } from "../../../../common/PresentationData";
import { getVSCodeAPI } from "../../utils/vscode";
import { useState } from "react";
import * as React from "react";
import { TextField } from "@mui/material";

export interface ModuleDetailsTableProps extends DataGridProps<ModuleDetails> {
  sumTotalTime?: number;
}

const FilterHeader = React.memo(({ onFilterChange }) => {
  const [value, setValue] = useState("");

  const handleChange = React.useCallback(
    (event) => {
      const newValue = event.target.value;
      setValue(newValue);
      onFilterChange(newValue); // Pass the column key and new value up to the parent component
    },
    [onFilterChange]
  ); // useCallback will ensure this function is stable across renders

  return (
    <TextField
      value={value}
      onChange={handleChange}
      variant="outlined"
      size="small"
      fullWidth
    />
  );
});

const ModuleDetailsTable: React.FC<ModuleDetailsTableProps> = ({
  sumTotalTime,
  ...otherProps
}) => {
  const [filterValue, setFilterValue] = useState<string>("");
  const [rows, setRows] = useState(otherProps.rows);
  const [filters, setFilters] = useState({});

  const vscode = getVSCodeAPI();

  const handleFilterChange = (value: string) => {
    console.log(value);
    const columnKey = "moduleName";
    const newFilters = { ...filters, [columnKey]: value };
    setFilters(newFilters);

    const filteredRows = otherProps.rows.filter((row) => {
      const rowValue = row[columnKey].toString().toLowerCase();
      const filterValue = value.toLowerCase();
      return rowValue.includes(filterValue);
    });

    setRows(filteredRows);
    setFilterValue(value);
  };

  // const filteredColumns: CustomColumn[] = otherProps.columns.map(
  //   (col: CustomColumn) => ({
  //     ...col,
  //     filterRenderer: col.filterRenderer
  //       ? (props) => (
  //           <col.filterRenderer
  //             {...props}
  //             onChange={(value) => handleFilterChange(col.key, value)}
  //           />
  //         )
  //       : undefined,
  //   })
  // );

  const addFilterRendererToColumns = (
    columns: Readonly<Array<Column<ModuleDetails>>>
  ): Array<Column<ModuleDetails>> => {
    return columns.map((col) => {
      // Assuming you want to add filterRenderer to all columns or specific ones based on some condition
      const hasFilter = col.key === "moduleName";
      if (hasFilter) {
        return {
          ...col,
          headerRenderer: (props) => (
            <FilterHeader onFilterChange={handleFilterChange} />
          ),
        };
      }
      return col; // Cast is necessary to match the return type
    });
  };

  const filteredColumns = addFilterRendererToColumns(otherProps.columns);

  console.log("filteredColumns", filteredColumns);

  const openFileForModuleDetails = (row: ModuleDetails): void => {
    if (!row.hasLink) {
      return;
    }

    vscode.postMessage({
      type: "MODULE_NAME",
      columns: row.moduleName,
      lines: row.startLineNum,
    });
  };

  return (
    <div className="details-columns">
      <div className="grid-name">Module Details</div>
      <DataGrid
        defaultColumnOptions={{
          sortable: true,
          resizable: true,
        }}
        headerRowHeight={70}
        onRowDoubleClick={openFileForModuleDetails}
        {...otherProps}
        columns={filteredColumns}
        rows={rows}
      />
      {sumTotalTime > 0 && (
        <div className="total-time">Total Time: {sumTotalTime.toFixed(6)}s</div>
      )}
    </div>
  );
};

export default ModuleDetailsTable;
