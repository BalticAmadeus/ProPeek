import { CallTree, ModuleDetails } from "../../../common/PresentationData";
import { ProfilerRawData } from "../profilerRawData";

/**
 * Transforms raw profiler data into Call Tree node list
 */
export function calculateCallTree(rawData: ProfilerRawData, moduleDetailList: ModuleDetails[], totalSessionTime: number): CallTree[] {

    const callTree = [] as CallTree[];

    rawData.CallTreeData.forEach(node => {

        if (node.ModuleID !== 0) {
          let moduleDetails: ModuleDetails = moduleDetailList.find(({ moduleID }) => moduleID === node.ModuleID)!;

          let callTreeNode : CallTree = {
            nodeID        : node.NodeID,
            parentID      : node.ParentID,
            moduleName    : moduleDetails.moduleName,
            lineNum       : node.LineNum,
            numCalls      : node.NumCalls,
            cumulativeTime: node.CumulativeTime,
            pcntOfSession : Number((node.CumulativeTime / totalSessionTime * 100).toFixed(4))
          }

          callTree.push(callTreeNode);
        }
    });

    return callTree;
}
