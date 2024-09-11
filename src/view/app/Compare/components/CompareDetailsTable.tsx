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
  FormControl,
  Input,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import PercentageFill from "../../Components/PercentageBar/PercentageFill";

interface FilterHeaderProps {
  onFilterChange?: (value: string) => void;
  searchValue?: string;
  setSearchValue?: React.Dispatch<React.SetStateAction<string>>;
}

export interface CompareDetailsTableProps
  extends DataGridProps<ComparedModule>,
    Omit<FilterHeaderProps, "onFilterChange"> {}

const FilterHeader = React.memo<
  FilterHeaderProps & {
    dropdownValue: string;
    onDropdownChange: (event: SelectChangeEvent<string>) => void;
  }
>(
  ({
    onFilterChange,
    searchValue,
    setSearchValue,
    dropdownValue,
    onDropdownChange,
  }) => {
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

    const renderValue = (selected: string) => {
      switch (selected) {
        case "added":
          return (
            <div className="statusFilterOption">
              <AddCircleIcon
                style={{ color: "green", fontSize: 19, marginTop: "0.1rem" }}
              />
            </div>
          );
        case "removed":
          return (
            <div className="statusFilterOption">
              <RemoveCircleIcon
                style={{ color: "red", fontSize: 19, marginTop: "0.1rem" }}
              />
            </div>
          );
        default:
          return <div className="statusFilterOption">All</div>;
      }
    };

    const handleOnBlur = () => {
      if (setSearchValue) {
        setSearchValue(value);
      }
    };

    return (
      <Box>
        <div style={{ display: "flex", alignItems: "center" }}>
          <Input
            className="textInput"
            style={{
              flexGrow: 1,
              inlineSize: "100%",
              fontSize: "14px",
              height: "30px",
              color: "var(--vscode-input-foreground)",
              border: "1px solid var(--vscode-input-border)",
              borderRadius: "4px",
              padding: "4px 8px",
              backgroundColor: "var(--vscode-input-background)",
            }}
            value={value}
            onChange={handleChange}
            onBlur={handleOnBlur}
          />
          <FormControl
            variant="outlined"
            size="small"
            sx={{
              minWidth: 65,
              height: 30,
              border: "none",
              color: "var(--vscode-input-foreground)",
              ml: 0.5,
              backgroundColor: "var(--vscode-input-background)",
            }}
          >
            <Select
              value={dropdownValue}
              onChange={onDropdownChange}
              renderValue={renderValue}
              sx={{
                height: "100%",
                color: "var(--rdg-checkbox-focus-color)",
                border: "none",
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: "var(--vscode-input-background)",
                    color: "var(--vscode-input-foreground)",
                    border: "1px solid var(--vscode-input-border)",
                  },
                },
              }}
            >
              <MenuItem value="all">
                <ListItemText primary="All" />
              </MenuItem>
              <MenuItem value="added">
                <ListItemIcon>
                  <AddCircleIcon
                    style={{
                      color: "green",
                      fontSize: 16,
                      marginTop: "0.5rem",
                    }}
                  />
                </ListItemIcon>
                <ListItemText primary="Added" />
              </MenuItem>
              <MenuItem value="removed">
                <ListItemIcon>
                  <RemoveCircleIcon
                    style={{ color: "red", fontSize: 16, marginTop: "0.5rem" }}
                  />
                </ListItemIcon>
                <ListItemText primary="Removed" />
              </MenuItem>
            </Select>
          </FormControl>
        </div>
      </Box>
    );
  }
);

const CompareDetailsTable: React.FC<CompareDetailsTableProps> = ({
  searchValue,
  setSearchValue,
  ...otherProps
}) => {
  const [rows, setRows] = useState(otherProps.rows);
  const [filters, setFilters] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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
                    color: "green",
                    fontSize: 16,
                    position: "relative",
                    top: 3,
                  }}
                />
              );
            }
            if (row.status === "removed") {
              icon = (
                <RemoveCircleIcon
                  style={{
                    color: "red",
                    fontSize: 16,
                    position: "relative",
                    top: 3,
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

            if (props.row["status"] === "added") {
              return <PercentageFill value={0} />;
            }
            return <PercentageFill value={percentage} />;
          },
        };
      }

      return col;
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
