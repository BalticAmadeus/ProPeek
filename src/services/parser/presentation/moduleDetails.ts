import { Constants } from "../../../common/Constants";
import { ModuleDetails } from "../../../common/PresentationData";
import { ProfilerRawData } from "../profilerRawData";
import { ModuleData } from "../raw/moduleData";
import { checkModuleFileExists, getFileAndProcedureName, getWorkspaceConfig } from "./common";

interface ListingFileFilter {
  fileName: string,
  listingFile: string,
}

/**
 * Transforms raw profiler data into presentable Module Details list
 */
export async function calculateModuleDetails(rawData: ProfilerRawData, totalSessionTime: number, profilerTitle: string): Promise<ModuleDetails[]> {

  const moduleDetailsList = [getSessionModuleDetails()] as ModuleDetails[];

  const listingFileFilterList = getListingFileFilterList(rawData.ModuleData);

  for(const module of rawData.ModuleData) {
    const moduleDetails: ModuleDetails = {
      moduleID     : module.ModuleID,
      moduleName   : module.ModuleName,
      startLineNum : module.LineNum ? module.LineNum : 0,
      timesCalled  : 0,
      totalTime    : 0,
      listingFile  : getListingFile(module, listingFileFilterList),
      hasLink      : await getHasLink(rawData.ModuleData.length, module.ModuleName, profilerTitle),
    };

    for(const node of rawData.CallGraphData) {
      if (node.CalleeID === module.ModuleID) {
        moduleDetails.timesCalled = moduleDetails.timesCalled + node.CallCount;
      }
    }

    for(const line of rawData.LineSummaryData) {
      if (line.ModuleID === module.ModuleID) {
        moduleDetails.totalTime = moduleDetails.totalTime + line.ActualTime;
      }
    }

    moduleDetails.totalTime = Number((moduleDetails.totalTime).toFixed(6));
    moduleDetails.avgTimePerCall = Number((moduleDetails.totalTime / moduleDetails.timesCalled).toFixed(6));
    moduleDetailsList.push(moduleDetails);
  }

  for(const moduleDetails of moduleDetailsList) {
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
    moduleID      : 0,
    moduleName    : "Session",
    startLineNum  : 0,
    timesCalled   : 1,
    avgTimePerCall: 0,
    totalTime     : 0,
    pcntOfSession : 0,
    listingFile   : "",
    hasLink       : false,
  } as ModuleDetails;
};

/**
 * Gets the listing file. If the module does not have a listing file, tries to get it from the module,
 * which has the listing file assigned to it by fileName.
 * @param {ModuleData} moduleData module data
 * @param {ListingFileFilter[]} listingFileFilterList listing file filter array 
 * @returns {string} listing file name
 */
const getListingFile = (moduleData: ModuleData, listingFileFilterList: ListingFileFilter[]): string => {
  if (!moduleData.ListingFile) {
    const { fileName } = getFileAndProcedureName(moduleData.ModuleName);
    
    const matchedFile = listingFileFilterList.find((item) => item.fileName === fileName);

    if (matchedFile && matchedFile.listingFile) {
      return matchedFile.listingFile;
    }
  }

  return moduleData.ListingFile ?? "";
};

/**
 * Filters out the listing files and returns the array
 * @param {ModuleData[]} moduleDataList module data list 
 * @returns {ListingFileFilter[]} listing file filter array
 */
const getListingFileFilterList = (moduleDataList: ModuleData[]): ListingFileFilter[] => {
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
 * Returns the boolean value for the hasLink attribute
 * @param moduleDataLength module data length
 * @param moduleName module name
 * @param profilerTitle profiler title
 * @returns {boolean} value for hasLink attribute
 */
export const getHasLink = async (moduleDataLength: number, moduleName: string, profilerTitle: string): Promise<boolean> => {
  return moduleDataLength < Constants.fileSearchLimit 
    ? await checkModuleFileExists(moduleName, profilerTitle) 
    : (getWorkspaceConfig().length > 0 ? true : false);
};
