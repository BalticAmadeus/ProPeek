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
  console.log(compareData);
  const compareModuleMap = new Map<string, ModuleDetails>();
  compareData.moduleDetails.forEach((module) => {
    compareModuleMap.set(module.moduleName, module);
  });

  presentationData.moduleDetails.forEach((module) => {
    const comparedModule = compareModuleMap.get(module.moduleName);

    if (comparedModule) {
      const timesCalledChange = Number((module.timesCalled - comparedModule.timesCalled).toFixed(6));
      const avgTimePerCallChange = Number(((module.avgTimePerCall || 0) - (comparedModule.avgTimePerCall || 0)).toFixed(6));
      const totalTimeChange = Number((module.totalTime - comparedModule.totalTime).toFixed(6));
      console.log("comp", comparedModule);
      console.log("mod",module);
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
