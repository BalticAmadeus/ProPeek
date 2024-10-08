import { Box } from "@mui/material";
import * as React from "react";
import OpenFileTypeSetting from "./OpenFileTypeSetting"; 

interface FileTypeSettingsProps {
  showOpenFileType?: boolean;
}

const FileTypeSettings: React.FC<FileTypeSettingsProps> = ({
  showOpenFileType = false,
}) => {
  return <Box>{showOpenFileType ? <OpenFileTypeSetting /> : <></>}</Box>;
};

export default FileTypeSettings;