import { ProfilerRawData } from "./profilerRawData";
import { calculateModuleDetails } from "./presentation/moduleDetails"
import { calculateCallingModules } from "./presentation/callingModules";
import { calculateCalledModules } from "./presentation/calledModules";
import { calculateLineSummary } from "./presentation/lineSummary";
import { calculateCallTree, calculateCallTreeByTracingData } from "./presentation/callTree";
import { ModuleDetails, PresentationData } from "../../common/PresentationData";

/**
 * Transform ProfilerRawData object into PresentationData object
 */
export function transformData(rawData: ProfilerRawData): PresentationData {

    const totalSessionTime: number = getTotalSessionTime(rawData);
    const moduleDetails: ModuleDetails[] = calculateModuleDetails(rawData, totalSessionTime);

    const presentationData: PresentationData = {
        moduleDetails : moduleDetails,
        callingModules: calculateCallingModules(rawData, moduleDetails),
        calledModules : calculateCalledModules(rawData, moduleDetails),
        lineSummary   : calculateLineSummary(rawData),
        callTree      : calculateCallTreeByTracingData(rawData, moduleDetails)
    };

    return presentationData;
}

/**
 * Returns total session time
 * Uses Call Tree section for profiler v3, Line Summary section for previous versions
 */
export function getTotalSessionTime(rawData: ProfilerRawData): number {

    switch (rawData.DescriptionData.Version) {
      case 1:
      case 2:
        return getTotalSessionTimeByLineSummary(rawData);
      default:
        return rawData.CallTreeData.find(({ ModuleID }) => ModuleID === 0)!.CumulativeTime;
    }
}

/**
 * Returns total session time by adding ActualTime of all LineSummary section lines
 */
export function getTotalSessionTimeByLineSummary(rawData: ProfilerRawData): number {

  let totalSessionTime: number = 0;

  rawData.LineSummaryData.forEach(line => {
      totalSessionTime = totalSessionTime + line.ActualTime;
  });

  return Number(totalSessionTime.toFixed(6));
}
