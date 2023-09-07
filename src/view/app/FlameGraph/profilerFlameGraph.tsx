import * as React from "react";
import {CallTree, PresentationData } from "../../../common/PresentationData";
import { FlameGraph } from 'react-flame-graph';

interface IConfigProps {
    presentationData: PresentationData
  }

function ProfilerFlameGraph({ presentationData }: IConfigProps) {
    const [callTree, setCallTree] = React.useState(presentationData.callTree);
    const [windowWidth, setWindowWidth] = React.useState(window.innerWidth);
    const [windowHeight, setWindowHeight] = React.useState(window.innerHeight);

    const windowResize = () => {
        setWindowWidth(window.innerWidth);
        setWindowHeight(window.innerHeight);
    };

    React.useEffect(() => {
        window.addEventListener("resize", windowResize);

        return () => {
            window.removeEventListener("resize", windowResize);
        };
    }, []);

    React.useEffect(() => {
        window.addEventListener("message", (event) => {
          const message = event.data as PresentationData;
          setCallTree(message.callTree);
        });
      }, []);

    function convertToNestedStructure(data: CallTree[]): any {
        const root: any = {
          name: 'root',
          value: 100,
          children: [],
        };

        const nodeMap: { [key: number]: any } = {};

        for (const item of data) {
          nodeMap[item.nodeID] = {
            name: item.moduleName,
            value: item.pcntOfSession,
            children: [],
          };

          if (item.parentID === 0) {
            root.children.push(nodeMap[item.nodeID]);
          } else {
            if (!nodeMap[item.parentID].children) {
              nodeMap[item.parentID].children = [];
            }
            nodeMap[item.parentID].children.push(nodeMap[item.nodeID]);
          }
        }

        return root;
      }

      const nestedStructure = convertToNestedStructure(callTree);

    return (
        <React.Fragment>
        <div>
          <div className="grid-name">Flame Graph</div>
          <FlameGraph
              data={nestedStructure}
              height={windowHeight}
              width={windowWidth - 140}
              onChange={node => {
                  console.log(`"${node.name}" focused`);
              }}
          />
        </div>
        </React.Fragment>
      );
}
export default ProfilerFlameGraph;