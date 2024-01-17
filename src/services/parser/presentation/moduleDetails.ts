import { ModuleDetails } from "../../../common/PresentationData";
import { ProfilerRawData } from "../profilerRawData";

/**
 * Transforms raw profiler data into presentable Module Details list
 */
export function calculateModuleDetails(rawData: ProfilerRawData, totalSessionTime: number): ModuleDetails[] {

  let moduleDetailsList = [] as ModuleDetails[];

  moduleDetailsList = insertSessionModuleDetails(moduleDetailsList);

  for(let module of rawData.ModuleData){
    let moduleDetails: ModuleDetails = {
      moduleID     : module.ModuleID,
      moduleName   : module.ModuleName,
      startLineNum : module.LineNum ? module.LineNum : 0,
      timesCalled  : 0,
      totalTime    : 0
    }

    for(let node of rawData.CallGraphData){
      if (node.CalleeID === module.ModuleID) {
        moduleDetails.timesCalled = moduleDetails.timesCalled + node.CallCount;
      }
    }

    for(let line of rawData.LineSummaryData){
      if (line.ModuleID === module.ModuleID) {
        moduleDetails.totalTime = moduleDetails.totalTime + line.ActualTime;
      }
    }

    moduleDetails.totalTime = Number((moduleDetails.totalTime).toFixed(6));
    moduleDetails.avgTimePerCall = Number((moduleDetails.totalTime / moduleDetails.timesCalled).toFixed(6));
    moduleDetailsList.push(moduleDetails)
  }

  for(let moduleDetails of moduleDetailsList){
    moduleDetails.pcntOfSession = Number((moduleDetails.totalTime / totalSessionTime * 100).toFixed(4));
  }

  return moduleDetailsList;
}

/**
 * Insert module 'Session' with ID 0. This is not included in profiler file's module data section,
 * but is used in other sections like Call Graph and Line Summary.
 */
export function insertSessionModuleDetails(moduleDetailsList: ModuleDetails[]): ModuleDetails[] {

  moduleDetailsList.push({
    moduleID      : 0,
    moduleName    : "Session",
    startLineNum  : 0,
    timesCalled   : 1,
    avgTimePerCall: 0,
    totalTime     : 0,
    pcntOfSession : 0
  });

  return moduleDetailsList;
}
