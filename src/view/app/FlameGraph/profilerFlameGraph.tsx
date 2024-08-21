/* eslint-disable @typescript-eslint/naming-convention */
import * as React from "react";
import { CallTree, PresentationData } from "../../../common/PresentationData";
import { FlameGraph } from "react-flame-graph";
import "./profilerFlameGraph.css";
import LoadingOverlay from "../../../components/loadingOverlay/loadingOverlay";
import TimeRibbon from "./TimeRibbon";
import { Box } from "@mui/material";
import { OpenFileTypeEnum } from "../../../common/openFile";
import FileTypeSettings from "../Components/FileTypeSettings";
import { useFileTypeSettingsContext } from "../Components/FileTypeSettingsContext";

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
  moduleID: number;
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
    callTree[0]?.cumulativeTime ?? 0
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [isCtrlPressed, setIsCtrlPressed] = React.useState(false);
  const settingsContext = useFileTypeSettingsContext();

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

  React.useEffect(() => {
    const { hasXREFs, hasListings } = presentationData;
    if (hasXREFs && !hasListings) {
      settingsContext.setOpenFileType(OpenFileTypeEnum.XREF);
    } else if (!hasXREFs && hasListings) {
      settingsContext.setOpenFileType(OpenFileTypeEnum.LISTING);
    }
  }, [presentationData.hasXREFs, presentationData.hasListings]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey) {
        setIsCtrlPressed(true);
      }
    };

    const handleKeyUp = () => {
      setIsCtrlPressed(false);
    };

    const handleFocus = () => {
      setIsCtrlPressed(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("focus", handleFocus);
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

  const openFileForFlameGraph = (node: FlameGraphNode): void => {
    const foundModule = presentationData.moduleDetails.find(
      (moduleRow) => moduleRow.moduleID === node.moduleID
    )

    if(!foundModule)
      return;
    if (!foundModule.hasLink)
      return;

    switch (settingsContext.openFileType) {
      case OpenFileTypeEnum.XREF:
        vscode.postMessage({
          type: OpenFileTypeEnum.XREF,
          columns: foundModule.moduleName,
          lines: foundModule.startLineNum,
        });
        break;
      case OpenFileTypeEnum.LISTING:
        vscode.postMessage({
          type: OpenFileTypeEnum.LISTING,
          listingFile: foundModule.listingFile,
          lineNumber: foundModule.startLineNum,
        });
        break;
      }
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
        {timeRibbonEndValue > 0 && <TimeRibbon endValue={timeRibbonEndValue} />}
        <Box className={"flame-graph-container"}>
          <FileTypeSettings
            showOpenFileType={
              presentationData.hasXREFs && presentationData.hasListings
            }
          />
          <FlameGraph
            data={nestedStructure}
            height={windowHeight}
            width={windowWidth - 63}
            onDoubleClick={(node) => {
              handleNodeSelection(node.name, (node.source as FlameGraphNode).moduleID);
            }}
            onChange={(node) => {
              setTimeRibbonEndValue((node.source as FlameGraphNode).cumulativeTime)
              isCtrlPressed && openFileForFlameGraph(node.source as FlameGraphNode);
            }}
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
    cumulativeTime: rootNode?.cumulativeTime ?? 0,
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
      moduleID: node.moduleID,
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
