import * as React from "react";
import { useState} from "react";
import { PresentationData} from "../../../common/PresentationData";


import ProfilerTreeView from "../ProfilerTreeView/profilerTreeView";
import ProfilerFlameGraph from "../FlameGraph/profilerFlameGraph";
import ProfilerModuleDetails from "../ModuleDetails/ProfilerModuleDetails";

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

    const Tab1Content: React.FC = () => {
        return (
        <div>
            <ProfilerModuleDetails
                presentationData={presentationData2}
            />
        </div>
        );
      };

      const Tab2Content: React.FC = () => {
        return (
          <div>
            <hr></hr>
            <ProfilerTreeView
                presentationData={presentationData2}
            />
          </div>
        );
      };

      const Tab3Content: React.FC = () => {
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
            content = <Tab1Content />;
          } else if (activeTab === 1) {
            content = <Tab2Content />;
          } else if (activeTab === 2) {
            content = <Tab3Content />;
          }

    return (
        <React.Fragment>
            <div>
                <div className="tabs">
                    <div
                        className={`tab ${activeTab === 0 ? 'active' : ''}`}
                        onClick={() => handleTabClick(0)}
                    >
                    Tab 1
                    </div>
                    <div
                        className={`tab ${activeTab === 1 ? 'active' : ''}`}
                        onClick={() => handleTabClick(1)}
                    >
                    Tab 2
                    </div>
                    <div
                        className={`tab ${activeTab === 2 ? 'active' : ''}`}
                        onClick={() => handleTabClick(2)}
                    >
                    Tab 3
                    </div>
                </div>
                <div>
                    {content}
                </div>
            </div>
        </React.Fragment>
    );
}

export default ProfilerForm;