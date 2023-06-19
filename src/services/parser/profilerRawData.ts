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

export function parseProfilerData (fullContents : string) : ProfilerRawData {

  const separator : string = ".";
  let rawData = {} as ProfilerRawData;
  let separatorCounter : number = 0;

  rawData.ModuleData = [];
  rawData.CallGraphData = [];
  rawData.LineSummaryData = [];
  rawData.TracingData = [];
  rawData.CallTreeData = [];

  fullContents.split(/\r?\n/).forEach(line =>  {
    if (line === separator) {
      separatorCounter = separatorCounter + 1;
    } else {
      rawData = parseRawDataLine(separatorCounter, line, rawData);
    }
  });

  return rawData;
}

export function parseRawDataLine ( separatorCounter : number, line : string, rawData : ProfilerRawData ) : ProfilerRawData {

  switch (separatorCounter) {
    case 0:
      rawData.DescriptionData = parseDescriptionLine(line);
      break;
    case 1:
      rawData.ModuleData.push( parseModuleLine(line) );
      break;
    case 2:
      rawData.CallGraphData.push( parseCallGraphLine(line) );
      break;
    case 3:
      rawData.LineSummaryData.push( parseLineSummaryLine(line) );
      break;
    case 4:
      rawData.TracingData.push( parseTracingLine(line) );
      break;
    case 6:
      rawData.CallTreeData.push( parseCallTreeLine(line) );
      break;
  }

  return rawData;
}
