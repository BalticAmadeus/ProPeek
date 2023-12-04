export interface CalledModules {
    callerID: number,
    calleeID: number,
    callerModuleName: string,
    calleeModuleName: string,
    timesCalled: number,
    calleeTotalTimesCalled: number,
    callerPcntOfSession: number,
    calleePcntOfSession: number
}

export interface LineSummary {
    moduleID: number,
    lineNumber: number,
    timesCalled: number,
    avgTime: number,
    totalTime: number
}

export interface ModuleDetails {
    moduleID: number,
    moduleName: string,
    timesCalled: number,
    avgTimePerCall?: number,
    totalTime: number,
    pcntOfSession?: number
}

export interface CallTree {
    nodeID: number,
    parentID: number,
    moduleID: number,
    moduleName: string,
    lineNum?: number,
    numCalls?: number,
    startTime?: number,
    cumulativeTime: number,
    pcntOfSession: number
}

export interface PresentationData {
    moduleDetails: ModuleDetails[],
    calledModules: CalledModules[],
    lineSummary: LineSummary[],
    callTree: CallTree[]
}