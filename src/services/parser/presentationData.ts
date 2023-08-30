import { ProfilerRawData } from "./profilerRawData";
import { calculateModuleDetails } from "./presentation/moduleDetails"
import { calculateCallingModules } from "./presentation/callingModules";
import { calculateCalledModules } from "./presentation/calledModules";
import { calculateLineSummary } from "./presentation/lineSummary";
import { calculateCallTree } from "./presentation/callTree";
import { ModuleDetails, PresentationData } from "../../common/PresentationData";

/**
 * Transform ProfilerRawData object into PresentationData object
 */
export function transformData(rawData: ProfilerRawData): PresentationData {

    // Total session time is taken from CumulativeTime of Call Tree record with ModuleID = 0 (Session)
    // Should be the same as adding ActualTime of all Line Summary records
    const totalSessionTime: number = rawData.CallTreeData.find(({ ModuleID }) => ModuleID === 0)!.CumulativeTime;
    const moduleDetails: ModuleDetails[] = calculateModuleDetails(rawData, totalSessionTime);

    const presentationData: PresentationData = {
        moduleDetails : moduleDetails,
        callingModules: calculateCallingModules(rawData, moduleDetails),
        calledModules : calculateCalledModules(rawData, moduleDetails),
        lineSummary   : calculateLineSummary(rawData),
        callTree      : calculateCallTree(rawData, moduleDetails, totalSessionTime)
    };

    return presentationData;
}
