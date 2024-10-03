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
  const comparedCalledModules: ComparedCalledModule[] = [];
  const newCalledMap = new Map(
    newCalledModules.map((module) => [
      `${module.callerID}-${module.calleeID}`,
      module,
    ])
  );

  oldCalledModules.forEach((oldCalledModule) => {
    const oldModuleId = (moduleId: number): number => {
      return Math.floor(moduleId / Constants.moduleIdMult);
    };
    const callerId = comparedModules.filter(
      (module) => oldModuleId(module.moduleID) === oldCalledModule.callerID
    )[0]?.moduleID;
    const calleeId = comparedModules.filter(
      (module) => oldModuleId(module.moduleID) === oldCalledModule.calleeID
    )[0]?.moduleID;

    const newCalledModule = newCalledMap.get(
      `${callerId % Constants.moduleIdMult}-${
        calleeId % Constants.moduleIdMult
      }`
    );

    if (newCalledModule) {
      const callerTimesCalledChange = calculateChange(
        newCalledModule.timesCalled,
        oldCalledModule.timesCalled
      );
      const calleeTimesCalledChange = calculateChange(
        newCalledModule.calleeTotalTimesCalled,
        oldCalledModule.calleeTotalTimesCalled
      );

      comparedCalledModules.push({
        ...oldCalledModule,
        callerID: callerId,
        calleeID: calleeId,
        callerTimesCalled: oldCalledModule?.timesCalled,
        calleeTimesCalled: oldCalledModule.calleeTotalTimesCalled,
        callerTimesCalledChange,
        calleeTimesCalledChange,
      });
      newCalledMap.delete(
        `${callerId % Constants.moduleIdMult}-${
          calleeId % Constants.moduleIdMult
        }`
      );
    } else {
      comparedCalledModules.push({
        ...oldCalledModule,
        callerID: oldCalledModule.callerID * Constants.moduleIdMult,
        calleeID: oldCalledModule.calleeID * Constants.moduleIdMult,
        callerTimesCalled: oldCalledModule.timesCalled,
        callerTimesCalledChange: 0,
        calleeTimesCalled: oldCalledModule.calleeTotalTimesCalled,
        calleeTimesCalledChange: 0,
        status: "removed",
      });
    }
  });
  newCalledMap.forEach((module) =>
    comparedCalledModules.push({
      ...module,
      callerTimesCalled: 0,
      callerTimesCalledChange: module.timesCalled,
      calleeTimesCalled: 0,
      calleeTimesCalledChange: module.calleeTotalTimesCalled,
      callerPcntOfSession: 0,
      calleePcntOfSession: 0,
      status: "added",
    })
  );
  return comparedCalledModules;
};
