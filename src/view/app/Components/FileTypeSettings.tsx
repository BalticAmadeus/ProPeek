import { Box, ToggleButtonGroup, Tooltip } from "@mui/material";
import * as React from "react";
import ProToggleButton from "./Buttons/ProToggleButton";
import { useFileTypeSettingsContext } from "./FileTypeSettingsContext";
import { OpenFileTypeEnum } from "../../../common/openFile";

interface FileTypeSettingsProps {
  showOpenFileType?: boolean;
}

const OpenFileTypeSetting: React.FC = () => {
  const settingsContext = useFileTypeSettingsContext();

  const onChange = (
    event: React.MouseEvent<HTMLElement>,
    fileType: OpenFileTypeEnum | null
  ) => {
    if (!fileType) {
      return;
    }

    settingsContext.setOpenFileType(fileType);
  };

  return (
    <Box sx={{ marginBottom: "4px" }}>
      <Tooltip title="Sets the file type to open on module double click">
        <ToggleButtonGroup
          size="small"
          value={settingsContext.openFileType}
          onChange={onChange}
          exclusive
        >
          <ProToggleButton variant="secondary" value={OpenFileTypeEnum.XREF}>
            XREF
          </ProToggleButton>
          <ProToggleButton variant="secondary" value={OpenFileTypeEnum.LISTING}>
            LISTING
          </ProToggleButton>
        </ToggleButtonGroup>
      </Tooltip>
    </Box>
  );
};

const FileTypeSettings: React.FC<FileTypeSettingsProps> = ({
  showOpenFileType = false,
}) => {
  return <Box>{showOpenFileType ? <OpenFileTypeSetting /> : <></>}</Box>;
};

export default FileTypeSettings;
