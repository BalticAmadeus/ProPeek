import { PresentationData, ModuleDetails, ComparedData } from "../../common/PresentationData";

export async function compareData(
    presentationData: PresentationData,
    compareData: PresentationData
): Promise<ComparedData[]> {
    const comparedData: ComparedData[] = [];
    console.log(compareData);
    const compareModuleMap = new Map<number, ModuleDetails>();
    compareData.moduleDetails.forEach(module => {
        compareModuleMap.set(module.moduleID, module);
    });

    presentationData.moduleDetails.forEach(module => {
        const comparedModule = compareModuleMap.get(module.moduleID);

        console.log("Compare: ", comparedModule);
        console.log("Module: ", module);
        if (comparedModule?.moduleName === module.moduleName) {
            const timesCalledChange = Number((module.timesCalled - comparedModule.timesCalled).toFixed(6));
            const avgTimePerCallChange = Number(((module.avgTimePerCall || 0) - (comparedModule.avgTimePerCall || 0)).toFixed(6));
            const totalTimeChange = Number((module.totalTime - comparedModule.totalTime).toFixed(6));

            if (timesCalledChange !== 0 || avgTimePerCallChange !== 0 || totalTimeChange !== 0) {
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