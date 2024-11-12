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
} from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import { useState } from "react";
interface FilterHeaderProps {
  onFilterChange?: (value: string) => void;
  searchValue?: string;
  setSearchValue?: React.Dispatch<React.SetStateAction<string>>;
  showDropdown?: boolean;
  dropdownValue?: string;
  onDropdownChange?: (event: SelectChangeEvent<string>) => void;
}

const FilterHeader: React.FC<FilterHeaderProps> = ({
  onFilterChange,
  searchValue,
  setSearchValue,
  showDropdown = false,
  dropdownValue,
  onDropdownChange,
}) => {
  const [value, setValue] = useState<string>(searchValue ?? "");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setValue(searchValue ?? "");
    if (onFilterChange) {
      onFilterChange(searchValue ?? "");
    }
  }, [searchValue, onFilterChange]);

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

  const handleBoxClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <Box onClick={handleBoxClick}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <Input
          className="textInput"
          inputRef={inputRef}
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
        {showDropdown && (
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
              value={dropdownValue ?? "all"}
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
        )}
      </div>
    </Box>
  );
};

export default FilterHeader;
