import { Box } from "@mui/material";
import * as React from "react";
import OpenFileTypeSetting from "./OpenFileTypeSetting"; 

interface FileTypeSettingsProps {
  hasXREFs: boolean;
  hasListings: boolean;
  infoMessage: string;
}

const FileTypeSettings: React.FC<FileTypeSettingsProps> = ({
  hasXREFs,
  hasListings,
  infoMessage,
}) => {
  const showOpenFileType = hasXREFs || hasListings;
  return (
    <Box>
      {showOpenFileType ? (
        <OpenFileTypeSetting
          hasXREFs={hasXREFs}
          hasListings={hasListings}
          infoMessage={infoMessage}
        />
      ) : (
        <></>
      )}
    </Box>
  );
};

export default FileTypeSettings;