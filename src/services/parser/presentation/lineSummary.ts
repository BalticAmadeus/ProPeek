import { LineSummary, ModuleDetails } from "../../../common/PresentationData";
import { ProfilerRawData } from "../profilerRawData";
import { LineSummaryData } from "../raw/lineSummaryData";
import { getHasLink } from "./moduleDetails";

/**
 * Transforms raw profiler data into presentable Line Summary list
 */
export async function calculateLineSummary(rawData: ProfilerRawData, profilerTitle: string, hasListings: boolean, hasXREFs = true, moduleDetails: ModuleDetails[] = []): Promise<LineSummary[]> {
  const moduleDetailsById = new Map<number, ModuleDetails>(
    moduleDetails.map((moduleDetail) => [moduleDetail.moduleID, moduleDetail])
  );

  // group lines by module id in one pass instead of rescanning all lines per module
  const linesByModuleId = new Map<number, LineSummaryData[]>();
  for (const line of rawData.LineSummaryData ?? []) {
    linesByModuleId.get(line.ModuleID)?.push(line) ?? linesByModuleId.set(line.ModuleID, [line]);
  }

  const lineSummaryList = [] as LineSummary[];
  for (const module of rawData.ModuleData) {
    const moduleDetail = moduleDetailsById.get(module.ModuleID);
    const hasXRef = hasXREFs && !!moduleDetail?.xrefFile?.length;
    const hasLink =
      moduleDetail?.hasLink ??
      (await getHasLink(module.ModuleName, profilerTitle, hasListings && !!moduleDetail?.listingFile?.length, hasXRef));

    for (const line of linesByModuleId.get(module.ModuleID) ?? []) {
      lineSummaryList.push({
        moduleID: line.ModuleID,
        lineNumber: line.LineNo,
        timesCalled: line.ExecCount,
        avgTime: Number((line.ActualTime / line.ExecCount).toFixed(6)),
        totalTime: line.ActualTime,
        hasLink: hasLink,
      });
    }
  }

  return lineSummaryList;
}
