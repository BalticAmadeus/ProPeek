/* eslint-disable @typescript-eslint/naming-convention */
import * as React from "react";
import { CallTree, PresentationData } from "../../../common/PresentationData";
import { FlameGraph } from "react-flame-graph";

interface IConfigProps {
  presentationData: PresentationData;
}

export enum SearchTypes {
    Length,
    ConstructorOrDestructor,
    Search,
  }

function ProfilerFlameGraph({ presentationData }: IConfigProps) {
    const [searchPhrase, setSearchPhrase] = React.useState<string>("");
    const [selectedSearchType, setSelectedSearchType] = React.useState("");

    const [callTree, setCallTree] = React.useState(presentationData.callTree);
    const [windowWidth, setWindowWidth] = React.useState(window.innerWidth);
    const [windowHeight, setWindowHeight] = React.useState(window.innerHeight);
    const [nestedStructure, setNestedStructure] = React.useState<any>(convertToNestedStructure(callTree, Mode.Length, searchPhrase));

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

    const handleChange = ({ currentTarget }: React.ChangeEvent<HTMLInputElement>) => {
        switch (currentTarget.value) {
            case SearchTypes[SearchTypes.Length]:
                setNestedStructure(convertToNestedStructure(callTree, Mode.Length, searchPhrase));
            break;
            case SearchTypes[SearchTypes.ConstructorOrDestructor]:
                setNestedStructure(convertToNestedStructure(callTree, Mode.ConstructorDestructor, searchPhrase));
            break;
            case SearchTypes[SearchTypes.Search]:
                setNestedStructure(convertToNestedStructure(callTree, Mode.Search, searchPhrase));
            break;
        }
    };

  return (
    <React.Fragment>
        <div className="checkbox">
            <label><b>
            Search Type:
            </b></label>
            <br />
            <br />
            {Object.keys(SearchTypes).filter(key => Number.isNaN(+key)).map((key) => (
            <label className="radioBtn" key={key}>
                <input type="radio"
                name="exportdata"
                onChange={(e) => {
                    handleChange(e);
                    setSelectedSearchType(key);
                }}
                value={key}
                defaultChecked={SearchTypes[key] === SearchTypes.Length}
                />
                {key}
            </label>
            ))}
        </div>

        {selectedSearchType === "Search" && (
            <div className="input-box">
                <input
                    id="input"
                    className="textInputQuery"
                    type="text"
                    value={searchPhrase}
                    onChange={(event) => {
                        setSearchPhrase(event.target.value);
                        setNestedStructure(convertToNestedStructure(callTree, Mode.Search, event.target.value));
                    }}
                />
            </div>
        )}

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
    name: "root",
    value: 100,
    children: [],
  };

  const nodeMap: { [key: number]: any } = {};
  const startNode : number = data[0].parentID;

  for (const item of data) {
    nodeMap[item.nodeID] = {
      name: item.moduleName,
      value: item.pcntOfSession,
      backgroundColor: giveColor(mode, item, searchPhrase),
      children: [],
    };

    if (item.parentID === startNode) {
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
  Length,
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
    case Mode.Length:
      return undefined;
    case Mode.ConstructorDestructor:
      return giveColorConstructorOrDestructor(item);
    case Mode.Search:
      return giveColorSearch(item, searchPhrase);
    default:
      return "#bcb8b8";
  }
}

function giveColorConstructorOrDestructor(item: CallTree): string {
  switch (isConstructorOrDestructor(item)) {
    case ConstructorDestructorType.Constructor:
      return "#00c030";
    case ConstructorDestructorType.Destructor:
      return "#ff0000";
    default:
      return "#bcb8b8";
  }
}

function giveColorSearch(item: CallTree, searchPhrase: string): string {
  return item.moduleName.includes(searchPhrase) ? "#00c030" : "#bcb8b8";
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
