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

  return {
    comparedModules,
    comparedCalledModules: compareCalledModules(
      comparedModules,
      oldPresentationData.calledModules,
      newPresentationData.calledModules
    ),
    firstTotalTime: totalTime(oldPresentationData),
    secondTotalTime: totalTime(newPresentationData),
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
      moduleIDprof1: oldModule[i].moduleID,
      moduleIDprof2: newModule[i].moduleID,
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
      moduleIDprof2: module.moduleID,
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
      moduleIDprof1: module.moduleID,
      timesCalledChange: -module.timesCalled,
      avgTimePerCallChange: -(module.avgTimePerCall || 0),
      totalTimeChange: -module.totalTime,
      status: "removed",
    });
  });

  return removedModules;
};

const totalTime = (presentationData: PresentationData): number => {
  return (
    presentationData.callTree[0]?.cumulativeTime ||
    presentationData.moduleDetails.reduce(
      (acc, module) => acc + module.totalTime,
      0
    )
  );
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
    const callerModule = comparedModules.find(
      (comparedModule) =>
        comparedModule?.moduleIDprof1 === oldCalledModule.callerID
    );
    const calleeModule = comparedModules.find(
      (comparedModule) =>
        comparedModule?.moduleIDprof1 === oldCalledModule.calleeID
    );
    const newCalledModule = newCalledMap.get(
      `${callerModule?.moduleIDprof2}-${calleeModule?.moduleIDprof2}`
    );

    if (!calleeModule || !callerModule) return;
    if (newCalledModule) {
      comparedCalledModules.push(
        compareCalled(
          oldCalledModule,
          newCalledModule,
          callerModule,
          calleeModule
        )
      );
      newCalledMap.delete(
        `${callerModule?.moduleIDprof2}-${calleeModule?.moduleIDprof2}`
      );
    } else {
      comparedCalledModules.push(
        removedCalled(oldCalledModule, callerModule, calleeModule)
      );
    }
  });

  newCalledMap.forEach((newCalledModule) => {
    const addedCalledModule = addedCalled(comparedModules, newCalledModule);
    if (addedCalledModule) comparedCalledModules.push(addedCalledModule);
  });

  return comparedCalledModules;
};
const addedCalled = (
  comparedModules: ComparedModule[],
  newCalledModule: CalledModules
): ComparedCalledModule | undefined => {
  const callerID = comparedModules.find(
    (comparedModule) =>
      comparedModule.moduleIDprof2 === newCalledModule.callerID
  )?.moduleID;
  const calleeID = comparedModules.find(
    (comparedModule) =>
      comparedModule.moduleIDprof2 === newCalledModule.calleeID
  )?.moduleID;

  if (!callerID || !calleeID) return;
  return {
    ...newCalledModule,
    calleeID,
    callerID,
    timesCalled: 0,
    timesCalledChange: newCalledModule.timesCalled,
    calleeTotalTimesCalled: 0,
    calleeTotalTimesCalledChange: newCalledModule.calleeTotalTimesCalled,
    callerPcntOfSession: 0,
    calleePcntOfSession: 0,
    status: "added",
  };
};
const removedCalled = (
  calledModule: CalledModules,
  callerModule: ComparedModule,
  calleeModule: ComparedModule
): ComparedCalledModule => {
  return {
    ...calledModule,
    callerID: callerModule.moduleID,
    calleeID: calleeModule.moduleID,
    timesCalled: calledModule.timesCalled,
    timesCalledChange: -calledModule.timesCalled,
    calleeTotalTimesCalled: calledModule.calleeTotalTimesCalled,
    calleeTotalTimesCalledChange: -calledModule.calleeTotalTimesCalled,
    status: "removed",
  };
};
const compareCalled = (
  oldCalledModule: CalledModules,
  newCalledModule: CalledModules,
  callerModule: ComparedModule,
  calleeModule: ComparedModule
): ComparedCalledModule => {
  const timesCalledChange = calculateChange(
    newCalledModule.timesCalled,
    oldCalledModule.timesCalled
  );
  const calleeTotalTimesCalledChange = calculateChange(
    newCalledModule.calleeTotalTimesCalled,
    oldCalledModule.calleeTotalTimesCalled
  );

  return {
    ...oldCalledModule,
    callerID: callerModule.moduleID,
    calleeID: calleeModule.moduleID,
    timesCalled: oldCalledModule?.timesCalled,
    calleeTotalTimesCalled: oldCalledModule.calleeTotalTimesCalled,
    timesCalledChange,
    calleeTotalTimesCalledChange,
  };
};
