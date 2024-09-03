import * as React from "react";
import { OpenFileTypeEnum } from "../../../common/openFile";

interface FileTypeSettingsContextType {
  openFileType: OpenFileTypeEnum;
  setOpenFileType: React.Dispatch<React.SetStateAction<OpenFileTypeEnum>>;
}

const FileTypeSettingsContext =
  React.createContext<FileTypeSettingsContextType | null>(null);

export const useFileTypeSettingsContext = () => {
  const context = React.useContext(FileTypeSettingsContext);
  if (!context) {
    throw new Error(
      "useFileTypeSettingsContext must be used within a FileTypeSettingsContextProvider"
    );
  }
  return context;
};

const FileTypeSettingsContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [openFileType, setOpenFileType] = React.useState<OpenFileTypeEnum>(
    OpenFileTypeEnum.XREF
  );

  const value = React.useMemo(
    () => ({
      openFileType,
      setOpenFileType,
    }),
    [openFileType, setOpenFileType]
  );

  return (
    <FileTypeSettingsContext.Provider value={value}>
      {children}
    </FileTypeSettingsContext.Provider>
  );
};

export default FileTypeSettingsContextProvider;
