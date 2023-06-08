import { CalledModules, ModuleDetails } from "../../../common/PresentationData";
import { ProfilerRawData } from "../profilerRawData";

export function calculateCalledModules(rawData: ProfilerRawData, moduleDetailList: ModuleDetails[]): CalledModules[] {

    const calledModulesList = [] as CalledModules[];

    rawData.ModuleData.forEach(module => {

        rawData.CallGraphData.forEach(node => {
            if (node.CallerID === module.ModuleID) {

                let moduleDetails: ModuleDetails = moduleDetailList.find(({ moduleID }) => moduleID === node.CalleeID)!;

                let calledModule: CalledModules = {
                    moduleID: module.ModuleID,
                    calledModuleName: moduleDetails.moduleName,
                    timesCalled: node.CallCount,
                    totalTimesCalled: moduleDetails.timesCalled,
                    pcntOfSession: moduleDetails.pcntOfSession
                }

                calledModulesList.push(calledModule);
            }
        });
    });

    return calledModulesList;
}
