import { ModuleDetails } from "../../../common/PresentationData";
import { ProfilerRawData } from "../profilerRawData";
import { DescriptionData } from "../raw/descriptionData";
import { ModuleData } from "../raw/moduleData";
import { checkModuleFileExists, getFileAndProcedureName } from "./common";
import { getXRefFile } from "../../helper/xRefHelper";

interface ListingFileFilter {
  fileName: string,
  listingFile: string,
}

/**
 * Transforms raw profiler data into presentable Module Details list
 */
export async function calculateModuleDetails(rawData: ProfilerRawData, totalSessionTime: number, profilerTitle: string, hasListings: boolean, hasXREFs: boolean): Promise<ModuleDetails[]> {

  const moduleDetailsList = [getSessionModuleDetails()] as ModuleDetails[];
  const listingFileFilterList = getListingFileFilterList(rawData.ModuleData);

  const timesCalledByModuleId = new Map<number, number>();
  for (const node of rawData.CallGraphData ?? []) {
    timesCalledByModuleId.set(node.CalleeID, (timesCalledByModuleId.get(node.CalleeID) ?? 0) + node.CallCount);
  }

  const totalTimeByModuleId = new Map<number, number>();
  for (const line of rawData.LineSummaryData ?? []) {
    totalTimeByModuleId.set(line.ModuleID, (totalTimeByModuleId.get(line.ModuleID) ?? 0) + line.ActualTime);
  }

  for (const module of rawData.ModuleData) {
    const listingFile = hasListings ? getListingFile(module, rawData.DescriptionData, listingFileFilterList) : "";
    const xrefFile = hasXREFs ? await getXRefFile(module, rawData.DescriptionData, profilerTitle) : "";

    const moduleDetails: ModuleDetails = {
      moduleID: module.ModuleID,
      moduleName: module.ModuleName,
      startLineNum: module.LineNum ? module.LineNum : 0,
      timesCalled: timesCalledByModuleId.get(module.ModuleID) ?? 0,
      totalTime: 0,
      listingFile: listingFile,
      hasLink: await getHasLink(module.ModuleName, profilerTitle, listingFile.length > 0, xrefFile.length > 0),
      xrefFile: xrefFile,
    };

    moduleDetails.totalTime = Number((totalTimeByModuleId.get(module.ModuleID) ?? 0).toFixed(6));
    moduleDetails.avgTimePerCall = moduleDetails.timesCalled
      ? Number((moduleDetails.totalTime / moduleDetails.timesCalled).toFixed(6))
      : 0;
    moduleDetailsList.push(moduleDetails);
  }

  for (const moduleDetails of moduleDetailsList) {
    moduleDetails.pcntOfSession = Number((moduleDetails.totalTime / totalSessionTime * 100).toFixed(4));
  }

  return moduleDetailsList;
}

/**
 * Gets module 'Session' with ID 0. This is not included in profiler file's module data section,
 * but is used in other sections like Call Graph and Line Summary.
 * @returns {ModuleDetails} session module details
 */
const getSessionModuleDetails = (): ModuleDetails => {
  return {
    moduleID: 0,
    moduleName: "Session",
    startLineNum: 0,
    timesCalled: 1,
    avgTimePerCall: 0,
    totalTime: 0,
    pcntOfSession: 0,
    listingFile: "",
    hasLink: false,
  } as ModuleDetails;
};

/**
 * Gets the listing file. If the module does not have a listing file, tries to get it from the module,
 * which has the listing file assigned to it by fileName.
 * @param {ModuleData} moduleData module data
 * @param {DescriptionData} descriptionData description data
 * @param {ListingFileFilter[]} listingFileFilterList listing file filter array
 * @returns {string} listing file name
 */
export const getListingFile = (moduleData: ModuleData, descriptionData: DescriptionData, listingFileFilterList: ListingFileFilter[]): string => {
  const listingDirectoryRaw = descriptionData.Information?.Directory ?? "";
  const listingDirectory = listingDirectoryRaw ? (listingDirectoryRaw.endsWith('/') ? listingDirectoryRaw : listingDirectoryRaw + '/') : "";

  if (!moduleData.ListingFile) {
    const { fileName } = getFileAndProcedureName(moduleData.ModuleName);

    const matchedFile = listingFileFilterList.find((item) => item.fileName === fileName);

    if (matchedFile?.listingFile) {
      return listingDirectory + matchedFile.listingFile;
    }
  }

  return listingDirectory ? listingDirectory + moduleData.ListingFile : moduleData.ListingFile ?? "";
};

/**
 * Filters out the listing files and returns the array
 * @param {ModuleData[]} moduleDataList module data list
 * @param {DescriptionData[]} descriptionData description data
 * @returns {ListingFileFilter[]} listing file filter array
 */
export const getListingFileFilterList = (moduleDataList: ModuleData[]): ListingFileFilter[] => {
  return moduleDataList
    .filter((moduleData) => moduleData.ListingFile)
    .map((moduleData) => {
      return {
        fileName: getFileAndProcedureName(moduleData.ModuleName).fileName,
        listingFile: moduleData.ListingFile
      } as ListingFileFilter;
    });
};

/**
 * Returns boolean value for hasListings
 * @param {ProfilerRawData} rawData raw data list
 * @returns {boolean} value for hasListings
 */
export const getHasListingFiles = (rawData: ProfilerRawData): boolean => {
  return rawData?.ModuleData?.some(module => module.ListingFile !== "");
};

/**
 * Returns the boolean value for the hasLink attribute.
 * @param moduleName module name
 * @param profilerTitle profiler title
 * @param hasListing has listing file associated
 * @param hasXRef has xref file associated
 * @returns {boolean} value for hasLink attribute
 */
export const getHasLink = async (moduleName: string, profilerTitle: string, hasListing: boolean, hasXRef: boolean): Promise<boolean> => {
  if (hasListing) {
    return true;
  }

  return hasXRef ? await checkModuleFileExists(moduleName, profilerTitle) : false;
};