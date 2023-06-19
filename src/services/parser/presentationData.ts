import { ProfilerRawData } from "./profilerRawData";
import { calculateModuleDetails } from "./presentation/moduleDetails"
import { calculateCallingModules } from "./presentation/callingModules";
import { calculateCalledModules } from "./presentation/calledModules";
import { calculateLineSummary } from "./presentation/lineSummary";
import { ModuleDetails, PresentationData } from "../../common/PresentationData";


export function transformData(rawData: ProfilerRawData): PresentationData {
    const totalSessionTime: number = getTotalSessionTime(rawData);
    const moduleDetails: ModuleDetails[] = calculateModuleDetails(rawData, totalSessionTime);

    const presentationData: PresentationData = {
        moduleDetails: moduleDetails,
        callingModules: calculateCallingModules(rawData, moduleDetails),
        calledModules: calculateCalledModules(rawData, moduleDetails),
        lineSummary: calculateLineSummary(rawData)
    };

    return presentationData;
}

export function getTotalSessionTime(rawData: ProfilerRawData): number {

    let totalSessionTime: number = 0;

    rawData.LineSummaryData.forEach(line => {
        totalSessionTime = totalSessionTime + line.ActualTime;
    });

    return Number(totalSessionTime.toFixed(6));
}
