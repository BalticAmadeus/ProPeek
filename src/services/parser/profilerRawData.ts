import {DescriptionData,parseDescriptionLine} from "./raw/descriptionData";
import {ModuleData,parseModuleLine} from "./raw/moduleData";
import {CallGraphData,parseCallGraphLine} from "./raw/callGraphData";
import {LineSummaryData,parseLineSummaryLine} from "./raw/lineSummaryData";
import {TracingData,parseTracingLine} from "./raw/tracingData";
import {CallTreeData,parseCallTreeLine} from "./raw/callTreeData";

export interface ProfilerRawData {
  DescriptionData: DescriptionData,
  ModuleData     : ModuleData[],
  CallGraphData  : CallGraphData[],
  LineSummaryData: LineSummaryData[],
  TracingData    : TracingData[],
  CallTreeData   : CallTreeData[]
}

export enum ProfilerSection {
  Description = 0,
  Module      = 1,
  CallGraph   = 2,
  LineSummary = 3,
  Tracing     = 4,
  Coverage    = 5,
  CallTree    = 6
}

/**
 * Parse profiler file data into ProfilerRawData object
 */
export function parseProfilerData (fullContents : string) : ProfilerRawData {

  const separator : string = ".";
  let rawData = {} as ProfilerRawData;
  let section : ProfilerSection = 0;
  let lastLine : string;

  rawData.ModuleData = [];
  rawData.CallGraphData = [];
  rawData.LineSummaryData = [];
  rawData.TracingData = [];
  rawData.CallTreeData = [];

  fullContents.split(/\r?\n/).forEach(line =>  {
    if (line === separator) {
      //coverage section can contain multiple separator lines, and only ends with two separators
      if (section !== ProfilerSection.Coverage || lastLine === separator) {
        section = section + 1;
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
export function parseRawDataLine ( section : ProfilerSection, line : string, rawData : ProfilerRawData ) : ProfilerRawData {

  switch (section) {
    case ProfilerSection.Description:
      rawData.DescriptionData = parseDescriptionLine(line);
      break;
    case ProfilerSection.Module:
      rawData.ModuleData.push( parseModuleLine(line, rawData.DescriptionData.Version) );
      break;
    case ProfilerSection.CallGraph:
      rawData.CallGraphData.push( parseCallGraphLine(line) );
      break;
    case ProfilerSection.LineSummary:
      rawData.LineSummaryData.push( parseLineSummaryLine(line) );
      break;
    case ProfilerSection.Tracing:
       rawData.TracingData.push( parseTracingLine(line) );
      break;
    case ProfilerSection.Coverage:
      // Coverage Data Section - not used
      break;
    case ProfilerSection.CallTree:
      rawData.CallTreeData.push( parseCallTreeLine(line) );
      break;
  }

  return rawData;
}
