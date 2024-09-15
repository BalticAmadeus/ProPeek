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
import { Box, Input, Typography } from "@mui/material";
import { useFileTypeSettingsContext } from "../../Components/FileTypeSettingsContext";
import PercentageFill from "../../Components/PercentageBar/PercentageFill";

interface FilterHeaderProps {
  onFilterChange?: (value: string) => void;
  searchValue?: string;
  setSearchValue?: React.Dispatch<React.SetStateAction<string>>;
}
export interface ModuleDetailsTableProps
  extends DataGridProps<ModuleDetails>,
    Omit<FilterHeaderProps, "onFilterChange"> {}

const FilterHeader = React.memo<FilterHeaderProps>(
  ({ onFilterChange, searchValue, setSearchValue }) => {
    const [value, setValue] = useState<string>(searchValue ?? "");
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
      setValue(searchValue);
      if (onFilterChange) {
        onFilterChange(searchValue);
      }
    }, [searchValue]);

    const handleChange = React.useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
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

    const handleBoxClick = () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    return (
      <Box onClick={handleBoxClick}>
        <Input
          inputRef={inputRef}
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
      </Box>
    );
  }
);

const ModuleDetailsTable: React.FC<ModuleDetailsTableProps> = ({
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
          minWidth: 350,
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
          formatter: ({ row }: FormatterProps<ModuleDetails>) => {
            const cellRef = React.useRef<HTMLDivElement>(null);
            const [isOverflow, setIsOverflow] = React.useState(false);
            const [isHovered, setIsHovered] = React.useState(false);

            const checkOverflow = () => {
              if (cellRef.current) {
                const isOverflowing =
                  cellRef.current.scrollWidth > cellRef.current.clientWidth;
                setIsOverflow(isOverflowing);
              }
            };

            const handleMouseEnter = () => {
              setIsHovered(true);
              checkOverflow();
            };

            const handleMouseLeave = () => {
              setIsHovered(false);
              setIsOverflow(false);
            };

            return (
              <div
                ref={cellRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  textDecoration: row.hasLink ? "underline" : "",
                }}
                title={isHovered && isOverflow ? row[col.key] : undefined}
              >
                {row[col.key]}
              </div>
            );
          },
        };
      }

      if (col.key === "pcntOfSession") {
        return {
          ...col,
          minWidth: 200,
          formatter: (props: FormatterProps<ModuleDetails>) => {
            const percentage = props.row[col.key];
            return <PercentageFill value={percentage} />;
          },
          headerRenderer: (props: HeaderRendererProps<ModuleDetails>) => (
            <Box sx={{ lineHeight: "45px",
              cursor: "pointer",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap", }}>
              {HeaderRenderer<ModuleDetails, unknown>({ ...props })}
            </Box>
          ),
        };
      }

      return {
        ...col,

        headerRenderer: (props: HeaderRendererProps<ModuleDetails>) => (
          <Box
            sx={{
              lineHeight: "45px",
              cursor: "pointer",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {HeaderRenderer<ModuleDetails, unknown>({ ...props })}
          </Box>
        ),
      };
    });
  };

  const filteredColumns = React.useMemo(() => {
    return addFilterRendererToColumns(otherProps.columns);
  }, [otherProps.columns, searchValue]);

  const openFileForModuleDetails = (row: ModuleDetails): void => {
    if (!row.hasLink) {
      return;
    }

    vscode.postMessage({
      type: settingsContext.openFileType,
      name: row.moduleName,
      listingFile: row?.listingFile,
      lineNumber: row.startLineNum,
    });
  };

  return (
    <Box sx={{ position: "relative" }}>
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
            zIndex: 1,
            pointerEvents: "none",
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

export default ModuleDetailsTable;
