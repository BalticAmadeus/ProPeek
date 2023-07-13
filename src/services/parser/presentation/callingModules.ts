import { CallingModules, ModuleDetails } from "../../../common/PresentationData";
import { ProfilerRawData } from "../profilerRawData";

/**
 * Transforms raw profiler data into presentable Calling Modules list
 */
export function calculateCallingModules(rawData: ProfilerRawData, moduleDetailList: ModuleDetails[]): CallingModules[] {

    const callingModulesList = [] as CallingModules[];

    rawData.ModuleData.forEach(module => {

        rawData.CallGraphData.forEach(node => {
            if (node.CalleeID === module.ModuleID) {

                let moduleDetails: ModuleDetails = moduleDetailList.find(({ moduleID }) => moduleID === node.CallerID)!;

                let callingModule: CallingModules = {
                    moduleID         : module.ModuleID,
                    callingModuleName: moduleDetails.moduleName,
                    timesCalling     : node.CallCount,
                    pcntOfSession    : moduleDetails.pcntOfSession
                }

                callingModulesList.push(callingModule);
            }
        });
    });

    return callingModulesList;
}
