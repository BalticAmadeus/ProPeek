import DataGrid, {
  Column,
  DataGridProps,
  FormatterProps,
  HeaderRenderer,
  HeaderRendererProps,
} from "react-data-grid";
import { ModuleDetails } from "../../../../common/PresentationData";
import { getVSCodeAPI } from "../../utils/vscode";
import { useState } from "react";
import * as React from "react";
import { Box } from "@mui/material";
import PercentageFill from "./PercentageFill";
import { useFileTypeSettingsContext } from "../../Components/FileTypeSettingsContext";
import { OpenFileTypeEnum } from "../../../../common/openFile";

interface FilterHeaderProps {
  onFilterChange?: (value: string) => void;
  searchValue?: string;
  setSearchValue?: React.Dispatch<React.SetStateAction<string>>;
}
export interface ModuleDetailsTableProps
  extends DataGridProps<ModuleDetails>,
    Omit<FilterHeaderProps, "onFilterChange"> {
  sumTotalTime?: number;
}

const FilterHeader = React.memo<FilterHeaderProps>(
  ({ onFilterChange, searchValue, setSearchValue }) => {
    const [value, setValue] = useState<string>(searchValue ?? "");

    React.useEffect(() => {
      setValue(searchValue);
      if (onFilterChange) {
        onFilterChange(searchValue);
      }
    }, [searchValue]);

    const handleChange = React.useCallback(
      (event) => {
        const newValue = event.target.value;
        setValue(newValue);
        if (onFilterChange) {
          onFilterChange(newValue);
        }
      },
      [onFilterChange]
    );

    const handleOnBlur = () => {
      if (setSearchValue) {
        setSearchValue(value);
      }
    };

    return (
      <Box>
        <input
          className="textInput"
          style={{
            inlineSize: "100%",
            fontSize: "14px",
            height: "24px",
          }}
          value={value}
          onChange={handleChange}
          onBlur={handleOnBlur}
        />
      </Box>
    );
  }
);

const ModuleDetailsTable: React.FC<ModuleDetailsTableProps> = ({
  sumTotalTime,
  searchValue,
  setSearchValue,
  ...otherProps
}) => {
  const [rows, setRows] = useState(otherProps.rows);
  const [filters, setFilters] = useState<string>("");
  const settingsContext = useFileTypeSettingsContext();

  React.useEffect(() => {
    applyFilter(filters);
  }, [otherProps.rows]);

  const vscode = getVSCodeAPI();

  const applyFilter = (filter: string) => {
    const filteredRows = otherProps.rows.filter((row) => {
      const rowValue = row.moduleName.toString().toLowerCase();
      const filterValue = filter.toLowerCase();
      return rowValue.includes(filterValue);
    });

    setRows(filteredRows);
  };

  const handleFilterChange = (value: string) => {
    setFilters(value);
    applyFilter(value);
  };

  const addFilterRendererToColumns = (
    columns: Readonly<Array<Column<ModuleDetails>>>
  ): Array<Column<ModuleDetails>> => {
    return columns.map((col) => {
      const hasFilter = col.key === "moduleName";
      if (hasFilter) {
        return {
          ...col,
          headerCellClass: "filter-cell",
          headerRenderer: (props: HeaderRendererProps<ModuleDetails>) => (
            <>
              <Box>{HeaderRenderer<ModuleDetails, unknown>({ ...props })}</Box>
              <FilterHeader
                onFilterChange={handleFilterChange}
                searchValue={searchValue}
                setSearchValue={setSearchValue}
              />
            </>
          ),
        };
      }
      if (col.key === "pcntOfSession") {
        return {
          ...col,
          formatter: (props: FormatterProps<ModuleDetails>) => {
            const percentage = props.row[col.key];
            return <PercentageFill value={percentage} />;
          },
        };
      }
      return col;
    });
  };

  const filteredColumns = React.useMemo(() => {
    return addFilterRendererToColumns(otherProps.columns);
  }, [otherProps.columns, searchValue]);

  const openFileForModuleDetails = (row: ModuleDetails): void => {
    if (!row.hasLink) {
      return;
    }

    switch (settingsContext.openFileType) {
      case OpenFileTypeEnum.XREF:
        vscode.postMessage({
          type: OpenFileTypeEnum.XREF,
          columns: row.moduleName,
          lines: row.startLineNum,
        });
        break;
      case OpenFileTypeEnum.LISTING:
        vscode.postMessage({
          type: OpenFileTypeEnum.LISTING,
          listingFile: row.listingFile,
          lineNumber: row.startLineNum,
        });
        break;
    }
  };

  return (
    <Box>
      <DataGrid
        defaultColumnOptions={{
          sortable: true,
          resizable: true,
        }}
        headerRowHeight={70}
        onRowDoubleClick={openFileForModuleDetails}
        rowKeyGetter={(row) => row.moduleID}
        {...otherProps}
        columns={filteredColumns}
        rows={rows}
      />
      {sumTotalTime > 0 && (
        <div className="total-time">Total Time: {sumTotalTime.toFixed(6)}s</div>
      )}
    </Box>
  );
};

export default ModuleDetailsTable;
