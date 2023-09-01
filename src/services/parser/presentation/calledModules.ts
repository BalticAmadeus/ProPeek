import { CalledModules, ModuleDetails } from "../../../common/PresentationData";
import { ProfilerRawData } from "../profilerRawData";

/**
 * Transforms raw profiler data into presentable Called Modules list
 */
export function calculateCalledModules(rawData: ProfilerRawData, moduleDetailList: ModuleDetails[]): CalledModules[] {

  const calledModulesList = [] as CalledModules[];

  for(let module of rawData.ModuleData) {

    for(let node of rawData.CallGraphData) {

      if (node.CallerID === module.ModuleID) {

        let moduleDetails: ModuleDetails = moduleDetailList.find(({ moduleID }) => moduleID === node.CalleeID)!;

        let calledModule: CalledModules = {
          moduleID        : module.ModuleID,
          calledModuleName: moduleDetails.moduleName,
          timesCalled     : node.CallCount,
          totalTimesCalled: moduleDetails.timesCalled,
          pcntOfSession   : moduleDetails.pcntOfSession
        }

        calledModulesList.push(calledModule);
      }
    }
  }

  return calledModulesList;
}
