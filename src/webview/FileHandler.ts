
import {
    convertToFilePath,
    getFileAndProcedureName,
    getListingFilePath,
    getProPath,
  } from "../services/parser/presentation/common";

import * as vscode from "vscode";
import { ProfilerService } from "../services/profilerService";
import { IncludeFile } from "../common/XRefData";
import * as fs from "fs";
import { Constants } from "../common/Constants";

export class FileHandler {

    static async openListing(
      listingFile: string,
      lineNumber: number
    ): Promise<void> {
      if (!listingFile) {
        return;
      }
  
      const listingFilePath = getListingFilePath(listingFile);
  
      const list = await vscode.workspace.findFiles(listingFilePath);
      if (list.length === 0) {
        vscode.window.showWarningMessage(
          `Listing file not found: ${listingFilePath}\n`
        );
        return;
      }
  
      await this.openFile(list[0], lineNumber > 0 ? lineNumber : 1);
    }
  
    static async open(
      moduleName: string,
      lineNumber: number,
      profilerService: ProfilerService
    ) {
      let { fileName, procedureName } = getFileAndProcedureName(moduleName);
      const proPath = getProPath();
  
      if (!procedureName || lineNumber < 1) {
        const filePath = await this.getFilePath(proPath, fileName);
        await this.openFile(filePath, 1);
        return;
      }
  
      const xRefFile = `**${Constants.defaultXREFPath}${fileName}.xref`;
  
      const list = await vscode.workspace.findFiles(xRefFile);
      if (list.length === 0) {
        vscode.window.showWarningMessage(
          `xRef file not found: ${xRefFile}\nLine position might be incorrect`
        );
      } else {
        const xRefPath = list[0].path.slice(1);
        const includeFiles = profilerService.getIncludeFilesFromXref(xRefPath);
  
        ({ fileName, lineNumber } = await this.getAdjustedInfo(
          includeFiles,
          proPath,
          fileName,
          lineNumber
        ));
      }
  
      const filePath = await this.getFilePath(proPath, fileName);
      await this.openFile(filePath, lineNumber);
    }
  
    static async openFile(filePath: vscode.Uri, lineNumber: number) {
      const doc = await vscode.workspace.openTextDocument(filePath);
  
      vscode.window.showTextDocument(doc, {
        selection: new vscode.Range(lineNumber - 1, 0, lineNumber - 1, 0),
      });
    }
  
    static async getAdjustedInfo(
      includeFiles: IncludeFile[],
      proPath: string[],
      fileName: string,
      lineNumber: number
    ): Promise<{ fileName: string; lineNumber: number }> {
      for (const includeFile of includeFiles) {
        if (lineNumber < includeFile.includeLine) {
          break;
        } else {
          let includeFilePath = await this.getFilePath(
            proPath,
            includeFile.includeFileName
          );
          let includeLineCount = this.countLinesInFile(
            includeFilePath.path.slice(1)
          );
  
          let includeEndLine = includeLineCount + includeFile.includeLine;
  
          if (lineNumber < includeEndLine) {
            fileName = includeFile.includeFileName;
            lineNumber = lineNumber - includeFile.includeLine;
            break;
          } else {
            lineNumber -= includeLineCount;
          }
        }
      }
  
      return { fileName, lineNumber };
    }
  
    static countLinesInFile(filePath: string): number {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const lines = fileContent.split("\n");
      let lineCount = lines.length;
  
      if (lines[lineCount - 1] !== "") lineCount++;
  
      return lineCount;
    }
  
    static async getFilePath(
      proPath: string[],
      fileName: string
    ): Promise<vscode.Uri> {
      if (fs.existsSync(fileName)) {
        return Promise.resolve(vscode.Uri.file(fileName));
      }
  
      if (proPath) {
        for (const path of proPath) {
          const files = await vscode.workspace.findFiles(
            convertToFilePath(fileName, path)
          );
          if (files.length > 0) {
            return files[0];
          }
        }
        vscode.window.showErrorMessage("File not found: " + fileName);
      }
      return Promise.resolve(vscode.Uri.file(""));
    }
  }
