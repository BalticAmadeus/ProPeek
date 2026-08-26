import * as React from "react";
import { useState } from "react";
import {
  PresentationData,
  ComparedData,
} from "../../../common/PresentationData";
import ProfilerTreeView from "../ProfilerTreeView/profilerTreeView";
import ProfilerFlameGraph from "../FlameGraph/profilerFlameGraph";
import ProfilerModuleDetails from "../ModuleDetails/profilerModuleDetails";
import CompareModuleDetails from "../Compare/compareModuleDetails";
import { ToggleButtonGroup } from "@mui/material";
import LoadingOverlay from "../../../../src/components/loadingOverlay/loadingOverlay";
import { getVSCodeAPI } from "../utils/vscode";
import FileTypeSettingsContextProvider from "../Components/FileTypeSettingsContext";
import ProToggleButton from "../Components/Buttons/ProToggleButton";
import ProfilerRelationshipGraph2D from "../RelationshipGraph2D/profilerRelationshipGraph2D";
import BannerMessage, { BannerMessageProps } from "../Components/BannerMessage";

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
  Compare = "Compare",
  RelationshipGraph2D = "RelationshipGraph",
}
const ProfilerForm: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ProfilerTab>(
    ProfilerTab.ModuleDetails,
  );
  const [presentationData, setPresentationData] = useState<PresentationData>(
    defaultPresentationData,
  );
  const [showStartTime, setShowStartTime] = useState<boolean>(false);
  const [comparedData, setComparedData] = useState<ComparedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCompare, setIsLoadingCompare] = useState<boolean>(false);
  const [moduleName, setModuleName] = useState<string>("");
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [fileName2, setFileName2] = useState<string>("");
  const [bannerMessage, setBanner] = useState<BannerMessageProps | null>(null);
  const vscode = getVSCodeAPI();

  React.useLayoutEffect(() => {
    window.addEventListener("message", (event) => {
      if (event.data.type === "Compare Data") {
        setComparedData(event.data.data as ComparedData);
        setActiveTab(ProfilerTab.Compare);
        setFileName(event.data.fileName);
        setFileName2(event.data.fileName2);
      }
      if (event.data.type === "Presentation Data") {
        setPresentationData(event.data.data as PresentationData);
        setShowStartTime(event.data.showStartTime);
      }
      if (event.data.type === "setLoading") {
        setIsLoadingCompare(event.data.isLoading);
      }
      if (event.data.type === "showBannerMessage") {
        setBanner({
          message: event.data.message,
          buttonText: event.data.buttonText,
          actionUrl: event.data.actionUrl,
          dismissKey: event.data.dismissKey,
          onDismiss: handleBannerDismiss,
        });
      }
    });
  });

  const handleBannerDismiss = (dismissKey: string) => {
    setBanner(null);
    vscode.postMessage({
      type: "DISMISS_BANNER",
      dismissKey,
    });
  };

  React.useEffect(() => {
    if (presentationData !== defaultPresentationData) {
      setIsLoading(false);
    }
  }, [presentationData]);

  React.useEffect(() => {
    if (comparedData !== null) {
      setIsLoadingCompare(false);
    }
  }, [comparedData]);

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
        <FileTypeSettingsContextProvider>
          <ProfilerTreeView
            presentationData={presentationData}
            handleNodeSelection={handleNodeSelection}
            vscode={vscode}
          />
        </FileTypeSettingsContextProvider>
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
            showStartTime={showStartTime}
          />
        </FileTypeSettingsContextProvider>
      </div>
    );
  };
  const Compare: React.FC = () => {
    return (
      <div>
        {comparedData && (
          <CompareModuleDetails
            comparedData={comparedData}
            fileName={fileName}
            fileName2={fileName2}
          />
        )}
      </div>
    );
  };
  const RelationshipGraphTab: React.FC = () => {
    return (
      <div>
        <FileTypeSettingsContextProvider>
          <ProfilerRelationshipGraph2D
            presentationData={presentationData}
            handleNodeSelection={handleNodeSelection}
          />
        </FileTypeSettingsContextProvider>
      </div>
    );
  };

  let content: JSX.Element | null = null;
  const onTabChange = async (
    event: React.MouseEvent<HTMLElement>,
    tab: ProfilerTab | null,
  ) => {
    if (!tab) {return;}
    else if (tab === ProfilerTab.Compare && !comparedData) {
      const userWantsToCompare: any = await vscode.postMessage({
        type: "requestCompareFiles",
        presentationData,
      });

      if (userWantsToCompare) {
        setActiveTab(ProfilerTab.Compare);
      } else {
        setActiveTab(activeTab);
      }
    } else {
      setActiveTab(tab);
    }
  };

  const handleNodeSelection = (
    moduleName: string,
    selectedModuleId: number,
  ) => {
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
    case ProfilerTab.Compare:
      content = <Compare />;
      break;
    case ProfilerTab.RelationshipGraph2D:
      content = <RelationshipGraphTab />;
      break;
  }
  return (
    <React.Fragment>
      {(isLoading || isLoadingCompare) && <LoadingOverlay />}
      <div>
        {bannerMessage && <BannerMessage {...bannerMessage} />}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            paddingBottom: 10,
            width: "100%",
            backgroundColor: "var(--vscode-editor-background)",
            boxShadow: "0 1px 0 var(--vscode-editorWidget-border)",
          }}
        >
          <ToggleButtonGroup
            sx={{ mt: 2 }}
            size="small"
            value={activeTab}
            onChange={onTabChange}
            exclusive
          >
            <ProToggleButton value={ProfilerTab.ModuleDetails}>
              Module Details
            </ProToggleButton>
            <ProToggleButton value={ProfilerTab.TreeView}>
              Tree View
            </ProToggleButton>
            <ProToggleButton value={ProfilerTab.FlameGraph}>
              Flame Graph
            </ProToggleButton>
            <ProToggleButton value={ProfilerTab.RelationshipGraph2D}>
              Call Graph
            </ProToggleButton>
            <ProToggleButton value={ProfilerTab.Compare}>
              Compare
            </ProToggleButton>
          </ToggleButtonGroup>
        </div>
        <div style={{ paddingTop: 10 }}>{content}</div>
      </div>
    </React.Fragment>
  );
};
export default ProfilerForm;
