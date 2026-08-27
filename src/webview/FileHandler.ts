import {
  getFileAndProcedureName,
  getListingFilePath,
  getCombinedProPath,
  findFileInProPath,
} from "../services/parser/presentation/common";

import * as vscode from "vscode";
import {
  getDefinitionRecordsFromXrefFile,
  findModuleDefinitionRecord,
  DefinitionRecord,
} from "../services/helper/xRefHelper";
import * as fs from "fs";
import { OpenFileTypeEnum } from "../common/openFile";
import path from "path";
import { DescriptionData } from "../services/parser/raw/descriptionData";

export class FileHandler {

  private static filePathCache = new Map<string, vscode.Uri>();

  static async openListing(
    listingFile: string,
    lineNumber: number
  ): Promise<void> {
    if (!listingFile) {
      return;
    }

    const list = await FileHandler.findListingFile(listingFile);
    if (!list || (Array.isArray(list) && list.length === 0)) {
      return;
    }

    if (Array.isArray(list) && list.length > 0) {
      await this.openFile(list[0], lineNumber > 0 ? lineNumber : 1);
    } else if (list) {
      await this.openFile(list as vscode.Uri, lineNumber > 0 ? lineNumber : 1);
    }
  }

  static async findListingFile(
    listingFile: string
  ): Promise<vscode.Uri | vscode.Uri[] | null> {

    if (!listingFile) {
      return null;
    }

    if (fs.existsSync(listingFile)) {
      return vscode.Uri.file(listingFile);
    } else {
      const baseFileName = path.basename(listingFile);
      const listingFilePath = getListingFilePath(baseFileName);
      return vscode.workspace.findFiles(listingFilePath);
    }
  }

  static async open(
    moduleName: string,
    lineNumber: number,
    xrefFile: string,
    descriptionData?: DescriptionData,
    occurrenceIndex?: number
  ) {
    let { fileName, procedureName } = getFileAndProcedureName(moduleName);
    const proPath = getCombinedProPath(descriptionData);

    if (!procedureName || lineNumber < 1) {
      const filePath = await this.getFilePath(proPath, fileName);
      if (!filePath.fsPath) {
        vscode.window.showErrorMessage("File not found: " + fileName);
        return;
      }
      await this.openFile(filePath, 1);
      return;
    }

    if (xrefFile && fs.existsSync(xrefFile)) {
      const resolved = await this.resolveByDefinitionRecords(
        proPath,
        xrefFile,
        fileName,
        procedureName,
        occurrenceIndex ?? 0
      );
      if (resolved) {
        await this.openFile(resolved.filePath, resolved.lineNumber);
        return;
      }
    }

    const filePath = await this.getFilePath(proPath, fileName);
    if (!filePath.fsPath) {
      vscode.window.showErrorMessage("File not found: " + fileName);
      return;
    }
    await this.openFile(filePath, lineNumber);
  }

  static async openFile(filePath: vscode.Uri, lineNumber: number) {
    const doc = await vscode.workspace.openTextDocument(filePath);

    vscode.window.showTextDocument(doc, {
      selection: new vscode.Range(lineNumber - 1, 0, lineNumber - 1, 0),
    });
  }

  static async readFile(filePath: string): Promise<string> {
    await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
    const fileContent = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
    return fileContent.toString();
  }

  static async getFilePath(
    proPath: string[],
    fileName: string
  ): Promise<vscode.Uri> {
    const cacheKey = `${proPath.join("|")}::${fileName}`;
    const cached = this.filePathCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const resolved = await findFileInProPath(proPath, fileName);
    this.filePathCache.set(cacheKey, resolved);
    return resolved;
  }

  /** Normalizes a file reference into a grouping key: base name only, lowercased. */
  private static baseNameKey(value: string): string {
    const posix = (value ?? "").replace(/\\/g, "/");
    return posix.slice(posix.lastIndexOf("/") + 1).toLowerCase();
  }

  /**
   * Resolves an xref record's file reference against the workspace folders.
   */
  private static resolveRecordFileRelativeToWorkspace(
    recordFileName: string
  ): vscode.Uri | undefined {
    const normalized = (recordFileName ?? "").replace(/\\/g, "/");
    if (!normalized) {
      return undefined;
    }
    if (path.isAbsolute(normalized)) {
      return fs.existsSync(normalized) ? vscode.Uri.file(normalized) : undefined;
    }
    for (const folder of vscode.workspace.workspaceFolders ?? []) {
      const candidate = path.join(folder.uri.fsPath, normalized);
      if (fs.existsSync(candidate)) {
        return vscode.Uri.file(candidate);
      }
    }
    return undefined;
  }

  /**
   * Exact module position via xref DEFINITION records.
   */
  private static async resolveByDefinitionRecords(
    proPath: string[],
    xrefFile: string,
    fileName: string,
    procedureName: string,
    occurrenceIndex: number
  ): Promise<{ filePath: vscode.Uri; lineNumber: number; content: string } | null> {
    try {
      const defs = getDefinitionRecordsFromXrefFile(xrefFile);
      const record = findModuleDefinitionRecord(
        defs,
        fileName,
        procedureName,
        occurrenceIndex
      );
      if (!record) {
        return null;
      }

      const baseName = path.basename(record.fileName.replace(/\\/g, "/"));
      const filePath = this.resolveRecordFileRelativeToWorkspace(record.fileName) ??
        (await this.getFilePath(proPath, baseName));
      if (!filePath || !filePath.fsPath) {
        return null;
      }

      const content = await this.readFile(filePath.fsPath);
      const contentLines = content.split("\n");

      let declarationLine = this.findDeclarationLineInContent(
        contentLines,
        defs,
        record,
        procedureName
      );
      if (!declarationLine) {
        return null;
      }

      return { filePath, lineNumber: declarationLine, content };
    } catch {
      return null;
    }
  }

  /**
   * Backward declaration scan bounded by the previous definition's end.
   */
  private static findDeclarationLineInContent(
    contentLines: string[],
    defs: DefinitionRecord[],
    record: DefinitionRecord,
    procedureName: string
  ): number | undefined {
    const siblings = defs
      .filter(
        (d) =>
          FileHandler.baseNameKey(d.fileName) ===
          FileHandler.baseNameKey(record.fileName)
      )
      .sort((a, b) => a.endLine - b.endLine);
    const index = siblings.indexOf(record);
    if (index < 0) {
      return undefined;
    }

    const lowerBound = index > 0 ? siblings[index - 1].endLine : 0;

    const escaped = procedureName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const declarationPattern = new RegExp(
      "^\\s*(PROCEDURE|FUNCTION|METHOD|CONSTRUCTOR|DESTRUCTOR)\\s+\"?" +
      escaped +
      "\\b",
      "i"
    );
    const commentPattern = /^\s*(\/\/|\/\*|\*|--)/;

    const lastIndex = Math.min(record.endLine - 1, contentLines.length - 1);
    for (let i = lastIndex; i >= lowerBound && i >= 0; i--) {
      const line = contentLines[i];
      if (commentPattern.test(line)) {
        continue;
      }
      if (declarationPattern.test(line)) {
        return i + 1;
      }
    }
    return undefined;
  }

  static async getFileContent(
    moduleName: string,
    listingFile: string,
    fileType: OpenFileTypeEnum,
    descriptionData?: DescriptionData,
    xrefFile?: string,
    lineNumber?: number,
    occurrenceIndex?: number
  ): Promise<{ content: string; lineNumber?: number }> {

    const { fileName, procedureName } = getFileAndProcedureName(moduleName);
    const proPath = getCombinedProPath(descriptionData);
    let filePath = vscode.Uri.file("");

    switch (fileType) {
      case OpenFileTypeEnum.XREF: {
        if (
          procedureName &&
          lineNumber &&
          lineNumber >= 1 &&
          xrefFile &&
          fs.existsSync(xrefFile)
        ) {
          const resolved = await this.resolveByDefinitionRecords(
            proPath,
            xrefFile,
            fileName,
            procedureName,
            occurrenceIndex ?? 0
          );
          if (resolved) {
            return {
              content: resolved.content,
              lineNumber: resolved.lineNumber,
            };
          }
        }

        filePath = await this.getFilePath(proPath, fileName);

        const content = await this.readFile(filePath.fsPath);
        return { content, lineNumber };
      }
      case OpenFileTypeEnum.LISTING: {
        const listingFiles = await FileHandler.findListingFile(listingFile);

        if (Array.isArray(listingFiles) && listingFiles.length > 0) {
          filePath = listingFiles[0];
        } else if (listingFiles) {
          filePath = listingFiles as vscode.Uri;
        } else {
          throw new Error('File not found: ' + filePath);
        }

        const fileContent = await this.readFile(filePath.fsPath);
        const cleanedContent = fileContent
          .split('\n')
          .map(line => {
            return line.replace(/^\s*\d+\s{3}/, '');
          })
          .join('\n');

        return { content: cleanedContent };
      }
    }
  }
}
