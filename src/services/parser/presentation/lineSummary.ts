import { LineSummary } from "../../../common/PresentationData";
import { ProfilerRawData } from "../profilerRawData";

/**
 * Transforms raw profiler data into presentable Line Summary list
 */
export function calculateLineSummary(rawData: ProfilerRawData): LineSummary[] {

  const lineSummaryList = [] as LineSummary[];

  for(let module of rawData.ModuleData) {

    for(let line of rawData.LineSummaryData) {

      if (line.ModuleID === module.ModuleID) {

        let lineSummary: LineSummary = {
          moduleID   : line.ModuleID,
          lineNumber : line.LineNo,
          timesCalled: line.ExecCount,
          avgTime    : Number((line.ActualTime / line.ExecCount).toFixed(6)),
          totalTime  : line.ActualTime
        }

        lineSummaryList.push(lineSummary);
      }
    }
  }

  return lineSummaryList;
}
