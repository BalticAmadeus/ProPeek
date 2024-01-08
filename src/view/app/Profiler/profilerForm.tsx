import * as React from "react";
import { useState } from "react";
import { PresentationData } from "../../../common/PresentationData";
import ProfilerTreeView from "../ProfilerTreeView/profilerTreeView";
import ProfilerFlameGraph from "../FlameGraph/profilerFlameGraph";
import ProfilerModuleDetails from "../ModuleDetails/profilerModuleDetails";
import { Button } from "@mui/material";
import LoadingOverlay from "../../../../src/components/loadingOverlay/loadingOverlay";

interface IConfigProps {
  vscode: any;
  presentationData: PresentationData;
}

function ProfilerForm({ presentationData, vscode }: IConfigProps) {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [presentationData2, setPresentationData] = useState(presentationData);
  const [isLoading, setLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState<any>(null); // State to keep track of the selected row

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
          presentationData={presentationData2}
          vscode={vscode}
          selectedRow={selectedRow} // Pass the selectedRow state
          onRowSelect={handleRowSelection} // Pass the handleRowSelection callback
        />
      </div>
    );
  };

  const TreeViewTab: React.FC = () => {
    return (
      <div>
        <ProfilerTreeView presentationData={presentationData2} />
      </div>
    );
  };

  const FlameGraphTab: React.FC = () => {
    return (
      <div>
        <ProfilerFlameGraph presentationData={presentationData2} />
      </div>
    );
  };

  let content: JSX.Element | null = null;

  const handleTabClick = (tabIndex: number) => {
    setActiveTab(tabIndex);
  };

  const handleRowSelection = (row: any) => {
    setSelectedRow(row);
  };

  if (activeTab === 0) {
    content = (
      <ProfilerModuleDetails
        presentationData={presentationData2}
        vscode={vscode}
        selectedRow={selectedRow}
        onRowSelect={handleRowSelection}
      />
    );
  } else if (activeTab === 1) {
    content = <TreeViewTab />;
  } else if (activeTab === 2) {
    content = <FlameGraphTab />;
  }

  return (
    <React.Fragment>
      {isLoading && <LoadingOverlay />}
      <div>
        <div className="tabs">
          <Button
            className={`tab ${
              activeTab === 0 ? "active" : ""
            } buttonProfilerForm button-primary`}
            onClick={() => handleTabClick(0)}
            variant="contained"
          >
            Module Details
          </Button>
          <Button
            className={`tab ${
              activeTab === 1 ? "active" : ""
            } buttonProfilerForm button-primary`}
            onClick={() => handleTabClick(1)}
          >
            Tree View
          </Button>
          <Button
            className={`tab ${
              activeTab === 2 ? "active" : ""
            } buttonProfilerForm button-primary`}
            onClick={() => handleTabClick(2)}
          >
            Flame Graph
          </Button>
        </div>
        <hr></hr>
        <div>{content}</div>
      </div>
    </React.Fragment>
  );
}

export default ProfilerForm;
