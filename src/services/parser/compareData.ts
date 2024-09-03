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
  let oldTotalTime = 0;
  let newTotalTime = 0;
  const comparedModules: ComparedModule[] = [];
  const newModuleMap = mapModules(newPresentationData.moduleDetails);

  oldPresentationData.moduleDetails.forEach((oldModule) => {
    const newModule = newModuleMap.get(oldModule.moduleName);
    oldTotalTime += oldModule.totalTime;

    if (newModule) {
      comparedModules.push(compareModules(oldModule, newModule));
      newTotalTime += newModule.totalTime;
      newModuleMap.delete(oldModule.moduleName);
    } else {
      comparedModules.push(createRemovedModule(oldModule));
    }
  });

  newModuleMap.forEach((newModule) => {
    newTotalTime += newModule.totalTime;
    comparedModules.push(createAddedModule(newModule));
  });

  console.log(newTotalTime);
  console.log(oldTotalTime);
  return {
    comparedModules,
    firstTotalTime: oldTotalTime,
    secondTotalTime: newTotalTime,
  };
}

const mapModules = (
  moduleDetails: ModuleDetails[]
): Map<String, ModuleDetails> => {
  return new Map(moduleDetails.map((module) => [module.moduleName, module]));
};

const compareModules = (
  oldModule: ModuleDetails,
  newModule: ModuleDetails
): ComparedModule => {
  const mergedModuleID =
    oldModule.moduleID * Constants.moduleIdMult + newModule.moduleID;

  const timesCalledChange = calculateChange(
    newModule.timesCalled,
    oldModule.timesCalled
  );
  const avgTimePerCallChange = calculateChange(
    newModule.avgTimePerCall || 0,
    oldModule.avgTimePerCall || 0
  );
  const totalTimeChange = calculateChange(
    newModule.totalTime,
    oldModule.totalTime
  );

  return {
    ...oldModule,
    moduleID: mergedModuleID,
    timesCalledChange,
    avgTimePerCallChange,
    totalTimeChange,
  };
};

const calculateChange = (newValue: number, oldValue: number): number => {
  return Number((newValue - oldValue).toFixed(6));
};

const createAddedModule = (module: ModuleDetails): ComparedModule => {
  return {
    ...module,
    moduleID: module.moduleID,
    timesCalledChange: module.timesCalled,
    avgTimePerCallChange: module.avgTimePerCall || 0,
    totalTimeChange: module.totalTime,
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
