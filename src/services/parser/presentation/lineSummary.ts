import { LineSummary, ModuleDetails } from "../../../common/PresentationData";
import { ProfilerRawData } from "../profilerRawData";
import { getHasLink, getListingFile, getListingFileFilterList } from "./moduleDetails";

/**
 * Transforms raw profiler data into presentable Line Summary list
 */
export async function calculateLineSummary(rawData: ProfilerRawData, profilerTitle: string, hasListings: boolean, hasXREFs = true, moduleDetails: ModuleDetails[] = []): Promise<LineSummary[]> {

  const lineSummaryList = [] as LineSummary[];

  const listingFileFilterList = getListingFileFilterList(rawData.ModuleData);

  const moduleDetailsById = new Map<number, ModuleDetails>(
    moduleDetails.map((moduleDetail) => [moduleDetail.moduleID, moduleDetail])
  );

  for (const module of rawData.ModuleData) {
    const listingFile = getListingFile(module, rawData.DescriptionData, listingFileFilterList);
    const hasListing = hasListings && listingFile.length > 0;
    const moduleDetail = moduleDetailsById.get(module.ModuleID);
    const hasXRef = hasXREFs && !!moduleDetail?.xrefFile?.length;

    // Reuse the precomputed value from calculateModuleDetails when available
    const hasLink = moduleDetail
      ? moduleDetail.hasLink
      : await getHasLink(module.ModuleName, profilerTitle, hasListing, hasXRef);

    for (const line of rawData.LineSummaryData) {

      if (line.ModuleID === module.ModuleID) {

        const lineSummary: LineSummary = {
          moduleID: line.ModuleID,
          lineNumber: line.LineNo,
          timesCalled: line.ExecCount,
          avgTime: Number((line.ActualTime / line.ExecCount).toFixed(6)),
          totalTime: line.ActualTime,
          hasLink: hasLink,
        };

        lineSummaryList.push(lineSummary);
      }
    }
  }

  return lineSummaryList;
}
