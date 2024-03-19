import { Box, ToggleButtonGroup, Tooltip } from "@mui/material";
import * as React from "react";
import ProToggleButton from "../../Components/Buttons/ProToggleButton";
import { useModuleDetailsSettingsContext } from "./ModuleDetailsSettingsContext";
import { OpenFileTypeEnum } from "../../../../common/openFile";

interface ModuleDetailsSettingsProps {
  showOpenFileType?: boolean;
}

const OpenFileTypeSetting: React.FC = () => {
  const settingsContext = useModuleDetailsSettingsContext();

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
    <Box>
      <Tooltip title="Sets the file type to open on module double click">
        <ToggleButtonGroup
          size="small"
          value={settingsContext.openFileType}
          onChange={onChange}
          exclusive
        >
          <ProToggleButton value={OpenFileTypeEnum.XREF}>XREF</ProToggleButton>
          <ProToggleButton value={OpenFileTypeEnum.LISTING}>
            LISTING
          </ProToggleButton>
        </ToggleButtonGroup>
      </Tooltip>
    </Box>
  );
};

const ModuleDetailsSettings: React.FC<ModuleDetailsSettingsProps> = ({
  showOpenFileType = false,
}) => {
  return <Box>{showOpenFileType ? <OpenFileTypeSetting /> : <></>}</Box>;
};

export default ModuleDetailsSettings;
