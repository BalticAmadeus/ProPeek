import { existsSync } from "fs";
import { ModuleDetails } from "../../../common/PresentationData";
import { ProfilerRawData } from "../profilerRawData";
import { DescriptionData } from "../raw/descriptionData";
import { ModuleData } from "../raw/moduleData";
import { checkModuleFileExists, findDefaultListingFile, getFileAndProcedureName } from "./common";
import { getXRefFile } from "../../helper/xRefHelper";

/**
 * Transforms raw profiler data into presentable Module Details list
 */
export async function calculateModuleDetails(rawData: ProfilerRawData, totalSessionTime: number, profilerTitle: string, hasListings: boolean, hasXREFs: boolean): Promise<ModuleDetails[]> {

  const moduleDetailsList = [getSessionModuleDetails()] as ModuleDetails[];
  const listingFileFilterMap = getListingFileFilterList(rawData.ModuleData);

  const timesCalledByModuleId = new Map<number, number>();
  for (const node of rawData.CallGraphData ?? []) {
    timesCalledByModuleId.set(node.CalleeID, (timesCalledByModuleId.get(node.CalleeID) ?? 0) + node.CallCount);
  }

  const totalTimeByModuleId = new Map<number, number>();
  for (const line of rawData.LineSummaryData ?? []) {
    totalTimeByModuleId.set(line.ModuleID, (totalTimeByModuleId.get(line.ModuleID) ?? 0) + line.ActualTime);
  }

  for (const module of rawData.ModuleData) {
    const listingFile = hasListings ? await getListingFile(module, rawData.DescriptionData, listingFileFilterMap) : "";
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
 * @param {Map<string, string>} listingFileFilterMap file name to listing file map
 * @returns {string} listing file name
 */
export const getListingFile = async (moduleData: ModuleData, descriptionData: DescriptionData, listingFileFilterMap: Map<string, string>): Promise<string> => {
  const listingDirectoryRaw = descriptionData.Information?.Directory ?? "";
  const listingDirectory = listingDirectoryRaw ? (listingDirectoryRaw.endsWith('/') ? listingDirectoryRaw : listingDirectoryRaw + '/') : "";

  let listingFile = moduleData.ListingFile;
  if (!listingFile) {
    const { fileName } = getFileAndProcedureName(moduleData.ModuleName);
    listingFile = listingFileFilterMap.get(fileName) ?? "";
  }

  if (!listingFile) {
    return "";
  }

  const listingPath = listingDirectory + listingFile;
  if (existsSync(listingPath)) {
    return listingPath;
  }
  // fall back to the default listing directory inside the workspace
  return await findDefaultListingFile(listingFile);
};

/**
 * Builds a map of file name to listing file, so modules can inherit the listing
 * file assigned to another module of the same compiled file
 * @param {ModuleData[]} moduleDataList module data list
 * @returns {Map<string, string>} file name to listing file map
 */
export const getListingFileFilterList = (moduleDataList: ModuleData[]): Map<string, string> => {
  const listingFileFilterMap = new Map<string, string>();
  for (const moduleData of moduleDataList) {
    if (!moduleData.ListingFile) {
      continue;
    }
    const { fileName } = getFileAndProcedureName(moduleData.ModuleName);
    if (!listingFileFilterMap.has(fileName)) {
      listingFileFilterMap.set(fileName, moduleData.ListingFile);
    }
  }
  return listingFileFilterMap;
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