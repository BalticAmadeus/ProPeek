import { CallTree, ModuleDetails } from "../../../common/PresentationData";
import { ProfilerRawData } from "../profilerRawData";
import { CallTreeData } from "../raw/callTreeData";
import { TracingData } from "../raw/tracingData";

/**
 * Transforms raw profiler data into Call Tree node list using Call tree section
 */
export function calculateCallTree(rawData: ProfilerRawData, moduleDetailList: ModuleDetails[], totalSessionTime: number): CallTree[] {

    const callTree = [] as CallTree[];
    const hasTracingData: boolean = false; //rawData.TracingData.length > 0;

    let startNodeId: number = 0;
    let sortedTracingData: TracingData[] = [];

    if (hasTracingData) {
        startNodeId = rawData.CallTreeData.find(({ ModuleID }) => ModuleID === rawData.TracingData[0].ModuleID)!.NodeID;
        sortedTracingData = rawData.TracingData.sort((a, b) => a.StartTime! - b.StartTime!);
    }

    for (let node of rawData.CallTreeData) {
        if (node.NodeID >= startNodeId) {
            let moduleDetails: ModuleDetails = moduleDetailList.find(({ moduleID }) => moduleID === node.ModuleID)!;

            if (!moduleDetails) {
                console.error(`Module with ID ${node.ModuleID} not found`);
                break;
            }

            let callTreeNode: CallTree = {
                nodeID: node.NodeID,
                parentID: node.ParentID,
                moduleID: node.ModuleID,
                moduleName: moduleDetails.moduleName,
                lineNum: node.LineNum,
                numCalls: node.NumCalls,
                cumulativeTime: node.CumulativeTime,
                pcntOfSession: Number((node.CumulativeTime / totalSessionTime * 100).toFixed(4)),
                // start time is currently not supported in flame graph
                startTime: (hasTracingData ? findStartTime(node, startNodeId, sortedTracingData) : undefined)
            }

            callTree.push(callTreeNode);
        }
    }

    if (callTree[0].moduleID === 0) callTree.splice(0, 1);

    return callTree;
}

/**
 * Finds start time of the node in Tracing Data section
 */
export function findStartTime(node: CallTreeData, startNodeId: number, sortedTracingData: TracingData[]): number {

    let tracingLineIndex: number;

    if (node.NodeID === startNodeId) {
        tracingLineIndex = 0;
    } else {
        tracingLineIndex = sortedTracingData.findIndex(({ ModuleID, LineNo }) => node.ModuleID === ModuleID && LineNo === 0)!;
    }

    const startTime: number = sortedTracingData[tracingLineIndex].StartTime;

    sortedTracingData = sortedTracingData.splice(tracingLineIndex, 1);

    return startTime;
}

/**
 * Transforms raw profiler data into Call Tree node list using Tracing data section
 * Used for profiler version 1 where Call Tree section doesn't exist
 */
export function calculateCallTreeByTracingData(rawData: ProfilerRawData, moduleDetailList: ModuleDetails[]): CallTree[] {

    let callTree = [] as CallTree[];
    let tracingData = rawData.TracingData;

    //tracing data section is optional, so no call tree in case it's empty
    if (tracingData.length === 0) return callTree;

    callTree = startTree(tracingData, moduleDetailList);

    const totalSessionTime = callTree[0].cumulativeTime;

    tracingData = tracingData.slice().reverse();

    for (let index = 0; index < tracingData.length; index++) {
        //every node always starts with line 0
        if (tracingData[index].LineNo === 0 && tracingData[index + 1].LineNo !== 0) {
            pushNode(callTree, tracingData, index, moduleDetailList, totalSessionTime);
        }
    }

    callTree.sort((a, b) => a.startTime! - b.startTime!);

    return callTree;
}

/**
 * Creates Call Tree and pushes first node of the tree based on Tracing data
 */
export function startTree(tracingData: TracingData[], moduleDetailList: ModuleDetails[]): CallTree[] {

    let callTree = [] as CallTree[];

    const moduleDetails: ModuleDetails = moduleDetailList.find(({ moduleID }) => moduleID === tracingData[0].ModuleID)!;

    const node: CallTree = {
        nodeID: 1,
        parentID: 0,
        moduleID: moduleDetails.moduleID,
        moduleName: moduleDetails.moduleName,
        cumulativeTime: Number((tracingData[tracingData.length - 1].StartTime - tracingData[0].StartTime).toFixed(6)),
        startTime: tracingData[0].StartTime,
        pcntOfSession: 100
    }

    callTree.push(node);

    return callTree;
}

/**
 * Pushes a new node into the call tree
 */
export function pushNode(callTree: CallTree[], tracingData: TracingData[], index: number, moduleDetailList: ModuleDetails[], totalSessionTime: number): CallTree[] {

    const moduleDetails: ModuleDetails = moduleDetailList.find(({ moduleID }) => moduleID === tracingData[index].ModuleID)!;
    const currStartTime: number = tracingData[index].StartTime;
    const parentModuleId = tracingData[index - 1].ModuleID;
    const parent = callTree.sort((a, b) => b.startTime! - a.startTime!).find(({ moduleID, startTime }) => moduleID === parentModuleId && startTime! <= currStartTime);

    if (!parent) return callTree;

    let cumulativeTime: number = tracingData[index].ActualTime;

    // adjusting cumulative time as it initially doesn't include time of child nodes
    for (let childIndex = index + 1; childIndex < tracingData.length; childIndex++) {
        const cumulativeTimeFromChild = tracingData[childIndex].StartTime + tracingData[childIndex].ActualTime - currStartTime;

        if (cumulativeTimeFromChild > cumulativeTime) {
            cumulativeTime = Number(cumulativeTimeFromChild.toFixed(6));
        }
    }

    const node: CallTree = {
        nodeID: callTree.length + 1,
        parentID: parent!.nodeID,
        moduleID: moduleDetails.moduleID,
        moduleName: moduleDetails.moduleName,
        cumulativeTime: cumulativeTime,
        startTime: currStartTime,
        pcntOfSession: Number((cumulativeTime / totalSessionTime * 100).toFixed(6))
    }

    callTree.push(node);

    return callTree;
}
