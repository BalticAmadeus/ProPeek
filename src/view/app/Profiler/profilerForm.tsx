import * as React from "react";
import { useState } from "react";
import { PresentationData } from "../../../common/PresentationData";
import ProfilerTreeView from "../ProfilerTreeView/profilerTreeView";
import ProfilerFlameGraph from "../FlameGraph/profilerFlameGraph";
import ProfilerModuleDetails from "../ModuleDetails/profilerModuleDetails";
import { ToggleButtonGroup } from "@mui/material";
import LoadingOverlay from "../../../../src/components/loadingOverlay/loadingOverlay";
import { getVSCodeAPI } from "../utils/vscode";
import FileTypeSettingsContextProvider from "../Components/FileTypeSettingsContext";
import ProToggleButton from "../Components/Buttons/ProToggleButton";

const defaultPresentationData: PresentationData = {
  moduleDetails: [],
  calledModules: [],
  callTree: [],
  lineSummary: [],
  hasTracingData: false,
  hasXREFs: false,
  hasListings: false,
};

enum ProfilerTab {
  ModuleDetails = "ModuleDetails",
  TreeView = "TreeView",
  FlameGraph = "FlameGraph",
}

const ProfilerForm: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ProfilerTab>(
    ProfilerTab.ModuleDetails
  );
  const [presentationData, setPresentationData] = useState<PresentationData>(
    defaultPresentationData
  );
  const [isLoading, setLoading] = useState(true);
  const [moduleName, setModuleName] = useState<string>("");
  const [selectedModuleId, setSelectedModuleId] = useState<number>(null);

  const vscode = getVSCodeAPI();

  React.useLayoutEffect(() => {
    window.addEventListener("message", (event) => {
      const message = event.data as PresentationData;

      setPresentationData(message);
      setLoading(false);
    });
  });

  const ModuleDetailsTab: React.FC = () => {
    return (
      <div>
        <FileTypeSettingsContextProvider>
          <ProfilerModuleDetails
            presentationData={presentationData}
            moduleName={moduleName}
            selectedModuleId={selectedModuleId}
          />
        </FileTypeSettingsContextProvider>
      </div>
    );
  };

  const TreeViewTab: React.FC = () => {
    return (
      <div>
        <ProfilerTreeView
          presentationData={presentationData}
          handleNodeSelection={handleNodeSelection}
        />
      </div>
    );
  };

  const FlameGraphTab: React.FC = () => {
    return (
      <div>
        <FileTypeSettingsContextProvider>
          <ProfilerFlameGraph
            presentationData={presentationData}
            hasTracingData={presentationData.hasTracingData}
            handleNodeSelection={handleNodeSelection}
            vscode={vscode}
          />
        </FileTypeSettingsContextProvider>
      </div>
    );
  };

  let content: JSX.Element | null = null;

  const onTabChange = (
    event: React.MouseEvent<HTMLElement>,
    tab: ProfilerTab | null
  ) => {
    console.log(tab);

    if (!tab) {
      return;
    }

    setActiveTab(tab);
  };

  const handleNodeSelection = (moduleName: string, selectedModuleId: number) => {
    setModuleName(moduleName);
    setSelectedModuleId(selectedModuleId);
    setActiveTab(ProfilerTab.ModuleDetails);
  };

  React.useEffect(() => {
    if (activeTab !== ProfilerTab.ModuleDetails) {
      setModuleName("");
      setSelectedModuleId(null);
    }
  }, [activeTab]);

  switch (activeTab) {
    case ProfilerTab.ModuleDetails:
      content = <ModuleDetailsTab />;
      break;
    case ProfilerTab.TreeView:
      content = <TreeViewTab />;
      break;
    case ProfilerTab.FlameGraph:
      content = <FlameGraphTab />;
      break;
  }

  return (
    <React.Fragment>
      {isLoading && <LoadingOverlay />}
      <div>
        <div>
          <ToggleButtonGroup value={activeTab} onChange={onTabChange} exclusive>
            <ProToggleButton value={ProfilerTab.ModuleDetails}>
              Module Details
            </ProToggleButton>
            <ProToggleButton value={ProfilerTab.TreeView}>
              Tree View
            </ProToggleButton>
            <ProToggleButton value={ProfilerTab.FlameGraph}>
              Flame Graph
            </ProToggleButton>
          </ToggleButtonGroup>
        </div>
        <hr></hr>
        <div>{content}</div>
      </div>
    </React.Fragment>
  );
};

export default ProfilerForm;
