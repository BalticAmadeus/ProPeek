import * as React from "react";
import { useState} from "react";
import { PresentationData} from "../../../common/PresentationData";
import ProfilerTreeView from "../ProfilerTreeView/profilerTreeView";
import ProfilerFlameGraph from "../FlameGraph/profilerFlameGraph";
import ProfilerModuleDetails from "../ModuleDetails/profilerModuleDetails";
import { ProPeekButton } from "../assets/button";

interface IConfigProps {
    presentationData: PresentationData
}

function ProfilerForm({ presentationData }: IConfigProps) {
    const [activeTab, setActiveTab] = useState<number | null>(null);
    const [presentationData2, setPresentationData] = useState(presentationData);

    React.useLayoutEffect(() => {
        window.addEventListener("message", (event) => {
            const message = event.data as PresentationData;

            setPresentationData(message);
        });
    });

    const ModuleDetailsTab: React.FC = () => {
        return (
        <div>
            <ProfilerModuleDetails
                presentationData={presentationData2}
            />
        </div>
        );
      };

      const TreeViewTab: React.FC = () => {
        return (
          <div>
            <hr></hr>
            <ProfilerTreeView
                presentationData={presentationData2}
            />
          </div>
        );
      };

      const FlameGraphTab: React.FC = () => {
        return (
          <div>
            <ProfilerFlameGraph
                presentationData={presentationData2}
            />
          </div>
        );
      };

      let content: JSX.Element | null = null;

        const handleTabClick = (tabIndex: number) => {
          setActiveTab(tabIndex);
        };


        if (activeTab === 0) {
            content = <ModuleDetailsTab />;
          } else if (activeTab === 1) {
            content = <TreeViewTab />;
          } else if (activeTab === 2) {
            content = <FlameGraphTab />;
          }

    return (
        <React.Fragment>
            <div>
                <div className="tabs">
                    <ProPeekButton
                        className={`tab ${activeTab === 0 ? 'active' : ''}`}
                        onClick={() => handleTabClick(0)}
                    >
                    Module Details
                    </ProPeekButton>
                    <ProPeekButton
                        className={`tab ${activeTab === 1 ? 'active' : ''}`}
                        onClick={() => handleTabClick(1)}
                    >
                    Tree View
                    </ProPeekButton>
                    <ProPeekButton
                        className={`tab ${activeTab === 2 ? 'active' : ''}`}
                        onClick={() => handleTabClick(2)}
                    >
                    Flame Graph
                    </ProPeekButton>
                </div>
                <div>
                    {content}
                </div>
            </div>
        </React.Fragment>
    );
}

export default ProfilerForm;