import { ProfilerRawData } from "./profilerRawData";
import { calculateModuleDetails, getHasListingFiles } from "./presentation/moduleDetails";
import { getHasXRefFiles } from "../helper/xRefHelper";
import { calculateCalledModules } from "./presentation/calledModules";
import { calculateLineSummary } from "./presentation/lineSummary";
import { calculateCallTree, calculateCallTreeByTracingData } from "./presentation/callTree";
import { CallTree, ModuleDetails, PresentationData } from "../../common/PresentationData";

/**
 * Transform ProfilerRawData object into PresentationData object
 */
export async function transformData(rawData: ProfilerRawData, useTracingData: boolean, profilerTitle: string): Promise<PresentationData> {

    const hasXREFs = await getHasXRefFiles(rawData, profilerTitle);
    const hasListings = getHasListingFiles(rawData);

    const totalSessionTime: number = getTotalSessionTime(rawData, useTracingData);
    const moduleDetails: ModuleDetails[] = await calculateModuleDetails(rawData, totalSessionTime, profilerTitle, hasListings, hasXREFs);

    const presentationData: PresentationData = {
        moduleDetails: moduleDetails,
        calledModules: calculateCalledModules(rawData, moduleDetails),
        lineSummary: await calculateLineSummary(rawData, profilerTitle, hasListings, hasXREFs, moduleDetails),
        callTree: getCallTree(rawData, moduleDetails, totalSessionTime, useTracingData),
        hasTracingData: rawData.hasTracingData,
        hasXREFs: hasXREFs,
        hasListings: hasListings,
        isTracingLimitExceeded: rawData.isTracingLimitExceeded,
    };

    return presentationData;
}

/**
 * Returns total session time
 * Uses Call Tree section for profiler v3, Line Summary section for previous versions
 */
export function getTotalSessionTime(rawData: ProfilerRawData, useTracingData: boolean): number {

    if (useTracingData ||
        rawData.DescriptionData.Version === 1 ||
        rawData.DescriptionData.Version === 2
    ) {
        return getTotalSessionTimeByLineSummary(rawData);
    }

    return rawData.CallTreeData.find(({ ModuleID }) => ModuleID === 0)!.CumulativeTime;
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

/**
 * Returns call tree based on profiler version and config parameters
 */
export function getCallTree(rawData: ProfilerRawData, moduleDetails: ModuleDetails[], totalSessionTime: number, useTracingData: boolean): CallTree[] {

    const hasTracingData: boolean = rawData.TracingData.length > 0;
    const version: number = rawData.DescriptionData.Version;

    // calculate call tree by tracing data if start time is needed or version is older than 3
    if (version >= 3 && !(useTracingData && hasTracingData)) {
        return calculateCallTree(rawData, moduleDetails, totalSessionTime);
    } else {
        return calculateCallTreeByTracingData(rawData, moduleDetails);
    }
}