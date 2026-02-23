import DataGrid, {
  Column,
  DataGridProps,
  FormatterProps,
  HeaderRenderer,
  HeaderRendererProps,
} from "react-data-grid";
import { ComparedModule } from "../../../../common/PresentationData";
import { useState } from "react";
import * as React from "react";
import {
  Box,
  SelectChangeEvent,
  Typography,
  useTheme,
} from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import PercentageFill from "../../Components/PercentageBar/PercentageFill";
import FilterHeader from "../../Components/FilterHeader/FilterHeader";

interface FilterHeaderProps {
  onFilterChange?: (value: string) => void;
  searchValue?: string;
  setSearchValue?: React.Dispatch<React.SetStateAction<string>>;
}

export interface CompareDetailsTableProps
  extends DataGridProps<ComparedModule>,
    Omit<FilterHeaderProps, "onFilterChange"> {}



const CompareDetailsTable: React.FC<CompareDetailsTableProps> = ({
  searchValue,
  setSearchValue,
  ...otherProps
}) => {
  const [rows, setRows] = useState(otherProps.rows);
  const [filters, setFilters] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const theme = useTheme();

  React.useEffect(() => {
    applyFilter(filters, statusFilter);
  }, [otherProps.rows, filters, statusFilter]);

  const applyFilter = (filter: string, status: string) => {
    const filteredRows = otherProps.rows.filter((row) => {
      const rowValue = row.moduleName.toString().toLowerCase();
      const filterValue = filter.toLowerCase();
      const matchesName = rowValue.includes(filterValue);

      const matchesStatus =
        status === "all" ||
        (status === "added" && row.status === "added") ||
        (status === "removed" && row.status === "removed");

      return matchesName && matchesStatus;
    });

    setRows(filteredRows);
  };

  const handleFilterChange = (value: string) => {
    setFilters(value);
    applyFilter(value, statusFilter);
  };

  const handleDropdownChange = (event: SelectChangeEvent<string>) => {
    const selectedStatus = event.target.value as string;
    setStatusFilter(selectedStatus);
    applyFilter(filters, selectedStatus);
  };

  const addFilterRendererToColumns = (
    columns: Readonly<Array<Column<ComparedModule>>>
  ): Array<Column<ComparedModule>> => {
    return columns.map((col) => {
      const hasFilter = col.key === "moduleName";

      if (hasFilter) {
        return {
          ...col,
          headerCellClass: "filter-cell",
          minWidth: 350,
          headerRenderer: (props: HeaderRendererProps<ComparedModule>) => (
            <>
              <Box>{HeaderRenderer<ComparedModule, unknown>({ ...props })}</Box>
              <FilterHeader
                onFilterChange={handleFilterChange}
                searchValue={searchValue}
                setSearchValue={setSearchValue}
                showDropdown={true}
                dropdownValue={statusFilter}
                onDropdownChange={handleDropdownChange}
              />
            </>
          ),
          formatter: ({ row }: FormatterProps<ComparedModule>) => {
            const [isOverflow, setIsOverflow] = React.useState(false);
            const [isHovered, setIsHovered] = React.useState(false);
            const cellRef = React.useRef<HTMLDivElement>(null);
            let icon = null;

            if (!row.status) {
              icon = <span style={{ width: 16, display: "inline-block" }} />;
            }
            if (row.status === "added") {
              icon = (
                <AddCircleIcon
                  style={{
                    color: theme.palette.success.main,
                    fontSize: 16,
                    position: "relative",
                    top: "5px",
                  }}
                />
              );
            }
            if (row.status === "removed") {
              icon = (
                <RemoveCircleIcon
                  style={{
                    color: theme.palette.error.main,
                    fontSize: 16,
                    position: "relative",
                    top: "5px",
                  }}
                />
              );
            }

            const checkOverflow = () => {
              if (cellRef.current) {
                const isOverflowing =
                  cellRef.current.scrollWidth > cellRef.current.clientWidth;
                setIsOverflow(isOverflowing);
              }
            };

            React.useEffect(() => {
              if (isHovered) {
                checkOverflow();
              } else {
                setIsOverflow(false);
              }
            }, [isHovered, row[col.key]]);

            return (
              <div
                ref={cellRef}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  cursor: isOverflow ? "pointer" : "default",
                }}
                title={isHovered && isOverflow ? row[col.key] : undefined}
              >
                {icon} {row[col.key]}
              </div>
            );
          },
        };
      }

      if (col.key === "pcntOfSession") {
        return {
          ...col,
          minWidth: 200,
          formatter: (props: FormatterProps<ComparedModule>) => {
            const percentage = props.row[col.key];
            return <PercentageFill value={percentage} />;
          },
          headerRenderer: (props: HeaderRendererProps<ComparedModule>) => (
            <Box
              sx={{
                lineHeight: "45px",
                cursor: "pointer",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {HeaderRenderer<ComparedModule, unknown>({ ...props })}
            </Box>
          ),
        };
      }

      return {
        ...col,
        headerRenderer: (props: HeaderRendererProps<ComparedModule>) => (
          <Box
            sx={{
              lineHeight: "45px",
              cursor: "pointer",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {HeaderRenderer<ComparedModule, unknown>({ ...props })}
          </Box>
        ),
      };
    });
  };

  const filteredColumns = React.useMemo(() => {
    return addFilterRendererToColumns(otherProps.columns);
  }, [otherProps.columns, searchValue, statusFilter]);

  return (
    <Box sx={{ position: "relative" }}>
      <DataGrid
        defaultColumnOptions={{
          sortable: true,
          resizable: true,
        }}
        headerRowHeight={70}
        rowKeyGetter={(row) => row.moduleID}
        {...otherProps}
        columns={filteredColumns}
        rows={rows.length > 0 ? rows : []}
      />
      {rows.length === 0 && (
        <Box
          sx={{
            position: "absolute",
            top: 70,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "var(--rdg-background)",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              textAlign: "center",
              color: "var(--rdg-focus--color)",
            }}
          >
            No results found
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default CompareDetailsTable;
