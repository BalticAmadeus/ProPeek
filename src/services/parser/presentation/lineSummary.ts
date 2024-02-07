import { Constants } from "../../../common/Constants";
import { LineSummary } from "../../../common/PresentationData";
import { ProfilerRawData } from "../profilerRawData";
import { getHasLink, getWorkspaceConfig } from "./common";

/**
 * Transforms raw profiler data into presentable Line Summary list
 */
export async function calculateLineSummary(rawData: ProfilerRawData, profilerTitle: string): Promise<LineSummary[]> {

  const lineSummaryList = [] as LineSummary[];

  for(const module of rawData.ModuleData) {

    const hasLink = rawData.ModuleData.length < Constants.fileSearchLimit ? await getHasLink(module.ModuleName, profilerTitle) : (getWorkspaceConfig().length > 0 ? true : false);

    for(const line of rawData.LineSummaryData) {

      if (line.ModuleID === module.ModuleID) {

        const lineSummary: LineSummary = {
          moduleID   : line.ModuleID,
          lineNumber : line.LineNo,
          timesCalled: line.ExecCount,
          avgTime    : Number((line.ActualTime / line.ExecCount).toFixed(6)),
          totalTime  : line.ActualTime,
          hasLink    : hasLink
        };

        lineSummaryList.push(lineSummary);
      }
    }
  }

  return lineSummaryList;
}
