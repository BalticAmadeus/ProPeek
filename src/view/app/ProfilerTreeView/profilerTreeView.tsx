import * as React from "react";
import DataGrid, { FormatterProps } from "react-data-grid";
import { CallTree, PresentationData } from "../../../common/PresentationData";
import "./profilerTreeView.css";
import { Button } from "@mui/material";

interface IConfigProps {
  presentationData: PresentationData;
  handleNodeSelection: any;
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
}: IConfigProps) {
  const [callTree, setCallTree] = React.useState(presentationData.callTree);
  const [expandedNodes, setExpandedNodes] = React.useState<number[]>([]);

  React.useEffect(() => {
    window.addEventListener("message", (event) => {
      const message = event.data as PresentationData;
      setCallTree(message.callTree);
    });
  }, []);

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
      />
    </React.Fragment>
  );
}

const TreeView: React.FC<{
  rows: TreeRow[];
  toggleExpansion: (node: TreeNode) => void;
  handleNodeSelection: (moduleName: string, selectedModuleId: number) => void;
}> = React.memo(({ rows, toggleExpansion, handleNodeSelection }) => {
  const nameFormatter = ({ row }: FormatterProps<TreeRow>) => {
    const marginLeft = row.level * 20;
    return (
      <div style={{ marginLeft }}>
        <button onClick={() => toggleExpansion(row)}>
          {row.expanded ? "-" : "+"}
        </button>
        {row.level === 0 ? (
          <strong>{row.moduleName}</strong>
        ) : (
          <span>{row.moduleName}</span>
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
        return (
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <progress value={progress} max={100} style={{ width: "100%" }} />
            </div>
            <div style={{ marginLeft: 5 }}>{`${progress.toFixed(2)}%`}</div>
          </div>
        );
      },
    },
  ];

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
          onRowDoubleClick={(row) => {
            handleNodeSelection(row.moduleName, row.moduleID);
          }}
        />
      </div>
    </React.Fragment>
  );
});

export default ProfilerTreeView;
