import * as React from "react";
import DataGrid, { DataGridProps, FormatterProps } from 'react-data-grid';
import { CallTree, PresentationData } from "../../../common/PresentationData";

interface IConfigProps {
  presentationData: PresentationData
}

interface TreeNode {
  id: number;
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

function ProfilerTreeView({ presentationData }: IConfigProps) {
  const [callTree, setCallTree] = React.useState(presentationData.callTree);
  const [expandedNodes, setExpandedNodes] = React.useState<number[]>([]);

  React.useEffect(() => {
    window.addEventListener("message", (event) => {
      const message = event.data as PresentationData;
      setCallTree(message.callTree);
      console.log(message.callTree);
    });
  }, []);

  const toggleExpansion = (node: TreeNode) => {
    node.expanded = !node.expanded;
    setExpandedNodes(prevExpanded => {
      if (node.expanded) {
        return [...prevExpanded, node.id];
      } else {
        return prevExpanded.filter(id => id !== node.id);
      }
    });
    setCallTree([...callTree]);
  };

  const nameFormatter = ({ row }: FormatterProps<TreeRow>) => {
    const marginLeft = row.level * 20;
    return (
      <div style={{ marginLeft }}>
        <button onClick={() => toggleExpansion(row)}>{row.expanded ? '-' : '+'}</button>
        {row.level === 0 ? <strong>{row.moduleName}</strong> : <span>{row.moduleName}</span>}
      </div>
    );
  };


  function buildTreeView(data: CallTree[]): TreeNode[] {
    const map: { [id: number]: TreeNode } = {};

    data.forEach(({ nodeID, moduleName, lineNum, numCalls, cumulativeTime, pcntOfSession }) => {
      map[nodeID] = {
        id: nodeID,
        moduleName,
        lineNum,
        numCalls,
        cumulativeTime,
        pcntOfSession,
        children: [],
      };
    });

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

  const treeData: TreeNode[] = buildTreeView(callTree);


  const columns = [
    { key: 'moduleName', name: 'Module Name', formatter: nameFormatter, minWidth: 700 },
    { key: 'lineNum', name: 'Line Number' },
    { key: 'numCalls', name: 'Number of Calls' },
    { key: 'cumulativeTime', name: 'Cumulative Time' },
    { key: 'pcntOfSession', name: '% of Session' },
  ];

  const TreeView: React.FC<{ expandedNodes: number[] }> = ({ expandedNodes }) => {
    const getFlattenedRows = (): TreeRow[] => {
      const rows: TreeRow[] = [];

      const flattenTree = (node: TreeNode, level: number) => {
        const { children, ...rest } = node;
        const isExpanded = expandedNodes.includes(node.id);

        rows.push({ ...rest, level, expanded: isExpanded });

        if (isExpanded && children) {
          children.forEach(child => flattenTree(child, level + 1));
        }
      };

      treeData.forEach(node => flattenTree(node, 0));

      return rows;
    };

    const rows = getFlattenedRows();

    return (
      <DataGrid
        defaultColumnOptions={{
          resizable: true,
        }}
        columns={columns}
        rows={rows}
        
      />
    );
  };

  return (
    <React.Fragment>
      <TreeView expandedNodes={expandedNodes} />
    </React.Fragment>
  );
}

export default ProfilerTreeView;
