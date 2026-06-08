import * as React from "react";
import { useMemo, useState } from "react";
import { PresentationData } from "../../../common/PresentationData";
import ForceGraph2D from "react-force-graph-2d";
import { alpha, Box, useTheme } from "@mui/material";
import FloatingSettingsPanel, {
  RelationshipLevel,
  DisplayThreshold,
  NodeMetricMode,
} from "./relationshipGraphSettings";
import SelectedNodeInfoPanel from "./selectedNodeInfoPanel";
import GraphStatsPanel from "./graphStatsPanel";

const TOP_SECTION_HEIGHT = 80;

interface NodeType {
  id: string;
  x?: number;
  y?: number;
  name?: string;
  neighbors?: NodeType[];
  links?: LinkType[];
  callCount?: number;
  sessionPercent?: number;
  avgTimePerCall?: number;
  totalTime?: number;
  timesCalled?: number;
}

interface LinkType {
  source: string;
  target: string;
  value?: number;
}

interface GraphData {
  nodes: Array<NodeType>;
  links: Array<LinkType>;
}

interface IConfigProps {
  presentationData: PresentationData;
}

function createEmptyNode(id: string): NodeType {
  return {
    id,
    name: id,
    neighbors: [],
    links: [],
    callCount: 0,
    sessionPercent: 0,
    avgTimePerCall: 0,
    totalTime: 0,
    timesCalled: 0,
  };
}

function getFileLevelName(moduleName: string): string {
  const trimmed = moduleName.trim();
  const parts = trimmed.split(/\s+/);
  return parts[parts.length - 1] || trimmed;
}

function getPackageLevelName(moduleName: string): string {
  const fileLevelName = getFileLevelName(moduleName).trim();
  const normalized = fileLevelName.replace(/\\/g, "/");

  const lastSlashIndex = normalized.lastIndexOf("/");
  if (lastSlashIndex > 0) {
    return normalized.slice(0, lastSlashIndex);
  }

  const knownExtensions = new Set(["p", "w", "cls", "i", "r", "t"]);
  const parts = normalized.split(".");

  if (parts.length === 2 && knownExtensions.has(parts[1].toLowerCase())) {
    return "(root)";
  }

  if (
    parts.length >= 3 &&
    knownExtensions.has(parts[parts.length - 1].toLowerCase())
  ) {
    return parts.slice(0, -2).join(".") || "(root)";
  }

  if (parts.length >= 2) {
    return parts.slice(0, -1).join(".") || "(root)";
  }

  return "(root)";
}

function getNodeNameForLevel(
  moduleName: string,
  level: RelationshipLevel,
): string {
  switch (level) {
    case "method":
      return moduleName.trim();
    case "class":
      return getFileLevelName(moduleName);
    case "package":
      return getPackageLevelName(moduleName);
    default:
      return moduleName.trim();
  }
}

function computePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (index - lower) * (sorted[upper] - sorted[lower]);
}

function transformPresentationDataToGraphData(
  data: PresentationData,
  level: RelationshipLevel,
): GraphData {
  const nodeMap = new Map<string, NodeType>();
  const linkMap = new Map<string, LinkType>();

  // Build nodes and aggregate moduleDetails metrics
  data.moduleDetails.forEach((moduleDetail) => {
    const nodeName = getNodeNameForLevel(moduleDetail.moduleName, level);

    if (!nodeMap.has(nodeName)) {
      nodeMap.set(nodeName, createEmptyNode(nodeName));
    }

    const node = nodeMap.get(nodeName)!;
    const timesCalled = moduleDetail.timesCalled || 0;
    const avgTimePerCall = moduleDetail.avgTimePerCall || 0;
    const totalTime = moduleDetail.totalTime || 0;
    const sessionPercent = moduleDetail.pcntOfSession || 0;

    node.callCount = (node.callCount || 0) + timesCalled;
    node.timesCalled = (node.timesCalled || 0) + timesCalled;
    node.totalTime = (node.totalTime || 0) + totalTime;
    node.sessionPercent = (node.sessionPercent || 0) + sessionPercent;

    // temporary weighted sum
    node.avgTimePerCall =
      (node.avgTimePerCall || 0) + avgTimePerCall * timesCalled;
  });

  // Finalize weighted avgTimePerCall
  nodeMap.forEach((node) => {
    const timesCalled = node.timesCalled || 0;
    node.avgTimePerCall =
      timesCalled > 0 ? (node.avgTimePerCall || 0) / timesCalled : 0;
  });

  // Build links from calledModules
  data.calledModules.forEach((call) => {
    const sourceName = getNodeNameForLevel(call.callerModuleName, level);
    const targetName = getNodeNameForLevel(call.calleeModuleName, level);

    if (!nodeMap.has(sourceName)) {
      nodeMap.set(sourceName, createEmptyNode(sourceName));
    }

    if (!nodeMap.has(targetName)) {
      nodeMap.set(targetName, createEmptyNode(targetName));
    }

    const linkKey = `${sourceName}-->${targetName}`;
    const existingLink = linkMap.get(linkKey);

    if (existingLink) {
      existingLink.value = (existingLink.value || 0) + (call.timesCalled || 1);
    } else {
      linkMap.set(linkKey, {
        source: sourceName,
        target: targetName,
        value: call.timesCalled || 1,
      });
    }
  });

  const nodes = Array.from(nodeMap.values());
  const links = Array.from(linkMap.values());

  // Build neighbors and links references
  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  links.forEach((link) => {
    const a = nodeById.get(link.source);
    const b = nodeById.get(link.target);

    if (!a || !b) {
      return;
    }

    a.neighbors?.push(b);
    b.neighbors?.push(a);
    a.links?.push(link);
    b.links?.push(link);
  });

  return { nodes, links };
}

function computeNodeSize(
  metric: number,
  minMetric: number,
  maxMetric: number,
  minSize = 5,
  maxSize = 30,
): number {
  if (maxMetric === minMetric) {
    return maxSize;
  }

  const scaled = (metric - minMetric) / (maxMetric - minMetric);
  return minSize + scaled * (maxSize - minSize);
}

function getNodeMetricValue(
  node: NodeType,
  metricMode: NodeMetricMode,
): number {
  switch (metricMode) {
    case "connections":
      return node.neighbors?.length || 0;
    case "calls":
      return node.callCount || 0;
    case "sessionPercent":
      return node.sessionPercent || 0;
    case "avgTimePerCall":
      return node.avgTimePerCall || 0;
    default:
      return 0;
  }
}

function getNodeSizes(
  nodes: NodeType[],
  metricMode: NodeMetricMode,
  minSize = 5,
  maxSize = 30,
): Record<string, number> {
  const metricValues = nodes.map((node) =>
    getNodeMetricValue(node, metricMode),
  );

  let minMetric = Infinity;
  let maxMetric = -Infinity;

  metricValues.forEach((metric) => {
    if (metric < minMetric) {
      minMetric = metric;
    }
    if (metric > maxMetric) {
      maxMetric = metric;
    }
  });

  const sizes: Record<string, number> = {};
  nodes.forEach((node) => {
    sizes[node.id] = computeNodeSize(
      getNodeMetricValue(node, metricMode),
      minMetric,
      maxMetric,
      minSize,
      maxSize,
    );
  });

  return sizes;
}

function getNodeSizeThreshold(displayThreshold: DisplayThreshold): number {
  switch (displayThreshold) {
    case "low":
      return 60;
    case "medium":
      return 80;
    case "high":
      return 93;
    case "none":
    default:
      return 0;
  }
}

function getMaxNeighborsToExpand(displayThreshold: DisplayThreshold): number {
  switch (displayThreshold) {
    case "low":
      return 3;
    case "medium":
      return 2;
    case "high":
      return 1;
    default:
      return 5;
  }
}

function rebuildGraphData(graphData: GraphData): GraphData {
  const nodes = graphData.nodes.map((node) => ({
    id: node.id,
    x: node.x,
    y: node.y,
    name: node.name,
    neighbors: [] as NodeType[],
    links: [] as LinkType[],
    callCount: node.callCount || 0,
    sessionPercent: node.sessionPercent || 0,
    avgTimePerCall: node.avgTimePerCall || 0,
    totalTime: node.totalTime || 0,
    timesCalled: node.timesCalled || 0,
  }));

  const links = graphData.links.map((link) => ({
    source: link.source,
    target: link.target,
    value: link.value,
  }));

  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  links.forEach((link) => {
    const a = nodeById.get(link.source);
    const b = nodeById.get(link.target);

    if (!a || !b) {
      return;
    }

    a.neighbors?.push(b);
    b.neighbors?.push(a);
    a.links?.push(link);
    b.links?.push(link);
  });

  return { nodes, links };
}

function filterGraphDataByCoreNodesAndNeighbors(
  graphData: GraphData,
  metricValues: Record<string, number>,
  nodeSizes: Record<string, number>,
  displayThreshold: DisplayThreshold,
): GraphData {
  if (displayThreshold === "none") {
    return rebuildGraphData(graphData);
  }

  const rawValues = Object.values(metricValues);
  if (rawValues.length === 0) {
    return rebuildGraphData(graphData);
  }

  const percentile = getNodeSizeThreshold(displayThreshold);
  const minMetricRequired = computePercentile(rawValues, percentile);

  const keptNodeIds = new Set<string>();

  // Keep all core nodes above the percentile cutoff
  graphData.nodes.forEach((node) => {
    if ((metricValues[node.id] ?? 0) >= minMetricRequired) {
      keptNodeIds.add(node.id);
    }
  });

  // Keep direct neighbors of core nodes,
  // but if there are too many, keep only the top N by node size
  const maxNeighbors = getMaxNeighborsToExpand(displayThreshold);

  graphData.nodes.forEach((node) => {
    if (!keptNodeIds.has(node.id)) {
      return;
    }

    const neighbors = node.neighbors || [];

    const neighborsToKeep =
      neighbors.length > maxNeighbors
        ? [...neighbors]
            .sort((a, b) => (nodeSizes[b.id] || 0) - (nodeSizes[a.id] || 0))
            .slice(0, maxNeighbors)
        : neighbors;

    neighborsToKeep.forEach((neighbor) => {
      keptNodeIds.add(neighbor.id);
    });
  });

  // Keep only selected nodes
  const nodes = graphData.nodes
    .filter((node) => keptNodeIds.has(node.id))
    .map((node) => ({
      ...node,
      neighbors: [],
      links: [],
    }));

  // Keep original links where both endpoints are kept
  const linkMap = new Map<string, LinkType>();

  graphData.links.forEach((link) => {
    if (keptNodeIds.has(link.source) && keptNodeIds.has(link.target)) {
      const key = `${link.source}-->${link.target}`;
      linkMap.set(key, { ...link });
    }
  });

  // Reconnect across one removed node
  const removedNodes = graphData.nodes.filter(
    (node) => !keptNodeIds.has(node.id),
  );

  removedNodes.forEach((removedNode) => {
    const incomingFromKept = graphData.links.filter(
      (link) => link.target === removedNode.id && keptNodeIds.has(link.source),
    );

    const outgoingToKept = graphData.links.filter(
      (link) => link.source === removedNode.id && keptNodeIds.has(link.target),
    );

    incomingFromKept.forEach((inLink) => {
      outgoingToKept.forEach((outLink) => {
        if (inLink.source === outLink.target) {
          return;
        }

        const key = `${inLink.source}-->${outLink.target}`;
        const existing = linkMap.get(key);
        const newValue = Math.max(inLink.value || 1, outLink.value || 1);

        if (existing) {
          existing.value = Math.max(existing.value || 1, newValue);
        } else {
          linkMap.set(key, {
            source: inLink.source,
            target: outLink.target,
            value: newValue,
          });
        }
      });
    });
  });

  const links = Array.from(linkMap.values());

  return rebuildGraphData({ nodes, links });
}

function ProfilerRelationshipGraph2D({ presentationData }: IConfigProps) {
  const NODE_R = 2;
  const theme = useTheme();

  const [relationshipLevel, setRelationshipLevel] =
    useState<RelationshipLevel>("method");
  const [displayThreshold, setDisplayThreshold] =
    useState<DisplayThreshold>("none");
  const [NodeMetricMode, setNodeMetricMode] =
    useState<NodeMetricMode>("sessionPercent");

  const [highlightNodes, setHighlightNodes] = useState<Set<NodeType>>(
    new Set(),
  );
  const [highlightLinks, setHighlightLinks] = useState<Set<LinkType>>(
    new Set(),
  );
  const [hoverNode, setHoverNode] = useState<NodeType | null>(null);
  const [pinnedNode, setPinnedNode] = useState<NodeType | null>(null);

  const totalSessionTime = useMemo(() => {
    return presentationData.moduleDetails.reduce(
      (sum, moduleDetail) => sum + (moduleDetail.totalTime || 0),
      0,
    );
  }, [presentationData]);

  const rawGraphData = useMemo(
    () =>
      rebuildGraphData(
        transformPresentationDataToGraphData(
          presentationData,
          relationshipLevel,
        ),
      ),
    [presentationData, relationshipLevel],
  );

  const rawNodeSizes = useMemo(
    () => getNodeSizes(rawGraphData.nodes, NodeMetricMode, 2, 40),
    [rawGraphData, NodeMetricMode],
  );

  const rawMetricValues = useMemo(() => {
    const values: Record<string, number> = {};
    rawGraphData.nodes.forEach((node) => {
      values[node.id] = getNodeMetricValue(node, NodeMetricMode);
    });
    return values;
  }, [rawGraphData, NodeMetricMode]);

  const graphData = useMemo(
    () =>
      filterGraphDataByCoreNodesAndNeighbors(
        rawGraphData,
        rawMetricValues,
        rawNodeSizes,
        displayThreshold,
      ),
    [rawGraphData, rawMetricValues, rawNodeSizes, displayThreshold],
  );

  const nodeSizes = useMemo(
    () => getNodeSizes(graphData.nodes, NodeMetricMode, 2, 40),
    [graphData, NodeMetricMode],
  );

  const coreNodeCounts = useMemo(() => {
    const counts: Record<DisplayThreshold, number> = {
      none: rawGraphData.nodes.length,
      low: 0,
      medium: 0,
      high: 0,
    };
    (["low", "medium", "high"] as const).forEach((t) => {
      counts[t] = filterGraphDataByCoreNodesAndNeighbors(
        rawGraphData,
        rawMetricValues,
        rawNodeSizes,
        t,
      ).nodes.length;
    });
    return counts;
  }, [rawGraphData, rawMetricValues, rawNodeSizes]);

  React.useEffect(() => {
    setHoverNode(null);
    setPinnedNode(null);
    setHighlightNodes(new Set());
    setHighlightLinks(new Set());
  }, [graphData]);

  const applyHighlightForNode = (node: NodeType | null) => {
    const newHighlightNodes = new Set<NodeType>();
    const newHighlightLinks = new Set<LinkType>();

    if (node) {
      newHighlightNodes.add(node);
      node.neighbors?.forEach((neighbor) => newHighlightNodes.add(neighbor));
      node.links?.forEach((link) => newHighlightLinks.add(link));
    }

    setHighlightNodes(newHighlightNodes);
    setHighlightLinks(newHighlightLinks);
    setHoverNode(node);
  };

  const handleNodeHover = (node: NodeType | null) => {
    if (pinnedNode) {
      return;
    }
    applyHighlightForNode(node);
  };

  const handleNodeClick = (node: NodeType) => {
    setPinnedNode(node);
    applyHighlightForNode(node);
  };

  const handleBackgroundClick = () => {
    setPinnedNode(null);
    setHoverNode(null);
    setHighlightNodes(new Set());
    setHighlightLinks(new Set());
  };

  const getFactoredOpacity = (node: NodeType | undefined): number => {
    if (!node) {
      return 0;
    }

    const factoredOpacity = Math.sqrt((nodeSizes[node.id] ?? 2) / 15);
    const minOpacity = 0.4;

    if (factoredOpacity > 1) {
      return 1;
    }
    if (factoredOpacity < minOpacity) {
      return minOpacity;
    }

    return factoredOpacity;
  };

  return (
    <Box
      className="profiler-relationship-graph-wrapper"
      sx={{
        width: "100%",
        height: `calc(100vh - ${TOP_SECTION_HEIGHT}px)` /* this is needed to remove vertical scrollbar */,
        overflow: "hidden" /* this is needed to remove horizontal scrollbar */,
      }}
    >
      <GraphStatsPanel
        totalSessionTime={totalSessionTime}
        nodeCount={graphData.nodes.length}
        linkCount={graphData.links.length}
      />
      <FloatingSettingsPanel
        relationshipLevel={relationshipLevel}
        onRelationshipLevelChange={setRelationshipLevel}
        displayThreshold={displayThreshold}
        onDisplayThresholdChange={setDisplayThreshold}
        nodeMetricMode={NodeMetricMode}
        onNodeMetricModeChange={setNodeMetricMode}
        coreNodeCounts={coreNodeCounts}
      />

      <SelectedNodeInfoPanel selectedNode={pinnedNode} />

      <ForceGraph2D
        key={`${relationshipLevel}-${displayThreshold}-${NodeMetricMode}`}
        graphData={graphData}
        nodeLabel="name"
        nodeVal={(node) => nodeSizes[node.id] ?? 2}
        nodeRelSize={NODE_R}
        onNodeHover={handleNodeHover}
        nodeColor={(node) => {
          const alphaOpacity = getFactoredOpacity(node);
          let color = alpha(theme.palette.primary.main, alphaOpacity);

          if (alphaOpacity > 0.85) {
            color = alpha(theme.palette.primary.light, alphaOpacity);
          }

          if (node === hoverNode) {
            color = theme.palette.error.main;
          } else if (highlightNodes.has(node)) {
            color = alpha(theme.palette.warning.main, alphaOpacity);
          }

          return color;
        }}
        linkDirectionalArrowLength={7}
        linkDirectionalArrowRelPos={1}
        linkColor={(link) =>
          alpha(
            theme.palette.text.secondary,
            highlightLinks.has(link as LinkType) ? 0.6 : 0.2,
          )
        }
        onNodeClick={handleNodeClick}
        onBackgroundClick={handleBackgroundClick}
      />
    </Box>
  );
}

export default ProfilerRelationshipGraph2D;
