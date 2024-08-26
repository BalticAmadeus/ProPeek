import DataGrid, {
  Column,
  DataGridProps,
  FormatterProps,
  HeaderRenderer,
  HeaderRendererProps,
} from "react-data-grid";
import { ModuleDetails } from "../../../../common/PresentationData";
import { useState } from "react";
import * as React from "react";
import { Box } from "@mui/material";
import PercentageFill from "../../Components/PercentageBar/PercentageFill";

interface FilterHeaderProps {
  onFilterChange?: (value: string) => void;
  searchValue?: string;
  setSearchValue?: React.Dispatch<React.SetStateAction<string>>;
}
export interface CompareDetailsTableProps
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

const CompareDetailsTable: React.FC<CompareDetailsTableProps> = ({
  sumTotalTime,
  searchValue,
  setSearchValue,
  ...otherProps
}) => {
  const [rows, setRows] = useState(otherProps.rows);
  const [filters, setFilters] = useState<string>("");

  React.useEffect(() => {
    applyFilter(filters);
    console.log(otherProps);
  }, [otherProps.rows]);

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
  const newColumn: Column<ModuleDetails> = {
    key: "newColumnKey",
    name: "New Column",
    formatter: () => <div>-</div>,
    width: "auto",
  }

  const filteredColumns = React.useMemo(() => {
    const updatedColumn = addFilterRendererToColumns(otherProps.columns);
    return [...updatedColumn, newColumn];
  }, [otherProps.columns, searchValue]);


  return (
    <Box>
      <DataGrid
        defaultColumnOptions={{
          sortable: true,
          resizable: true,
        }}
        headerRowHeight={70}
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

export default CompareDetailsTable;
