/* eslint-disable @typescript-eslint/naming-convention */
import * as React from "react";
import { CallTree, PresentationData } from "../../../common/PresentationData";
import { FlameGraph } from "react-flame-graph";
import { ProPeekButton } from "../assets/button";

interface IConfigProps {
  presentationData: PresentationData;
}

function ProfilerFlameGraph({ presentationData }: IConfigProps) {
    const [searchPhrase, setSearchPhrase] = React.useState<string>("");

    const [callTree, setCallTree] = React.useState(presentationData.callTree);
    const [windowWidth, setWindowWidth] = React.useState(window.innerWidth);
    const [windowHeight, setWindowHeight] = React.useState(window.innerHeight);
    const [nestedStructure, setNestedStructure] = React.useState<any>(convertToNestedStructure(callTree, Mode.Search, searchPhrase));

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

    var inputQuery: HTMLButtonElement = undefined;
    React.useEffect(() => {
        if (inputQuery) {
            inputQuery.click();
        }
    }, []);

      const onQueryClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        console.log("searchPhrase" ,searchPhrase);
        setNestedStructure(convertToNestedStructure(callTree, Mode.Search, searchPhrase));;
    };

    const handleKeyDown = (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            setNestedStructure(convertToNestedStructure(callTree, Mode.Search, searchPhrase));
        }
    };

  return (
    <React.Fragment>
        <div className="input-box">
            <input
                id="input"
                className="textInputQuery"
                type="text"
                value={searchPhrase}
                onChange={(event) => {
                    setSearchPhrase(event.target.value);
                }}
                onKeyDown={handleKeyDown}
            />
                <ProPeekButton
                    ref={(input) => (inputQuery = input)}
                    // startIcon={<PlayArrowTwoToneIcon />}
                    onClick={onQueryClick}
                >
                    Query
                </ProPeekButton>

        </div>
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



function convertToNestedStructure(data: CallTree[], mode: Mode, searchPhrase: string): any {
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
      backgroundColor: giveColor(mode, item, searchPhrase),
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

function giveColor(mode: Mode, item: CallTree, searchPhrase: string): string {
  switch (mode) {
    case Mode.Lenght:
      return undefined;
    case Mode.ConstructorDestructor:
      return giveColorConstructorOrDestructor(item);
    case Mode.Search:
      return giveColorSearch(item, searchPhrase);
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

function giveColorSearch(item: CallTree, searchPhrase: string): string {
  return item.moduleName.includes(searchPhrase) ? "#00ff00" : "#ffffff";
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
