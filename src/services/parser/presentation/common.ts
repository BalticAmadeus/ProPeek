import { existsSync } from "fs";
import * as vscode from "vscode";
import { Constants } from "../../../common/Constants";
import { IConfig } from "../../../view/app/model";

export interface FileAndProcedure {
  fileName: string;
  procedureName: string;
}

/**
 * small cache to not recalculate the values for found and not found files
 * Note: The files that are not found are very slow to search for.
 */
let foundFileCache = new Map<string, vscode.Uri | string>();
let notFoundFileCache = new Map<string, string>();

/**
 * returns true if file exists
 * @param moduleName Module name
 * @param profilerTitle Profiler file name
 * @returns
 */
export const getHasLink = async (
  moduleName: string,
  profilerTitle: string
): Promise<boolean> => {
  let { fileName } = getFileAndProcedureName(moduleName);

  if (fileName && fileName.length > 0) {
    return await fileExists(fileName, profilerTitle);
  }
  return false;
};

/**
 * Gets the file and procedure name for a given module
 * @param moduleName module
 * @returns file name and procedure name
 */
export const getFileAndProcedureName = (
  moduleName: string
): FileAndProcedure => {
  const moduleNames: string[] = moduleName.split(" ");

  const fileAndProcedure: FileAndProcedure = {
    fileName: "",
    procedureName: "",
  };

  if (moduleNames.length >= 2) {
    fileAndProcedure.procedureName = moduleNames[0];
    fileAndProcedure.fileName = moduleNames[1];
  } else {
    fileAndProcedure.fileName = moduleNames[0];
  }

  fileAndProcedure.fileName = replaceDots(fileAndProcedure.fileName);

  return fileAndProcedure;
};

/**
 * Returns the file name with an OE extension (e.g. .p, .cls)
 * @param fileName file name
 * @returns file name with OE extension
 */
export const replaceDots = (fileName: string): string => {
  const lastIndex = fileName.lastIndexOf(".");

  if (lastIndex !== -1) {
    const prefix = fileName.substring(0, lastIndex);
    const suffix = fileName.substring(lastIndex);

    if (suffix.endsWith(".p") || suffix.endsWith(".r")) {
      return prefix.replace(/\./g, "/") + ".p";
    } else {
      return fileName.replace(/\./g, "/") + ".cls";
    }
  }
  return fileName + ".cls";
};

/**
 * Updates the path string to search. Concatenates fileName with path and might add a glob pattern
 * @param fileName file name
 * @param path path
 * @returns updated search path
 */
export const convertToFilePath = (fileName: string, path: string): string => {
  if (fileName.length >= 2 && fileName[1] !== ":") {
    fileName = path + "/" + fileName;

    if (fileName.substring(0, 3) !== "**/") {
      fileName = "**/" + fileName;
    }
  }

  return fileName;
};

/**
 * Returns true or false if file exists
 * @param fileName File name to search
 * @param profilerTitle Profiler file name
 * @returns true if file exists
 */
const fileExists = async (
  fileName: string,
  profilerTitle: string
): Promise<boolean> => {
  const key = `${profilerTitle}_${fileName}`;
  const cachedValue = foundFileCache.get(key);
  const notFoundFile = notFoundFileCache.get(key);

  if (cachedValue) {
    return true;
  }
  if (notFoundFile) {
    return false;
  }

  if (existsSync(fileName)) {
    foundFileCache.set(key, fileName);
    return true;
  }

  const proPath = getProPath();

  for (const path of proPath) {
    const files = await vscode.workspace.findFiles(
      convertToFilePath(fileName, path),
      "{**/node_modules/**,**/.builder/**}"
    );
    if (files.length > 0) {
      foundFileCache.set(key, files[0]);
      return true;
    }
  }

  notFoundFileCache.set(key, fileName);

  return false;
};

/**
 * Returns the propath array
 * @returns propath array
 */
export const getProPath = (): string[] => {
  const proPath: string[] = [];

  const workspaceConnections = getWorkspaceConfig();

  workspaceConnections.forEach((connection) => {
    proPath.push(connection.path);
  });
  return proPath;
};

/**
 * Returns the worspace config
 * @returns IConfig
 */
export const getWorkspaceConfig = (): IConfig[] => {
  return (
    Constants.context.workspaceState.get<IConfig[]>(
      `${Constants.globalExtensionKey}.propath`
    ) ?? []
  );
};
