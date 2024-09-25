import {
  PresentationData,
  ModuleDetails,
  ComparedModule,
  ComparedData,
} from "../../common/PresentationData";
import { Constants } from "../../common/Constants";

export async function compareData(
  oldPresentationData: PresentationData,
  newPresentationData: PresentationData
): Promise<ComparedData> {
  const comparedModules: ComparedModule[] = [];
  const newModuleMap = mapModules(newPresentationData.moduleDetails);
  const oldModuleMap = mapModules(oldPresentationData.moduleDetails);

  oldModuleMap.forEach((oldModule) => {
    const newModule = newModuleMap.get(oldModule[0].moduleName);

    if (newModule) {
      const moduleLength = Math.min(oldModule.length, newModule.length);

      comparedModules.push(
        ...compareModules(oldModule, newModule, moduleLength)
      );

      if (moduleLength < newModule.length) {
        comparedModules.push(
          ...createAddedModule(newModule.slice(moduleLength))
        );
      }
      if (moduleLength < oldModule.length) {
        comparedModules.push(
          ...createRemovedModule(oldModule.slice(moduleLength))
        );
      }

      oldModuleMap.delete(oldModule[0]?.moduleName);
      newModuleMap.delete(newModule[0]?.moduleName);
    } else {
      comparedModules.push(...createRemovedModule(oldModule));
      oldModuleMap.delete(oldModule[0].moduleName);
    }
  });

  newModuleMap.forEach((modules) => {
    comparedModules.push(...createAddedModule(modules));
    newModuleMap.delete(modules[0].moduleName);
  });
  console.log(oldPresentationData.callTree[0]);
  return {
    comparedModules,
    firstTotalTime:
      oldPresentationData.callTree[0]?.cumulativeTime ||
      oldPresentationData.moduleDetails.reduce(
        (acc, module) => acc + module.totalTime,
        0
      ),
    secondTotalTime:
      newPresentationData.callTree[0]?.cumulativeTime ||
      newPresentationData.moduleDetails.reduce(
        (acc, module) => acc + module.totalTime,
        0
      ),
  };
}

const mapModules = (
  moduleDetails: ModuleDetails[]
): Map<String, ModuleDetails[]> => {
  const moduleMap = new Map<string, ModuleDetails[]>();

  moduleDetails.forEach((module) => {
    const moduleName = module.moduleName;
    if (moduleMap.has(moduleName)) {
      moduleMap.get(moduleName)!.push(module);
    } else {
      moduleMap.set(moduleName, [module]);
    }
  });
  return moduleMap;
};

const compareModules = (
  oldModule: ModuleDetails[],
  newModule: ModuleDetails[],
  moduleLength: number
): ComparedModule[] => {
  const comparedModules: ComparedModule[] = [];

  for (let i = 0; i < moduleLength; i++) {
    const mergedModuleID =
      oldModule[i].moduleID * Constants.moduleIdMult + newModule[i].moduleID;

    const timesCalledChange = calculateChange(
      newModule[i].timesCalled,
      oldModule[i].timesCalled
    );
    const avgTimePerCallChange = calculateChange(
      newModule[i].avgTimePerCall || 0,
      oldModule[i].avgTimePerCall || 0
    );
    const totalTimeChange = calculateChange(
      newModule[i].totalTime,
      oldModule[i].totalTime
    );
    const comparedModule: ComparedModule = {
      ...oldModule[i],
      moduleID: mergedModuleID,
      timesCalledChange,
      avgTimePerCallChange,
      totalTimeChange,
    };
    comparedModules.push(comparedModule);
  }
  return comparedModules;
};

const calculateChange = (newValue: number, oldValue: number): number => {
  return Number((newValue - oldValue).toFixed(6));
};

const createAddedModule = (modules: ModuleDetails[]): ComparedModule[] => {
  const addedModules: ComparedModule[] = [];

  modules.forEach((module) => {
    addedModules.push({
      ...module,
      moduleID: module.moduleID,
      timesCalled: 0,
      timesCalledChange: module.timesCalled,
      avgTimePerCall: 0,
      avgTimePerCallChange: module.avgTimePerCall || 0,
      totalTime: 0,
      totalTimeChange: module.totalTime,
      pcntOfSession: 0,
      status: "added",
    });
  });

  return addedModules;
};
const createRemovedModule = (modules: ModuleDetails[]): ComparedModule[] => {
  const removedModules: ComparedModule[] = [];

  modules.forEach((module) => {
    removedModules.push({
      ...module,
      moduleID: module.moduleID * Constants.moduleIdMult,
      timesCalledChange: -module.timesCalled,
      avgTimePerCallChange: -(module.avgTimePerCall || 0),
      totalTimeChange: -module.totalTime,
      status: "removed",
    });
  });

  return removedModules;
};
