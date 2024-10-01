import {
  PresentationData,
  ModuleDetails,
  ComparedModule,
  ComparedData,
  CalledModules,
  ComparedCalledModule,
} from "../../common/PresentationData";
import { Constants } from "../../common/Constants";
import { calculateCalledModules } from "./presentation/calledModules";

export async function compareData(
  oldPresentationData: PresentationData,
  newPresentationData: PresentationData
): Promise<ComparedData> {
  const comparedModules: ComparedModule[] = [];
  const newModuleMap = mapModules(newPresentationData.moduleDetails);

  oldPresentationData.moduleDetails.forEach((oldModule) => {
    const newModule = newModuleMap.get(oldModule.moduleName);

    if (newModule) {
      comparedModules.push(compareModules(oldModule, newModule));
      newModuleMap.delete(oldModule.moduleName);
    } else {
      comparedModules.push(createRemovedModule(oldModule));
    }
  });

  newModuleMap.forEach((newModule) => {
    comparedModules.push(createAddedModule(newModule));
  });
  compareCalledModules(
    comparedModules,
    oldPresentationData.calledModules,
    newPresentationData.calledModules
  );
  return {
    comparedModules,
    firstTotalTime: oldPresentationData.callTree[0].cumulativeTime || 0,
    secondTotalTime: newPresentationData.callTree[0].cumulativeTime || 0,
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
const compareCalledModules = (
  comparedModules: ComparedModule[],
  oldCalledModules: CalledModules[],
  newCalledModules: CalledModules[]
): ComparedCalledModule[] => {
  const comparedCalledModules: ComparedCalledModule[] = [];

  comparedModules.forEach((module) => {
    const oldModuleId = Math.floor(module.moduleID / Constants.moduleIdMult);
    const newModuleId = module.moduleID % Constants.moduleIdMult;

    // new idea to change all id to compare moduleID and make modules tracable
    newCalledModules.forEach((callModule) => {
      if (callModule.callerID === newModuleId) {
        callModule.callerID = module.moduleID;
      }
      if (callModule.calleeID === newModuleId) {
        callModule.calleeID = module.moduleID;
      }
    });
    oldCalledModules.forEach((callModule) => {
      if (callModule.callerID === oldModuleId) {
        console.log(module.moduleID);
        callModule.callerID = module.moduleID;
      }
      if (callModule.calleeID === oldModuleId) {
        console.log(module.moduleID);
        callModule.calleeID = module.moduleID;
      }
    });
    /////////////////////////////////////////////////////////////////////////
    const oldCaller = oldCalledModules.filter(
      (callModule) => callModule.callerID === module.moduleID
    );
    const newCaller = newCalledModules.filter(
      (callModule) => callModule.callerID === module.moduleID
    );

    if (oldCaller.length === newCaller.length) {
      for (let i = 0; i < oldCaller.length; i++) {
        comparedCalledModules.push({
          callerID: oldCaller[i].callerID,
          callerModuleName: oldCaller[i].callerModuleName,
          callerTimesCalled: oldCaller[i].timesCalled,
          callerTimesCalledChange:
            newCaller[i].timesCalled - oldCaller[i].timesCalled,
          callerPcntOfSession: oldCaller[i].callerPcntOfSession,
          callerPcntOfSessionChange:
            newCaller[i].callerPcntOfSession - oldCaller[i].callerPcntOfSession,
        });
        console.log("old", oldCaller[i]);
        console.log("new", newCaller[i]);
        console.log("comp", comparedCalledModules);
      }
    }
    // console.log("compMod", module.moduleID);
    // console.log("oldMod", oldModuleId);
    // console.log("newMod", newModuleId);
    // console.log("oldCall", oldCaller);
    // console.log("newCall", newCaller);
  });
  return [];
};
