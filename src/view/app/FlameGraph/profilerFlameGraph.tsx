/* eslint-disable @typescript-eslint/naming-convention */
import * as React from "react";
import { CallTree, PresentationData } from "../../../common/PresentationData";
import { FlameGraph } from "react-flame-graph";
import "./profilerFlameGraph.css";
import LoadingOverlay from "../../../components/loadingOverlay/loadingOverlay";
import TimeRibbon from "./TimeRibbon";
import { Box } from "@mui/material";

interface FlameGraphNodeRoot {
  name: "root";
  value: number;
  left: number;
  cumulativeTime: number;
  children: Array<FlameGraphNode>;
}

interface FlameGraphNode extends Omit<FlameGraphNodeRoot, "name"> {
  name: string;
  backgroundColor: string;
  tooltip: string;
}

interface IConfigProps {
  presentationData: PresentationData;
  handleNodeSelection: any;
  vscode: any;
  hasTracingData: boolean;
}

export enum SearchTypes {
  Length,
  ConstructorOrDestructor,
  Search,
}

let showStartTime = false;

function ProfilerFlameGraph({
  presentationData,
  handleNodeSelection,
  vscode,
  hasTracingData,
}: IConfigProps) {
  const [searchPhrase, setSearchPhrase] = React.useState<string>("");
  const [selectedSearchType, setSelectedSearchType] = React.useState("");

  const [callTree, setCallTree] = React.useState(presentationData.callTree);
  const [windowWidth, setWindowWidth] = React.useState(window.innerWidth);
  const [windowHeight, setWindowHeight] = React.useState(window.innerHeight);
  const [nestedStructure, setNestedStructure] =
    React.useState<FlameGraphNodeRoot>(
      convertToNestedStructure(callTree, Mode.Length, searchPhrase)
    );
  const [timeRibbonEndValue, setTimeRibbonEndValue] = React.useState<number>(
    callTree[0]?.cumulativeTime ?? 1
  );
  const [isLoading, setIsLoading] = React.useState(false);

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
    const handleMessage = (event) => {
      const message = event.data as PresentationData;
      setCallTree(message.callTree);
      setIsLoading(false);
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
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
    setIsLoading(true);
    showStartTime = event.target.value !== "Combined";
    vscode.postMessage({
      type: "GRAPH_TYPE_CHANGE",
      showStartTime: showStartTime,
    });
  };

  return (
    <React.Fragment>
      {isLoading && <LoadingOverlay></LoadingOverlay>}
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
              defaultChecked={!showStartTime}
              disabled={!hasTracingData}
            />
            Combined
          </label>
          <label>
            <input
              type="radio"
              name="graphType"
              value="Separate"
              onChange={handleGraphTypeChange}
              defaultChecked={showStartTime}
              disabled={!hasTracingData}
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
        <TimeRibbon endValue={timeRibbonEndValue} />
        <Box className={"flame-graph-container"}>
          <FlameGraph
            data={nestedStructure}
            height={windowHeight}
            width={windowWidth - 63}
            onDoubleClick={(node) => {
              handleNodeSelection(node.name);
            }}
            onChange={(node) =>
              setTimeRibbonEndValue(
                (node.source as FlameGraphNode).cumulativeTime
              )
            }
          />
        </Box>
      </div>
    </React.Fragment>
  );
}
export default ProfilerFlameGraph;

function convertToNestedStructure(
  data: CallTree[],
  mode: Mode,
  searchPhrase: string
): FlameGraphNodeRoot {
  const nodeMap: { [key: number]: FlameGraphNode } = {};
  const rootNode = data[0];

  const root: FlameGraphNodeRoot = {
    name: "root",
    value: 100,
    left: 0,
    cumulativeTime: rootNode.cumulativeTime,
    children: [],
  };

  for (const node of data) {
    nodeMap[node.nodeID] = {
      name: node.moduleName,
      value: node.pcntOfSession,
      backgroundColor: giveColor(mode, node, searchPhrase),
      tooltip: `Name: ${
        node.moduleName
      } Percentage of Session: ${node.pcntOfSession.toFixed(
        2
      )}% Cumulative Time: ${node.cumulativeTime}`,
      cumulativeTime: node.cumulativeTime,
      children: [],
      left: 0,
    };

    if (node.parentID === rootNode.parentID) {
      root.children.push(nodeMap[node.nodeID]);
    } else {
      nodeMap[node.nodeID].left =
        (node.startTime - rootNode.startTime) / rootNode.cumulativeTime;

      if (!nodeMap[node.parentID].children) {
        nodeMap[node.parentID].children = [];
      }

      nodeMap[node.parentID].children.push(nodeMap[node.nodeID]);
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
