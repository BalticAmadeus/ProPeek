import { Box, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup } from "@mui/material";
import * as React from "react";
import { useFileTypeSettingsContext } from "./FileTypeSettingsContext";
import { OpenFileTypeEnum } from "../../../common/openFile";
import ToolTip from "./ToolTip";

interface OpenFileTypeSettingProps {
  hasXREFs: boolean;
  hasListings: boolean;
  infoMessage: string;
}

const OpenFileTypeSetting: React.FC<OpenFileTypeSettingProps> = ({
  hasXREFs,
  hasListings,
  infoMessage,
}) => {
  const settingsContext = useFileTypeSettingsContext();

  const onChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    value: string
  ) => {
    settingsContext.setOpenFileType(value as OpenFileTypeEnum);
  };

  return (
    <FormControl component={"div"}>
      <Box>
        <FormLabel id="code-display">Code display</FormLabel>
        <ToolTip message={infoMessage} show={true} iconSize="16px" />
      </Box>
      <RadioGroup
        row
        value={settingsContext.openFileType}
        onChange={onChange}
      >
        <FormControlLabel
          value={OpenFileTypeEnum.XREF}
          control={<Radio />}
          label="Source"
          disabled={!hasXREFs}
        />
        <FormControlLabel
          value={OpenFileTypeEnum.LISTING}
          control={<Radio />}
          label="Listing"
          disabled={!hasListings}
        />
      </RadioGroup>
    </FormControl>
  );
};

export default OpenFileTypeSetting;