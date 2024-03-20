import * as React from "react";
import { OpenFileTypeEnum } from "../../../../common/openFile";

interface ModuleDetailsSettingsContextType {
  openFileType: OpenFileTypeEnum;
  setOpenFileType: React.Dispatch<React.SetStateAction<OpenFileTypeEnum>>;
}

const ModuleDetailsSettingsContext =
  React.createContext<ModuleDetailsSettingsContextType | null>(null);

export const useModuleDetailsSettingsContext = () => {
  const context = React.useContext(ModuleDetailsSettingsContext);
  if (!context) {
    throw new Error(
      "useModuleDetailsSettingsContext must be used within a ModuleDetailsSettingsContextProvider"
    );
  }
  return context;
};

const ModuleDetailsSettingsContextProvider = ({
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
    <ModuleDetailsSettingsContext.Provider value={value}>
      {children}
    </ModuleDetailsSettingsContext.Provider>
  );
};

export default ModuleDetailsSettingsContextProvider;
