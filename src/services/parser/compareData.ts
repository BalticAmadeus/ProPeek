import {
  PresentationData,
  ModuleDetails,
  ComparedData,
} from "../../common/PresentationData";

export async function compareData(
  presentationData: PresentationData,
  compareData: PresentationData
): Promise<ComparedData[]> {
  const comparedData: ComparedData[] = [];
  const compareModuleMap = new Map<number, ModuleDetails>();
  compareData.moduleDetails.forEach((module) => {
    compareModuleMap.set(module.moduleID, module);
  });

  presentationData.moduleDetails.forEach((module) => {
    const comparedModule = compareModuleMap.get(module.moduleID);

    if (comparedModule?.moduleName === module.moduleName) {
      const timesCalledChange = module.timesCalled - comparedModule.timesCalled;
      const avgTimePerCallChange =
        (module.avgTimePerCall || 0) - (comparedModule.avgTimePerCall || 0);
      const totalTimeChange = module.totalTime - comparedModule.totalTime;

      if (
        timesCalledChange !== 0 ||
        avgTimePerCallChange !== 0 ||
        totalTimeChange !== 0
      ) {
        comparedData.push({
          moduleId: module.moduleID,
          timesCalledChange,
          avgTimePerCallChange,
          totalTimeChange,
        });
      }
    }
  });

  return comparedData;
}
