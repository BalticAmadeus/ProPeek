/* eslint-disable @typescript-eslint/naming-convention */
import * as React from "react";
import { CallTree, PresentationData } from "../../../common/PresentationData";
import { FlameGraph } from "react-flame-graph";
import "./profilerFlameGraph.css";

interface IConfigProps {
  presentationData: PresentationData;
  handleNodeSelection: any;
  showStartTime: boolean;
  setShowStartTime: React.Dispatch<React.SetStateAction<boolean>>;
  vscode: any;
}

export enum SearchTypes {
  Length,
  ConstructorOrDestructor,
  Search,
}

function ProfilerFlameGraph({
  presentationData,
  handleNodeSelection,
  showStartTime,
  setShowStartTime,
  vscode,
}: IConfigProps) {
  const [searchPhrase, setSearchPhrase] = React.useState<string>("");
  const [selectedSearchType, setSelectedSearchType] = React.useState("");

  const [callTree, setCallTree] = React.useState(presentationData.callTree);
  const [windowWidth, setWindowWidth] = React.useState(window.innerWidth);
  const [windowHeight, setWindowHeight] = React.useState(window.innerHeight);
  const [nestedStructure, setNestedStructure] = React.useState<any>(
    convertToNestedStructure(callTree, Mode.Length, searchPhrase)
  );
  const [graphType, setGraphType] = React.useState("Combined"); // New state for graph type

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

  const handleChange = ({
    currentTarget,
  }: React.ChangeEvent<HTMLInputElement>) => {
    switch (currentTarget.value) {
      case SearchTypes[SearchTypes.Length]:
        setNestedStructure(
          convertToNestedStructure(callTree, Mode.Length, searchPhrase)
        );
        break;
      case SearchTypes[SearchTypes.ConstructorOrDestructor]:
        setNestedStructure(
          convertToNestedStructure(
            callTree,
            Mode.ConstructorDestructor,
            searchPhrase
          )
        );
        break;
      case SearchTypes[SearchTypes.Search]:
        setNestedStructure(
          convertToNestedStructure(callTree, Mode.Search, searchPhrase)
        );
        break;
    }
  };

  const handleGraphTypeChange = (event) => {
    const newShowStartTime = event.target.value === "Combined" ? false : true;
    setShowStartTime(newShowStartTime);

    vscode.postMessage({
      type: "GRAPH_TYPE_CHANGE",
      showStartTime: newShowStartTime,
    });
  };

  return (
    <React.Fragment>
      <div className="flex-row-container">
        <div className="checkbox">
          <label>
            <b>Search Type:</b>
          </label>
          <br />
          <br />
          {Object.keys(SearchTypes)
            .filter((key) => Number.isNaN(+key))
            .map((key) => (
              <label className="radioBtn" key={key}>
                <input
                  type="radio"
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
        <div className="graph-type-selects">
          <label>
            <b>Graph Type:</b>
          </label>
          <br />
          <br />
          <label>
            <input
              type="radio"
              name="graphType"
              value="Combined"
              onChange={handleGraphTypeChange}
              checked={showStartTime === false}
            />
            Combined
          </label>
          <label>
            <input
              type="radio"
              name="graphType"
              value="Separate"
              onChange={handleGraphTypeChange}
              checked={showStartTime === true}
            />
            Separate
          </label>
        </div>
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
              setNestedStructure(
                convertToNestedStructure(
                  callTree,
                  Mode.Search,
                  event.target.value
                )
              );
            }}
          />
        </div>
      )}

      <div>
        <div className="grid-name">Flame Graph</div>
        <FlameGraph
          data={nestedStructure}
          height={windowHeight}
          width={windowWidth - 40}
          onDoubleClick={(node) => {
            handleNodeSelection(node.name);
          }}
        />
      </div>
    </React.Fragment>
  );
}
export default ProfilerFlameGraph;

function convertToNestedStructure(
  data: CallTree[],
  mode: Mode,
  searchPhrase: string
): any {
  const nodeMap: { [key: number]: any } = {};
  const rootNode = data[0];
  let root: any;

  //if there is no call tree data, define and return empty root node
  if (rootNode === undefined) {
    root = {
      name: "root",
      value: 100,
      left: 0,
      children: [],
    };
  }

  for (const node of data) {
    let flameGraphNode = {
      name: node.moduleName,
      value: node.pcntOfSession,
      backgroundColor: giveColor(mode, node, searchPhrase),
      tooltip: `Name: ${
        node.moduleName
      } Percentage of Session: ${node.pcntOfSession.toFixed(
        2
      )}% Cumulative Time: ${node.cumulativeTime}`,
      children: [],
      left: 0,
    };

    if (node.parentID === rootNode.parentID) {
      root = flameGraphNode;
    } else {
      nodeMap[node.nodeID] = flameGraphNode;
      nodeMap[node.nodeID].left =
        (node.startTime - rootNode.startTime) / rootNode.cumulativeTime;

      if (node.parentID === rootNode.nodeID) {
        root.children.push(nodeMap[node.nodeID]);
      } else {
        if (!nodeMap[node.parentID].children) {
          nodeMap[node.parentID].children = [];
        }
        nodeMap[node.parentID].children.push(nodeMap[node.nodeID]);
      }
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
  if (item.moduleName.split(" ").length === 1) {
    return ConstructorDestructorType.None;
  }

  const method = item.moduleName.split(".")[0].split(" ")[0]; //first element

  const className = item.moduleName.split(".").slice(-1)[0]; //last element

  if (method === className) {
    return ConstructorDestructorType.Constructor;
  } else if (method === "~" + className) {
    return ConstructorDestructorType.Destructor;
  }

  return ConstructorDestructorType.None;
}
