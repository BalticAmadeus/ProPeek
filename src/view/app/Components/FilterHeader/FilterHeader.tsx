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
  useTheme,
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
  const theme = useTheme();

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
              style={{ color: theme.palette.success.main, fontSize: 19, marginTop: "0.1rem" }}
            />
          </div>
        );
      case "removed":
        return (
          <div className="statusFilterOption">
            <RemoveCircleIcon
              style={{ color: theme.palette.error.main, fontSize: 19, marginTop: "0.1rem" }}
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
            borderRadius: "4px",
            padding: "4px 8px",
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
              ml: 0.5,
            }}
          >
            <Select
              value={dropdownValue ?? "all"}
              onChange={onDropdownChange}
              renderValue={renderValue}
              sx={{
                height: "100%",
                border: "none",
              }}
            >
              <MenuItem value="all">
                <ListItemText primary="All" />
              </MenuItem>
              <MenuItem value="added">
                <ListItemIcon>
                  <AddCircleIcon
                    style={{
                      color: theme.palette.success.main,
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
                    style={{ color: theme.palette.error.main, fontSize: 16, marginTop: "0.5rem" }}
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
