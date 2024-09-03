import * as React from "react";
import DataGrid, { FormatterProps } from "react-data-grid";
import PercentageFill from "../Components/PercentageBar/PercentageFill";
import { CallTree, PresentationData } from "../../../common/PresentationData";
import { Button } from "@mui/material";
import { OpenFileTypeEnum } from "../../../common/openFile";
import { useFileTypeSettingsContext } from "../Components/FileTypeSettingsContext";
import "./profilerTreeView.css";

interface IConfigProps {
  presentationData: PresentationData;
  handleNodeSelection: any;
  vscode: any;
}

interface TreeNode {
  id: number;
  moduleID: number;
  moduleName: string;
  lineNum: number;
  numCalls: number;
  cumulativeTime: number;
  pcntOfSession: number;
  children?: TreeNode[];
  expanded?: boolean;
}

interface TreeRow extends TreeNode {
  level: number;
}

function buildTreeView(data: CallTree[]): TreeNode[] {
  const map: { [id: number]: TreeNode } = {};

  data.forEach(
    ({
      nodeID,
      moduleID,
      moduleName,
      lineNum,
      numCalls,
      cumulativeTime,
      pcntOfSession,
    }) => {
      map[nodeID] = {
        id: nodeID,
        moduleID,
        moduleName,
        lineNum,
        numCalls,
        cumulativeTime,
        pcntOfSession,
        children: [],
      };
    }
  );

  const treeView: TreeNode[] = [];

  data.forEach(({ nodeID, parentID }) => {
    const node = map[nodeID];
    const parentNode = map[parentID];

    if (parentNode) {
      parentNode.children.push(node);
    } else {
      treeView.push(node);
    }
  });

  return treeView;
}

function ProfilerTreeView({
  presentationData,
  handleNodeSelection,
  vscode,
}: IConfigProps) {
  const [callTree, setCallTree] = React.useState(presentationData.callTree);
  const [expandedNodes, setExpandedNodes] = React.useState<number[]>([]);
  const settingsContext = useFileTypeSettingsContext();

  React.useEffect(() => {
    window.addEventListener("message", (event) => {
      const message = event.data as PresentationData;
      setCallTree(message.callTree);
    });
  }, []);

  React.useEffect(() => {
    const { hasXREFs, hasListings } = presentationData;
    if (hasXREFs && !hasListings) {
      settingsContext.setOpenFileType(OpenFileTypeEnum.XREF);
    } else if (!hasXREFs && hasListings) {
      settingsContext.setOpenFileType(OpenFileTypeEnum.LISTING);
    }
  }, [presentationData.hasXREFs, presentationData.hasListings]);

  const openFileForTreeView = (row: TreeRow): void => {
    const foundModule = presentationData.moduleDetails.find(
      (moduleRow) => moduleRow.moduleID === row.moduleID
    );

    if (!foundModule?.hasLink) return;

    vscode.postMessage({
      type: settingsContext.openFileType,
      name: foundModule.moduleName,
      listingFile: foundModule?.listingFile,
      lineNumber: foundModule.startLineNum,
    });
  };

  const toggleExpansion = (node: TreeNode | null = null) => {
    if (node) {
      // Toggle expansion of a specific node
      node.expanded = !node.expanded;
      setExpandedNodes((prevExpanded) =>
        node.expanded
          ? [...prevExpanded, node.id]
          : prevExpanded.filter((id) => id !== node.id)
      );
    } else {
      // Collapse all nodes
      setExpandedNodes([]);
    }
  };

  const treeData: TreeNode[] = buildTreeView(callTree);

  const getFlattenedRows = (): TreeRow[] => {
    const rows: TreeRow[] = [];

    const flattenTree = (node: TreeNode, level: number) => {
      const { children, ...rest } = node;
      const isExpanded = expandedNodes.includes(node.id);

      rows.push({ ...rest, level, expanded: isExpanded });

      if (isExpanded && children) {
        children.forEach((child) => flattenTree(child, level + 1));
      }
    };

    treeData.forEach((node) => flattenTree(node, 0));

    return rows;
  };
  const rows = getFlattenedRows();

  return (
    <React.Fragment>
      <div className="collapse-button">
        <Button
          variant="outlined"
          size="small"
          onClick={() => toggleExpansion(null)}
        >
          Collapse All
        </Button>
      </div>
      <TreeView
        rows={rows}
        toggleExpansion={toggleExpansion}
        handleNodeSelection={handleNodeSelection}
        handleOnClick={(row) => openFileForTreeView(row)}
      />
    </React.Fragment>
  );
}

const TreeView: React.FC<{
  rows: TreeRow[];
  toggleExpansion: (node: TreeNode) => void;
  handleNodeSelection: (moduleName: string, selectedModuleId: number) => void;
  handleOnClick: (row: TreeRow) => void;
}> = React.memo(
  ({ rows, toggleExpansion, handleNodeSelection, handleOnClick }) => {

    const [isCtrlPressed, setIsCtrlPressed] = React.useState(false);

    const nameFormatter = ({ row }: FormatterProps<TreeRow>) => {
      const marginLeft = row.level * 20;
      return (
        <div style={{ marginLeft, background: "none" }}>
          <button
            className="expansionButton"
            onClick={() => toggleExpansion(row)}
            style={{
              color: row.expanded
                ? "var(--vscode-button-background)"
                : "var(--vscode-button-foreground)",
              border: `1px solid var(--vscode-button-hoverBackground)`,
              backgroundColor: row.expanded
                ? "transparent"
                : "var(--vscode-button-hoverBackground)",
            }}
          >
            {row.expanded ? "-" : "+"}
          </button>
          {row.level === 0 ? (
            <strong className="moduleName">{row.moduleName}</strong>
          ) : (
            <span className="moduleName">{row.moduleName}</span>
          )}
        </div>
      );
    };

    const columns = [
      {
        key: "moduleName",
        name: "Module Name",
        formatter: nameFormatter,
        minWidth: 700,
      },
      { key: "numCalls", name: "Number of Calls" },
      { key: "cumulativeTime", name: "Cumulative Time" },
      {
        key: "pcntOfSession",
        name: "% of Session",
        formatter: ({ row }: FormatterProps<TreeRow>) => {
          const progress = row.pcntOfSession;
          return <PercentageFill value={progress} />;
        },
      },
    ];
    
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

    return (
      <React.Fragment>
        <div className="treeview">
          <div className="grid-name">TreeView</div>
          <DataGrid
            className="treeHeight"
            defaultColumnOptions={{
              resizable: true,
            }}
            columns={columns}
            rows={rows}
            onRowClick={(row) => isCtrlPressed && handleOnClick(row)}
            onRowDoubleClick={(row) =>
              handleNodeSelection(row.moduleName, row.moduleID)
            }
          />
        </div>
      </React.Fragment>
    );
  }
);

export default ProfilerTreeView;
