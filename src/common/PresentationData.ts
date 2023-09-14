export interface CalledModules {
    moduleID: number,
    calledModuleName?: string,
    timesCalled: number,
    totalTimesCalled: number,
    pcntOfSession?: number
}

export interface CallingModules {
    moduleID: number,
    callingModuleName?: string,
    timesCalling: number,
    pcntOfSession?: number
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
    pcntOfSession?: number,
    hasLink?: boolean
}

export interface CallTree {
    nodeID: number,
    parentID: number,
    moduleID : number,
    moduleName: string,
    lineNum?: number,
    numCalls?: number,
    startTime?: number,
    cumulativeTime: number,
    pcntOfSession: number
}

export interface PresentationData {
    moduleDetails: ModuleDetails[],
    callingModules: CallingModules[],
    calledModules: CalledModules[],
    lineSummary: LineSummary[],
    callTree: CallTree[]
}