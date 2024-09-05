import path = require("path");
import * as vscode from "vscode";
import { ProfilerService } from "../services/profilerService";
import { PresentationData } from "../common/PresentationData";
import { IncludeFile } from "../common/XRefData";
import * as fs from "fs";
import {
  convertToFilePath,
  getFileAndProcedureName,
  getListingFilePath,
  getProPath,
} from "../services/parser/presentation/common";
import { Constants } from "../common/Constants";
import { OpenFileTypeEnum } from "../common/openFile";

interface Message {
  showStartTime: any;
  moduleName: string;
}

export class ProfilerViewer {
  private isAlternate = false;
  private action: string;
  private filePath: string;
  private action2?: string;
  private filePath2?: string;
  private readonly panel: vscode.WebviewPanel | undefined;
  private readonly configuration = vscode.workspace.getConfiguration("");
  private readonly extensionPath: string;
  private previousViewColumn: vscode.ViewColumn | undefined;
  private profilerServiceCache: Map<string, ProfilerService> = new Map();
  private profilerService?: ProfilerService;

  constructor(
    private context: vscode.ExtensionContext,
    action: string,
    filePath: string,
    action2?: string,
    filePath2?: string
  ) {
    this.action = action;
    this.filePath = filePath;
    this.action2 = action2;
    this.filePath2 = filePath2;

    this.extensionPath = context.asAbsolutePath("");
    this.previousViewColumn = vscode.ViewColumn.One;
    this.panel = vscode.window.createWebviewPanel(
      "OEProfilerViewer",
      action,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(context.asAbsolutePath(""), "out")),
        ],
      }
    );

    this.panel.iconPath = {
      dark: vscode.Uri.file(
        path.join(
          this.extensionPath,
          "resources",
          "icon",
          "query-icon-dark.svg"
        )
      ),
      light: vscode.Uri.file(
        path.join(
          this.extensionPath,
          "resources",
          "icon",
          "query-icon-light.svg"
        )
      ),
    };

    this.panel.webview.html = this.getWebviewContent();

    if (filePath2 && action2) {
      this.toggleProfilerData();
    } else {
      this.profilerService = new ProfilerService(action);

      this.initProfiler(this.profilerService, filePath);
    }

    this.panel.onDidChangeViewState((event) => {
      const currentViewColumn = event.webviewPanel.viewColumn;
      if (currentViewColumn !== this.previousViewColumn) {
        if (this.action2 && this.filePath2) {
          this.toggleProfilerData();
        } else {
          this.reloadProfilerData(action, filePath);
        }
        this.previousViewColumn = currentViewColumn;
      }
    });

    this.panel.onDidDispose(
      () => {
        // When the panel is closed, cancel any future updates to the webview content
      },
      null,
      context.subscriptions
    );

    this.panel.webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case "requestCompareFiles":
          const selectedFiles = await vscode.window.showOpenDialog({
            canSelectMany: false,
            openLabel: "Select Profiler File",
            filters: {
              "Profiler Files": ["prof", "out"],
            },
          });

          if (
            !selectedFiles ||
            selectedFiles.length !== 1 ||
            selectedFiles === undefined
          ) {
            vscode.window.showErrorMessage(
              `Please select profiler file to compare with your ${path.basename(
                this.action
              )}.`
            );

            await this.reloadProfilerData(this.action, this.filePath);
            return;
          }
          const file = selectedFiles[0].fsPath;

          const updatedPath = file.replace(/\\/g, "/");

          const relativePath = vscode.workspace.asRelativePath(updatedPath);

          this.action2 = relativePath;
          this.filePath2 = updatedPath;

          if (this.action2 && this.filePath2) {
            await this.toggleProfilerData();
          }
          break;
        case "GRAPH_TYPE_CHANGE":
          if (this.profilerService) {
            await this.initProfiler(
              this.profilerService,
              this.filePath,
              message.showStartTime
            );
          }
          break;
        case OpenFileTypeEnum.XREF:
          if (this.profilerService) {
            await open(message.name, message.lineNumber, this.profilerService);
          }
          break;
        case OpenFileTypeEnum.LISTING:
          await openListing(message.listingFile, message.lineNumber);
          break;
        case "TOGGLE_PROFILER":
          await this.toggleProfilerData();
          break;
        default:
      }
    });
  }

  private getProfilerService(action: string): ProfilerService {
    if (!this.profilerServiceCache.has(action)) {
      this.profilerServiceCache.set(action, new ProfilerService(action));
    }
    return this.profilerServiceCache.get(action)!;
  }

  private async reloadProfilerData(
    action: string,
    filePath: string
  ): Promise<void> {
    const profilerService = this.getProfilerService(action);
    await this.initProfiler(profilerService, filePath);
  }

  private async loadTwoProfilerData(
    action: string,
    filePath: string,
    action2: string,
    filePath2: string,
    showStartTime = false
  ): Promise<void> {
    try {
      this.profilerService = new ProfilerService(action);
      const firstProfilerData = await this.profilerService.parse(
        filePath,
        showStartTime
      );

      const profilerService2 = new ProfilerService(action2);
      const secondProfilerData = await profilerService2.parse(
        filePath2,
        showStartTime
      );

      const dataString = await this.profilerService.compare(
        firstProfilerData,
        secondProfilerData
      );
      handleErrors(this.profilerService.getErrors());
      this.panel?.webview.postMessage({
        data: dataString,
        type: "Compare Data",
        fileName: path.basename(action),
        fileName2: path.basename(action2),
      });
    } catch (error) {
      handleErrors(["Failed to Compare ProPeek Profiler"]);
    }
  }
  private async toggleProfilerData(): Promise<void> {
    if (!this.isAlternate) {
      try {
        if (this.action2 && this.filePath2) {
          await this.loadTwoProfilerData(
            this.action,
            this.filePath,
            this.action2,
            this.filePath2
          );
        }

        await this.reloadProfilerData(this.action, this.filePath);
      } catch (error) {
        handleErrors(["Failed to reload ProPeek Profiler"]);
      }
    } else {
      try {
        if (this.action2 && this.filePath2) {
          await this.loadTwoProfilerData(
            this.action2,
            this.filePath2,
            this.action,
            this.filePath
          );

          await this.reloadProfilerData(this.action2, this.filePath2);
        }
      } catch (error) {
        handleErrors(["Failed to reload ProPeek Profiler"]);
      }
    }

    this.isAlternate = !this.isAlternate;
  }

  private async initProfiler(
    profilerService: ProfilerService,
    filePath: string,
    showStartTime = false
  ): Promise<void> {
    try {
      const dataString = await profilerService.parse(filePath, showStartTime);

      handleErrors(profilerService.getErrors());
      this.panel?.webview.postMessage(dataString);
    } catch (error) {
      handleErrors(["Failed to initialize ProPeek Profiler"]);
    }
  }

  private getWebviewContent(): string {
    const reactAppPathOnDisk = vscode.Uri.file(
      path.join(
        vscode.Uri.file(
          this.context.asAbsolutePath(path.join("out/view/app", "profiler.js"))
        ).fsPath
      )
    );

    const reactAppUri = this.panel?.webview.asWebviewUri(reactAppPathOnDisk);
    const cspSource = this.panel?.webview.cspSource;

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Config View</title>
        <meta http-equiv="Content-Security-Policy"
              content="default-src 'none';
                      img-src https:;
                      script-src 'unsafe-eval' 'unsafe-inline' ${cspSource};
                      style-src ${cspSource} 'unsafe-inline';">

        <script>
        </script>
    </head>
    <body>
        <div id="root"></div>
        <script src="${reactAppUri}"></script>
    </body>
    </html>`;
  }
}

function handleErrors(errors: string[]) {
  if (errors.length > 0) {
    errors.forEach((error) => {
      vscode.window.showErrorMessage(error);
    });
  }
}

async function openListing(
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

  await openFile(list[0], lineNumber > 0 ? lineNumber : 1);
}

async function open(
  moduleName: string,
  lineNumber: number,
  profilerService: ProfilerService
) {
  let { fileName, procedureName } = getFileAndProcedureName(moduleName);
  const proPath = getProPath();

  if (!procedureName || lineNumber < 1) {
    const filePath = await getFilePath(proPath, fileName);
    await openFile(filePath, 1);
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

    ({ fileName, lineNumber } = await getAdjustedInfo(
      includeFiles,
      proPath,
      fileName,
      lineNumber
    ));
  }

  const filePath = await getFilePath(proPath, fileName);
  await openFile(filePath, lineNumber);
}

async function openFile(filePath: vscode.Uri, lineNumber: number) {
  const doc = await vscode.workspace.openTextDocument(filePath);

  vscode.window.showTextDocument(doc, {
    selection: new vscode.Range(lineNumber - 1, 0, lineNumber - 1, 0),
  });
}

async function getAdjustedInfo(
  includeFiles: IncludeFile[],
  proPath: string[],
  fileName: string,
  lineNumber: number
): Promise<{ fileName: string; lineNumber: number }> {
  for (const includeFile of includeFiles) {
    if (lineNumber < includeFile.includeLine) {
      break;
    } else {
      let includeFilePath = await getFilePath(
        proPath,
        includeFile.includeFileName
      );
      let includeLineCount = countLinesInFile(includeFilePath.path.slice(1));

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

function countLinesInFile(filePath: string): number {
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const lines = fileContent.split("\n");
  let lineCount = lines.length;

  if (lines[lineCount - 1] !== "") lineCount++;

  return lineCount;
}

async function getFilePath(
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
