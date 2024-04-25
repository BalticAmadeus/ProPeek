import { ProfilerRawData } from "./profilerRawData";
import { calculateModuleDetails } from "./presentation/moduleDetails"
import { calculateCalledModules } from "./presentation/calledModules";
import { calculateLineSummary } from "./presentation/lineSummary";
import { calculateCallTree, calculateCallTreeByTracingData } from "./presentation/callTree";
import { CallTree, ModuleDetails, PresentationData } from "../../common/PresentationData";
import { Constants } from "../../common/Constants";
import * as vscode from "vscode";

/**
 * Transform ProfilerRawData object into PresentationData object
 */
export async function transformData(rawData: ProfilerRawData, showStartTime: boolean, profilerTitle: string): Promise<PresentationData> {

    if (rawData.ModuleData.length >= Constants.fileSearchLimit) {
        vscode.window.showWarningMessage('Skipping workspace module pre-search. (ProPeek)');
    }

    const hasXREFs = await hasFiles(`**${Constants.defaultXREFPath}*.xref`);
    const hasListings = await hasFiles(`**${Constants.defaultListingPath}*`);

    const totalSessionTime: number = getTotalSessionTime(rawData);
    const moduleDetails: ModuleDetails[] = await calculateModuleDetails(rawData, totalSessionTime, profilerTitle, hasListings);
    const hasTracingData: boolean = rawData.TracingData.length > 0;

    const presentationData: PresentationData = {
        moduleDetails: moduleDetails,
        calledModules: calculateCalledModules(rawData, moduleDetails),
        lineSummary: await calculateLineSummary(rawData, profilerTitle, hasListings),
        callTree: getCallTree(rawData, moduleDetails, totalSessionTime, showStartTime),
        hasTracingData: hasTracingData,
        hasXREFs: hasXREFs,
        hasListings: hasListings,
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

/**
 * Returns call tree based on profiler version and config parameters
 */
export function getCallTree(rawData: ProfilerRawData, moduleDetails: ModuleDetails[], totalSessionTime: number, showStartTime: boolean): CallTree[] {

    const hasTracingData: boolean = rawData.TracingData.length > 0;
    const version: number = rawData.DescriptionData.Version;

    // calculate call tree by tracing data if start time is needed or version is older than 3
    if (version >= 3 && !(showStartTime && hasTracingData)) {
        return calculateCallTree(rawData, moduleDetails, totalSessionTime);
    } else {
        return calculateCallTreeByTracingData(rawData, moduleDetails);
    }
}

/**
 * Returns true if finds atleast one file in the workspace following a pattern
 * @param {vscode.GlobPattern} pattern vscode.GlobPattern
 * @returns true if found, else false
 */
const hasFiles = async (pattern: vscode.GlobPattern): Promise<boolean> => {
    const files = await vscode.workspace.findFiles(pattern, null, 1);
    return files.length > 0 ? true : false;
}
