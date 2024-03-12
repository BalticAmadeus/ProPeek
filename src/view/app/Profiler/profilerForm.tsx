import * as React from "react";
import { useState } from "react";
import { PresentationData } from "../../../common/PresentationData";
import ProfilerTreeView from "../ProfilerTreeView/profilerTreeView";
import ProfilerFlameGraph from "../FlameGraph/profilerFlameGraph";
import ProfilerModuleDetails from "../ModuleDetails/profilerModuleDetails";
import { Button } from "@mui/material";
import LoadingOverlay from "../../../../src/components/loadingOverlay/loadingOverlay";
import { getVSCodeAPI } from "../utils/vscode";

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
  ModuleDetails = 0,
  TreeView = 1,
  FlameGraph = 2,
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
        <ProfilerModuleDetails
          presentationData={presentationData}
          moduleName={moduleName}
        />
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
        <ProfilerFlameGraph
          presentationData={presentationData}
          hasTracingData={presentationData.hasTracingData}
          handleNodeSelection={handleNodeSelection}
          vscode={vscode}
        />
      </div>
    );
  };

  let content: JSX.Element | null = null;

  const handleTabClick = (tab: ProfilerTab) => {
    setActiveTab(tab);

    if (activeTab !== ProfilerTab.ModuleDetails) {
      setModuleName("");
    }
  };

  const handleNodeSelection = (moduleName: string) => {
    setModuleName(moduleName);
    setActiveTab(ProfilerTab.ModuleDetails);
  };

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
        <div className="tabs">
          <Button
            className={`tab ${
              activeTab === ProfilerTab.ModuleDetails ? "active" : ""
            } buttonProfilerForm button-primary`}
            onClick={() => handleTabClick(ProfilerTab.ModuleDetails)}
            variant="contained"
          >
            Module Details
          </Button>
          <Button
            className={`tab ${
              activeTab === ProfilerTab.TreeView ? "active" : ""
            } buttonProfilerForm button-primary`}
            onClick={() => handleTabClick(ProfilerTab.TreeView)}
          >
            Tree View
          </Button>
          <Button
            className={`tab ${
              activeTab === ProfilerTab.FlameGraph ? "active" : ""
            } buttonProfilerForm button-primary`}
            onClick={() => handleTabClick(ProfilerTab.FlameGraph)}
          >
            Flame Graph
          </Button>
        </div>
        <hr></hr>
        <div>{content}</div>
      </div>
    </React.Fragment>
  );
};

export default ProfilerForm;
