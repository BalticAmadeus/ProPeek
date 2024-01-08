import { CallTree, ModuleDetails } from "../../../common/PresentationData";
import { ParserLogger } from "../ParserLogger";
import { ProfilerRawData } from "../profilerRawData";
import { TracingData } from "../raw/tracingData";

/**
 * Transforms raw profiler data into Call Tree node list using Call tree section
 */
export function calculateCallTree(rawData: ProfilerRawData, moduleDetailList: ModuleDetails[], totalSessionTime: number): CallTree[] {

    const callTree = [] as CallTree[];

    for (let node of rawData.CallTreeData) {
        let moduleDetails: ModuleDetails = moduleDetailList.find(({ moduleID }) => moduleID === node.ModuleID)!;

        if (!moduleDetails) {
            ParserLogger.logError(`Module with ID ${node.ModuleID} not found`);
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
        }

        callTree.push(callTreeNode);
    }

    if (callTree[0].moduleID === 0) callTree.splice(0, 1);

    return callTree;
}

/**
 * Used to keep track of the current and parent nodes for the call tree
 * Only when calculating by Tracing Data, needed for performance reasons
 */
export interface CallTreeStack {
    NodeID: number,
    ModuleID: number,
    StartTime: number
}

/**
 * Transforms raw profiler data into Call Tree node list using Tracing data section
 * Used for profiler version 1 where Call Tree section doesn't exist
 * or in case start time of each node is needed
 */
export function calculateCallTreeByTracingData(rawData: ProfilerRawData, moduleDetailList: ModuleDetails[]): CallTree[] {

    const callTreeStack: CallTreeStack[] = [];
    let callTree: CallTree[] = [];

    //tracing data section is optional, so no call tree in case it's empty
    if (rawData.TracingData.length === 0) return callTree;

    //root node is calculated differently from the rest
    callTree = startTree(rawData.TracingData, moduleDetailList, callTreeStack);

    const totalSessionTime = callTree[0].cumulativeTime;
    const reversedTracingData = rawData.TracingData.slice().reverse();

    for (let index = 0; index < reversedTracingData.length; index++) {
        //every node always starts with line 0
        if (reversedTracingData[index].LineNo === 0) {
            pushNode(callTree, reversedTracingData, index, moduleDetailList, totalSessionTime, callTreeStack);
        }
    }

    return callTree;
}

/**
 * Creates Call Tree and Stack and pushes root node based on Tracing data
 */
export function startTree(tracingData: TracingData[], moduleDetailList: ModuleDetails[], callTreeStack: CallTreeStack[]): CallTree[] {

    const callTree: CallTree[] = [];
    const moduleDetails: ModuleDetails = moduleDetailList.find(({ moduleID }) => moduleID === tracingData[0].ModuleID)!;

    const node: CallTree = {
        nodeID: 1,
        parentID: 0,
        moduleID: moduleDetails.moduleID,
        moduleName: moduleDetails.moduleName,
        cumulativeTime: Number(getAdjustedCumulativeTime(tracingData, 0).toFixed(6)),
        startTime: tracingData[0].StartTime,
        pcntOfSession: 100
    }

    callTree.push(node);

    callTreeStack.push({
        ModuleID: moduleDetails.moduleID,
        NodeID: 1,
        StartTime: tracingData[0].StartTime
    });

    //in case the last tracing line is not of the root Module, add a dummy line at the end
    if (tracingData[tracingData.length - 1].ModuleID !== tracingData[0].ModuleID) {
        const dummyTracingLine: TracingData = { ...tracingData[0], LineNo: 1 };

        tracingData.push(dummyTracingLine);
    }

    return callTree;
}

/**
 * Pushes a new node into the call tree
 */
export function pushNode(callTree: CallTree[], tracingData: TracingData[], index: number, moduleDetailList: ModuleDetails[], totalSessionTime: number, callTreeStack: CallTreeStack[]): CallTree[] {

    const { ModuleID, StartTime } = tracingData[index];
    const moduleDetails: ModuleDetails = moduleDetailList.find(({ moduleID }) => moduleID === ModuleID)!;

    if (!moduleDetails) {
        ParserLogger.logError(`Module with ID ${ModuleID} not found`);
        return callTree;
    }

    const parentModuleId: number = getParentModuleId(tracingData, index);

    // if the current stack element is not the parent node, pop the stack until it's found
    while (callTreeStack[callTreeStack.length - 1].ModuleID !== parentModuleId || callTreeStack[callTreeStack.length - 1].StartTime > StartTime) {
        callTreeStack.pop();
    }

    callTreeStack.push({
        ModuleID: ModuleID,
        NodeID: callTree.length + 1,
        StartTime: StartTime
    });

    const cumulativeTime: number = Number(getAdjustedCumulativeTime(tracingData, index).toFixed(6));

    const node: CallTree = {
        nodeID: callTree.length + 1,
        parentID: callTreeStack[callTreeStack.length - 2].NodeID,
        moduleID: ModuleID,
        moduleName: moduleDetails.moduleName,
        cumulativeTime: cumulativeTime,
        startTime: StartTime,
        pcntOfSession: Number((cumulativeTime / totalSessionTime * 100).toFixed(4))
    }

    callTree.push(node);

    return callTree;
}

/**
 * Get ModuleID of parent node
 */
export function getParentModuleId(tracingData: TracingData[], index: number): number {

    const startTime: number = tracingData[index].StartTime;
    let parentModuleId: number = tracingData[index - 1].ModuleID;

    for (let parentIndex = index - 1; parentIndex >= 0; parentIndex--) {
        parentModuleId = tracingData[parentIndex].ModuleID;
        if (tracingData[parentIndex].StartTime < startTime) break;
    }

    return parentModuleId
}

/**
 * Get adjusted cumulative time for specific tracing data node, as 'ActualTime' doesn't include time of child nodes
 */
export function getAdjustedCumulativeTime(tracingData: TracingData[], index: number): number {

    const startTime: number = tracingData[index].StartTime;
    let cumulativeTime: number = tracingData[index].ActualTime;
    let latestChildStartTime: number = startTime;

    for (let childIndex = index + 1; childIndex < tracingData.length; childIndex++) {
        if (tracingData[childIndex].StartTime < startTime) break;

        if (tracingData[childIndex].StartTime > latestChildStartTime) {
            latestChildStartTime = tracingData[childIndex].StartTime;

            cumulativeTime = latestChildStartTime + tracingData[childIndex].ActualTime - startTime;
        }
    }

    return cumulativeTime;
}
