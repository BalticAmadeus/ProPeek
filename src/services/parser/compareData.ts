import {
  PresentationData,
  ModuleDetails,
  ComparedData,
} from "../../common/PresentationData";

export async function compareData(
  oldPresentationData: PresentationData,
  newPresentationData: PresentationData
): Promise<ComparedData[]> {
  const MODULE_ID_MULT = 100000;
  const comparedData: ComparedData[] = [];

  const oldModuleMap = new Map<string, ModuleDetails>();
  oldPresentationData.moduleDetails.forEach((module) => {
    oldModuleMap.set(module.moduleName, module);
  });
  const newModuleMap = new Map<string, ModuleDetails>();
  newPresentationData.moduleDetails.forEach((module) => {
    newModuleMap.set(module.moduleName, module);
  });

  oldPresentationData.moduleDetails.forEach((oldModule) => {
    const newModule = newModuleMap.get(oldModule.moduleName);

    if (newModule) {
      const mergedModuleID = oldModule.moduleID * MODULE_ID_MULT + newModule.moduleID;
      const timesCalledChange = Number((newModule.timesCalled - oldModule.timesCalled).toFixed(6));
      const avgTimePerCallChange = Number(((newModule.avgTimePerCall || 0) - (oldModule.avgTimePerCall || 0)).toFixed(6));
      const totalTimeChange = Number((newModule.totalTime - oldModule.totalTime).toFixed(6));

      comparedData.push({
        ...oldModule,
        moduleID: mergedModuleID,
        timesCalledChange,
        avgTimePerCallChange,
        totalTimeChange,
      });
      newModuleMap.delete(oldModule.moduleName);
      
    } else {
      comparedData.push({
        ...oldModule,
        moduleID: oldModule.moduleID * MODULE_ID_MULT,
        timesCalledChange: -oldModule.timesCalled,
        avgTimePerCallChange: -(oldModule.avgTimePerCall || 0),
        totalTimeChange: -oldModule.totalTime,
        status: "removed",
      });
    }
  });

  newModuleMap.forEach((newModule) => {
    comparedData.push({
      ...newModule,
      moduleID: newModule.moduleID,
      timesCalledChange: newModule.timesCalled,
      avgTimePerCallChange: newModule.avgTimePerCall || 0,
      totalTimeChange: newModule.totalTime,
      status: "added",
    });
  });

  return comparedData;
}
