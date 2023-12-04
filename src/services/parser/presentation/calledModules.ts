import { CalledModules, ModuleDetails } from "../../../common/PresentationData";
import { ProfilerRawData } from "../profilerRawData";

/**
 * Transforms raw profiler data into presentable Called Modules list
 */
export function calculateCalledModules(rawData: ProfilerRawData, moduleDetailList: ModuleDetails[]): CalledModules[] {

    const calledModulesList = [] as CalledModules[];

    for (let module of rawData.ModuleData) {

        for (let node of rawData.CallGraphData) {

            if (node.CallerID === module.ModuleID) {

                let calledModule = calledModulesList.find(({ callerID, calleeID }) => callerID === node.CallerID && calleeID === node.CalleeID);

                if (calledModule) {
                    calledModule.timesCalled += node.CallCount;
                } else {
                    let callerModuleDetails: ModuleDetails = moduleDetailList.find(({ moduleID }) => moduleID === node.CallerID)!;
                    if (!callerModuleDetails) {
                        console.error(`Module with ID ${node.CallerID} not found`);
                        break;
                    }

                    let calleeModuleDetails: ModuleDetails = moduleDetailList.find(({ moduleID }) => moduleID === node.CalleeID)!;
                    if (!calleeModuleDetails) {
                        console.error(`Module with ID ${node.CalleeID} not found`);
                        break;
                    }

                    calledModule = {
                        callerID: node.CallerID,
                        calleeID: node.CalleeID,
                        callerModuleName: callerModuleDetails.moduleName,
                        calleeModuleName: calleeModuleDetails.moduleName,
                        timesCalled: node.CallCount,
                        calleeTotalTimesCalled: calleeModuleDetails.timesCalled,
                        callerPcntOfSession: callerModuleDetails.pcntOfSession,
                        calleePcntOfSession: calleeModuleDetails.pcntOfSession
                    } as CalledModules;

                    calledModulesList.push(calledModule);
                }
            }
        }
    }

    return calledModulesList;
}
