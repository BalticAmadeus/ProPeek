import { LineSummary } from "../../../common/PresentationData";
import { ProfilerRawData } from "../profilerRawData";
import { getHasLink } from "./common";

/**
 * Transforms raw profiler data into presentable Line Summary list
 */
export async function calculateLineSummary(rawData: ProfilerRawData): Promise<LineSummary[]> {

  const lineSummaryList = [] as LineSummary[];

  for(const module of rawData.ModuleData) {

    for(const line of rawData.LineSummaryData) {

      if (line.ModuleID === module.ModuleID) {

        const lineSummary: LineSummary = {
          moduleID   : line.ModuleID,
          lineNumber : line.LineNo,
          timesCalled: line.ExecCount,
          avgTime    : Number((line.ActualTime / line.ExecCount).toFixed(6)),
          totalTime  : line.ActualTime,
          hasLink    : await getHasLink(module.ModuleName)
        };

        lineSummaryList.push(lineSummary);
      }
    }
  }

  return lineSummaryList;
}
