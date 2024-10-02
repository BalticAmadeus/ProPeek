import {
  PresentationData,
  ModuleDetails,
  ComparedModule,
  ComparedData,
  CalledModules,
  ComparedCalledModule,
} from "../../common/PresentationData";
import { Constants } from "../../common/Constants";

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
  return {
    comparedModules,
    comparedCalledModules: compareCalledModules(
      comparedModules,
      oldPresentationData.calledModules,
      newPresentationData.calledModules
    ),
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
  const newCalledMap = new Map(
    newCalledModules.map((module) => [
      `${module.callerID}-${module.calleeID}`,
      module,
    ])
  );
  const comparedCalledModules: ComparedCalledModule[] = [];

  oldCalledModules.forEach((oldCalledModule) => {
    const callerId = comparedModules.filter(
      (module) =>
        Math.floor(module.moduleID / Constants.moduleIdMult) ===
        oldCalledModule.callerID
    )[0]?.moduleID;
    const calleeId = comparedModules.filter(
      (module) =>
        Math.floor(module.moduleID / Constants.moduleIdMult) ===
        oldCalledModule.calleeID
    )[0]?.moduleID;
    const newCalledModule = newCalledMap.get(
      `${callerId % Constants.moduleIdMult}-${
        calleeId % Constants.moduleIdMult
      }`
    );
    if (newCalledModule) {
      comparedCalledModules.push({
        callerID: callerId,
        calleeID: calleeId,
        callerModuleName: oldCalledModule.callerModuleName,
        calleeModuleName: oldCalledModule.calleeModuleName,
        callerTimesCalled: oldCalledModule?.timesCalled,
        calleeTimesCalled: oldCalledModule.calleeTotalTimesCalled,
        callerTimesCalledChange:
          newCalledModule.timesCalled - oldCalledModule.timesCalled,
        calleeTimesCalledChange:
          newCalledModule.calleeTotalTimesCalled -
          oldCalledModule.calleeTotalTimesCalled,
        callerPcntOfSession: oldCalledModule.callerPcntOfSession,
        calleePcntOfSession: oldCalledModule.calleePcntOfSession,
        callerPcntOfSessionChange:
          newCalledModule.callerPcntOfSession -
          oldCalledModule.callerPcntOfSession,
        calleePcntOfSessionChange:
          newCalledModule.calleePcntOfSession -
          oldCalledModule.calleePcntOfSession,
      });
      newCalledMap.delete(
        `${callerId % Constants.moduleIdMult}-${
          calleeId % Constants.moduleIdMult
        }`
      );
    } else {
      comparedCalledModules.push({
        ...oldCalledModule,
        callerTimesCalled: oldCalledModule.timesCalled,
        callerTimesCalledChange: 0,
        calleeTimesCalled: oldCalledModule.calleeTotalTimesCalled,
        calleeTimesCalledChange: 0,
        callerPcntOfSessionChange: 0,
        calleePcntOfSessionChange: 0,
      });
    }
  });
  newCalledMap.forEach((module) =>
    comparedCalledModules.push({
      ...module,
      callerTimesCalled: module.timesCalled,
      callerTimesCalledChange: 0,
      calleeTimesCalled: module.calleeTotalTimesCalled,
      calleeTimesCalledChange: 0,
      callerPcntOfSessionChange: 0,
      calleePcntOfSessionChange: 0,
    })
  );
  console.log(compareCalledModules);
  return comparedCalledModules;
};
