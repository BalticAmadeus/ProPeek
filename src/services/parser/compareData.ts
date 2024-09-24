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
      if (newModule.length === oldModule.length) {
        comparedModules.push(...compareModules(oldModule, newModule));
        console.log("Old1", oldModule);
        console.log("new1", newModule);
      } else {
        let moduleLength = 0;
        if (oldModule.length > newModule.length) {
          moduleLength = newModule.length;
        } else {
          moduleLength = oldModule.length;
        }

        for (let i = 0; i < moduleLength; i++) {
          const mergedModuleID =
            oldModule[i].moduleID * Constants.moduleIdMult +
            newModule[i].moduleID;

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
          console.log("Old2", oldModule);
          console.log("new2", newModule);
        }
        if (moduleLength === oldModule.length) {
          for (let i = moduleLength; i < newModule.length; i++) {
            comparedModules.push(createAddedModule(newModule[i]));
            console.log("new3", newModule);
          }
        } else {
          for (let i = moduleLength; i < oldModule.length; i++) {
            comparedModules.push(createRemovedModule(oldModule[i]));
            console.log("Old3", oldModule);
          }
        }
      }
      oldModuleMap.delete(oldModule[0]?.moduleName);
      newModuleMap.delete(newModule[0]?.moduleName);
      console.log("OldDel", oldModule);
      console.log("NewDel", newModule);
    } else {
      oldModule.forEach((module) => {
        comparedModules.push(createRemovedModule(module));
        console.log("Old4", oldModule);
      });
      oldModuleMap.delete(oldModule[0].moduleName);
    }
  });
  newModuleMap.forEach((modules) => {
    modules.forEach((module) => {
      comparedModules.push(createAddedModule(module));
    });
    newModuleMap.delete(modules[0].moduleName);
  });
  oldModuleMap.forEach((modules) => {
    console.log("leftOld", modules);
  });
  newModuleMap.forEach((modules) => {
    console.log("leftNew", modules);
  });
  return {
    comparedModules,
    firstTotalTime: oldPresentationData.callTree[0].cumulativeTime || 0,
    secondTotalTime: newPresentationData.callTree[0].cumulativeTime || 0,
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
  newModule: ModuleDetails[]
): ComparedModule[] => {
  const moduleArray: ComparedModule[] = [];

  for (let i = 0; i < oldModule.length; i++) {
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
    moduleArray.push(comparedModule);
  }
  return moduleArray;
};

const calculateChange = (newValue: number, oldValue: number): number => {
  return Number((newValue - oldValue).toFixed(6));
};

const createAddedModule = (module: ModuleDetails): ComparedModule => {
  return {
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
  };
};
const createRemovedModule = (module: ModuleDetails): ComparedModule => {
  return {
    ...module,
    moduleID: module.moduleID * Constants.moduleIdMult,
    timesCalledChange: -module.timesCalled,
    avgTimePerCallChange: -(module.avgTimePerCall || 0),
    totalTimeChange: -module.totalTime,
    status: "removed",
  };
};
