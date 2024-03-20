import { LineSummary } from "../../../common/PresentationData";
import { ProfilerRawData } from "../profilerRawData";
import { getHasLink } from "./moduleDetails";

/**
 * Transforms raw profiler data into presentable Line Summary list
 */
export async function calculateLineSummary(rawData: ProfilerRawData, profilerTitle: string): Promise<LineSummary[]> {

  const lineSummaryList = [] as LineSummary[];

  for(const module of rawData.ModuleData) {

    const hasLink = await getHasLink(rawData.ModuleData.length, module.ModuleName, profilerTitle);

    for(const line of rawData.LineSummaryData) {

      if (line.ModuleID === module.ModuleID) {

        const lineSummary: LineSummary = {
          moduleID   : line.ModuleID,
          lineNumber : line.LineNo,
          timesCalled: line.ExecCount,
          avgTime    : Number((line.ActualTime / line.ExecCount).toFixed(6)),
          totalTime  : line.ActualTime,
          hasLink    : hasLink,
        };

        lineSummaryList.push(lineSummary);
      }
    }
  }

  return lineSummaryList;
}
