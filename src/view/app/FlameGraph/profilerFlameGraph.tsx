/* eslint-disable @typescript-eslint/naming-convention */
import * as React from "react";
import { CallTree, PresentationData } from "../../../common/PresentationData";
import { FlameGraph } from "react-flame-graph";

interface IConfigProps {
  presentationData: PresentationData;
}

function ProfilerFlameGraph({ presentationData }: IConfigProps) {
  const [callTree, setCallTree] = React.useState(presentationData.callTree);
  const [windowWidth, setWindowWidth] = React.useState(window.innerWidth);
  const [windowHeight, setWindowHeight] = React.useState(window.innerHeight);
  const [nestedStructure, setNestedStructure] = React.useState<any>(convertToNestedStructure(callTree, Mode.Search));

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

  return (
    <React.Fragment>
      <div>
        <FlameGraph
          data={nestedStructure}
          height={windowHeight}
          width={windowWidth - 140}
          onChange={(node) => {
            console.log(`"${node.name}" focused`);
          }}
        />
      </div>
    </React.Fragment>
  );
}
export default ProfilerFlameGraph;



function convertToNestedStructure(data: CallTree[], mode: Mode): any {
  const root: any = {
    backgroundColor: "#ffffff",
    name: "root",
    value: 100,
    children: [],
  };

  const nodeMap: { [key: number]: any } = {};

  for (const item of data) {
    nodeMap[item.nodeID] = {
      name: item.moduleName,
      value: item.pcntOfSession,
      backgroundColor: giveColor(mode, item),
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

enum Mode {
  Lenght,
  ConstructorDestructor,
  Search,
}

enum ConstructorDestructorType {
  Constructor,
  Destructor,
  None,
}

function giveColor(mode: Mode, item: CallTree): string {
  switch (mode) {
    case Mode.Lenght:
      return undefined;
    case Mode.ConstructorDestructor:
      return giveColorConstructorOrDestructor(item);
    case Mode.Search:
      return giveColorSearch(item);
    default:
      return "#ffffff";
  }
}

function giveColorConstructorOrDestructor(item: CallTree): string {
  switch (isConstructorOrDestructor(item)) {
    case ConstructorDestructorType.Constructor:
      return "#00ff00";
    case ConstructorDestructorType.Destructor:
      return "#ff0000";
    default:
      return "#ffffff";
  }
}

function giveColorSearch(item: CallTree): string {
  return item.moduleName.includes("Osc") ? "#00ff00" : "#ffffff";
}

function isConstructorOrDestructor(item: CallTree): ConstructorDestructorType {
  const method = (item.moduleName.split(".")[0]).split(" ")[0]; //first element
  const className = item.moduleName.split(".").slice(-1)[0]; //last element

  if (method === className) {
    return ConstructorDestructorType.Constructor;
  } else if (method === "~" + className) {
    return ConstructorDestructorType.Destructor;
  }

  return ConstructorDestructorType.None;
}
