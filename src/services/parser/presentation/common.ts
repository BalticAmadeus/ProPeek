import { existsSync } from "fs";
import * as vscode from "vscode";
import { Constants } from "../../../common/Constants";
import { IConfig } from "../../../view/app/model";
import { DescriptionData } from "../raw/descriptionData";

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
 * returns true if file for module exists
 * @param moduleName Module name
 * @param profilerTitle Profiler file name
 * @returns
 */
export const checkModuleFileExists = async (
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

export const getListingFilePath = (listingFileName: string) => {
  const listingPath = "listing";
  return `**/${listingPath}/${listingFileName}`;
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
 * Converts a file name to posix style (forward slashes)
 * @param fileName file name
 * @returns posix style file name
 */
const toPosixFileName = (fileName: string): string => fileName.replace(/\\/g, "/");

/**
 * Checks whether the given path is absolute (drive letter or leading slash)
 * @param value path value
 * @returns true if the path is absolute
 */
const isAbsolutePath = (value: string): boolean =>
  (value.length >= 2 && value[1] === ":") || value.startsWith("/");

/**
 * Searches for a file inside the propath entries.
 * @param proPath combined propath array
 * @param fileName file name to resolve (e.g. "app/file.p")
 * @returns resolved uri or empty uri when not found
 */
export const findFileInProPath = async (
  proPath: string[],
  fileName: string
): Promise<vscode.Uri> => {
  const posixFileName = toPosixFileName(fileName);

  // Fully qualified file name - no search needed
  if (existsSync(fileName)) {
    return vscode.Uri.file(fileName);
  }

  for (const proPathEntry of proPath ?? []) {
    if (!proPathEntry) {
      continue;
    }

    const normalizedEntry = toPosixFileName(trimSlashesLocal(proPathEntry));
    if (!normalizedEntry) {
      continue;
    }

    // Absolute propath entries point outside the workspace - glob patterns
    // cannot reach them, so check the file system directly
    if (isAbsolutePath(normalizedEntry)) {
      const candidate = `${normalizedEntry}/${posixFileName}`;
      if (existsSync(candidate)) {
        return vscode.Uri.file(candidate);
      }
      continue;
    }

    // Exact location - "<propath-entry>/<fileName>".
    for (const folder of vscode.workspace.workspaceFolders ?? []) {
      const candidate = `${toPosixFileName(folder.uri.fsPath)}/${normalizedEntry}/${posixFileName}`;
      if (existsSync(candidate)) {
        return vscode.Uri.file(candidate);
      }
    }
  }

  return vscode.Uri.file("");
};

const trimSlashesLocal = (value: string): string => value.replace(/^\/+|\/+$/g, "");

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

  const found = await findFileInProPath(getProPath(), fileName);
  if (found.fsPath) {
    foundFileCache.set(key, found);
    return true;
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
 * Splits the profiler's Propath string into individual entries
 * @param propath Propath string from DescriptionInformation
 * @returns array of propath entries
 */
export const getProPathFromDescription = (propath: string): string[] => {
  if (!propath) {
    return [];
  }

  return propath
    .split(/[;,]/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
};

/**
 * Returns the combined propath array from the workspace config and the profiler's description data
 * @param descriptionData profiler description data
 * @returns combined propath array
 */
export const getCombinedProPath = (
  descriptionData?: DescriptionData
): string[] => {
  const proPath = getProPath();

  const descriptionProPath = getProPathFromDescription(
    descriptionData?.Information?.Propath ?? ""
  );

  descriptionProPath.forEach((entry) => {
    if (!proPath.includes(entry)) {
      proPath.push(entry);
    }
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
