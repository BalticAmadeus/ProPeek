import { ModuleDetails } from "../../../common/PresentationData";
import { ProfilerRawData } from "../profilerRawData";

/**
 * Transforms raw profiler data into presentable Module Details list
 */
export function calculateModuleDetails(rawData: ProfilerRawData, totalSessionTime: number): ModuleDetails[] {

    let moduleDetailsList = [] as ModuleDetails[];

    moduleDetailsList = insertSessionModuleDetails(moduleDetailsList);

    rawData.ModuleData.forEach(module => {
        let moduleDetails: ModuleDetails = {
            moduleID     : module.ModuleID,
            moduleName   : module.ModuleName,
            timesCalled  : 0,
            totalTime    : 0
        }

        rawData.CallGraphData.forEach(node => {
            if (node.CalleeID === module.ModuleID) {
                moduleDetails.timesCalled = moduleDetails.timesCalled + node.CallCount;
            }
        });

        rawData.LineSummaryData.forEach(line => {
            if (line.ModuleID === module.ModuleID) {
                moduleDetails.totalTime = moduleDetails.totalTime + line.ActualTime;
            }
        });

        moduleDetails.avgTimePerCall = Number((moduleDetails.totalTime / moduleDetails.timesCalled).toFixed(6));
        moduleDetailsList.push(moduleDetails)
    });

    moduleDetailsList.forEach(moduleDetails => {
        moduleDetails.pcntOfSession = Number((moduleDetails.totalTime / totalSessionTime * 100).toFixed(4));
    });

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
        timesCalled   : 1,
        avgTimePerCall: 0,
        totalTime     : 0,
        pcntOfSession : 0
    });

    return moduleDetailsList;
}
