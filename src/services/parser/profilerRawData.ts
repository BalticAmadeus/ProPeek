import { DescriptionData, parseDescriptionLine } from "./raw/descriptionData";
import { ModuleData, parseModuleLine } from "./raw/moduleData";
import { CallGraphData, parseCallGraphLine } from "./raw/callGraphData";
import { LineSummaryData, parseLineSummaryLine } from "./raw/lineSummaryData";
import { TracingData, parseTracingLine } from "./raw/tracingData";
import { CallTreeData, parseCallTreeLine } from "./raw/callTreeData";

export interface ProfilerRawData {
    DescriptionData: DescriptionData,
    ModuleData: ModuleData[],
    CallGraphData: CallGraphData[],
    LineSummaryData: LineSummaryData[],
    TracingData: TracingData[],
    CallTreeData: CallTreeData[]
}

export enum ProfilerSection {
    Description = 0,
    Module = 1,
    CallGraph = 2,
    LineSummary = 3,
    Tracing = 4,
    Coverage = 5,
    Statistics = 6,
    CallTree = 7,
    UserData = 8
}

/**
 * Parse profiler file data into ProfilerRawData object
 */
export function parseProfilerData(fullContents: string): ProfilerRawData {

    const separator: string = ".";
    let rawData = {} as ProfilerRawData;
    let section: ProfilerSection = 0;
    let lastLine: string;
    let statisticsSectionCount: number = 0;

    rawData.ModuleData = [];
    rawData.CallGraphData = [];
    rawData.LineSummaryData = [];
    rawData.TracingData = [];
    rawData.CallTreeData = [];

    fullContents.split(/\r?\n/).forEach(line => {
        if (line === separator) {
            if (section === ProfilerSection.Statistics) statisticsSectionCount++;

            //coverage section can contain multiple separator lines, and only ends with two consecutive separators
            //statistics have 4 sections of data
            if ((section !== ProfilerSection.Coverage && section !== ProfilerSection.Statistics) ||
                (section === ProfilerSection.Coverage && lastLine === separator) ||
                (section === ProfilerSection.Statistics && statisticsSectionCount === 4)) {
                section = section + 1;

                //statistics section doesn't exist in versions 1 and 3
                if (section === ProfilerSection.Statistics && rawData.DescriptionData.Version !== 2 && rawData.DescriptionData.Version !== 4) {
                    section = section + 1;
                }
            }
        } else {
            rawData = parseRawDataLine(section, line, rawData);
        }
        lastLine = line;
    });

    return rawData;
}

/**
 * Parse raw data line into one of the section objects
 */
export function parseRawDataLine(section: ProfilerSection, line: string, rawData: ProfilerRawData): ProfilerRawData {

    switch (section) {
        case ProfilerSection.Description:
            rawData.DescriptionData = parseDescriptionLine(line);
            break;
        case ProfilerSection.Module:
            rawData.ModuleData.push(parseModuleLine(line, rawData.DescriptionData.Version));
            break;
        case ProfilerSection.CallGraph:
            rawData.CallGraphData.push(parseCallGraphLine(line));
            break;
        case ProfilerSection.LineSummary:
            rawData.LineSummaryData.push(parseLineSummaryLine(line));
            break;
        case ProfilerSection.Tracing:
            rawData.TracingData.push(parseTracingLine(line));
            break;
        case ProfilerSection.Coverage:
            // Coverage Data Section - not used
            break;
        case ProfilerSection.Statistics:
            // Statistics Section - not used
            break;
        case ProfilerSection.CallTree:
            rawData.CallTreeData.push(parseCallTreeLine(line));
            break;
        case ProfilerSection.UserData:
            // User Data Section - not used
            break;
    }

    return rawData;
}
