import { Constants } from "../../../common/Constants";
import { ModuleDetails } from "../../../common/PresentationData";
import { ProfilerRawData } from "../profilerRawData";
import { getHasLink, getWorkspaceConfig } from "./common";

/**
 * Transforms raw profiler data into presentable Module Details list
 */
export async function calculateModuleDetails(rawData: ProfilerRawData, totalSessionTime: number, profilerTitle: string): Promise<ModuleDetails[]> {

  let moduleDetailsList = [] as ModuleDetails[];

  moduleDetailsList = insertSessionModuleDetails(moduleDetailsList);

  for(const module of rawData.ModuleData) {
    const moduleDetails: ModuleDetails = {
      moduleID     : module.ModuleID,
      moduleName   : module.ModuleName,
      startLineNum : module.LineNum ? module.LineNum : 0,
      timesCalled  : 0,
      totalTime    : 0,
      listingFile  : module.ListingFile,
      hasLink      : rawData.ModuleData.length < Constants.fileSearchLimit ? await getHasLink(module.ModuleName, profilerTitle) : (getWorkspaceConfig().length > 0 ? true : false)
    };

    for(const node of rawData.CallGraphData){
      if (node.CalleeID === module.ModuleID) {
        moduleDetails.timesCalled = moduleDetails.timesCalled + node.CallCount;
      }
    }

    for(const line of rawData.LineSummaryData){
      if (line.ModuleID === module.ModuleID) {
        moduleDetails.totalTime = moduleDetails.totalTime + line.ActualTime;
      }
    }

    moduleDetails.totalTime = Number((moduleDetails.totalTime).toFixed(6));
    moduleDetails.avgTimePerCall = Number((moduleDetails.totalTime / moduleDetails.timesCalled).toFixed(6));
    moduleDetailsList.push(moduleDetails);
  }

  for(const moduleDetails of moduleDetailsList) {
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
    pcntOfSession : 0,
    hasLink       : false,
  });

  return moduleDetailsList;
}
