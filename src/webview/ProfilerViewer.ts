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

  // Responsible for toggling between two profiler data sets
  private isViewingAlternateProfiler = false;
  private currentViewedProfiler: "main" | "alternate" = "main";

  private proPath: string;
  private filePath: string;
  private proPath2?: string;
  private filePath2?: string;

  private readonly panel: vscode.WebviewPanel | undefined;
  private readonly configuration = vscode.workspace.getConfiguration("");
  private readonly extensionPath: string;

  private previousViewColumn: vscode.ViewColumn | undefined;
  private profilerService?: ProfilerService;

  private parsedData?: PresentationData;
  private parsedDataCache: Map<String, PresentationData> = new Map();

  constructor(
    private context: vscode.ExtensionContext,
    proPath: string,
    filePath: string,
    proPath2?: string,
    filePath2?: string
  ) {
    this.proPath = proPath;
    this.filePath = filePath;
    this.proPath2 = proPath2;
    this.filePath2 = filePath2;

    this.extensionPath = context.asAbsolutePath("");
    this.previousViewColumn = vscode.ViewColumn.One;
    this.panel = vscode.window.createWebviewPanel(
      "OEProfilerViewer",
      proPath,
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

    // Set the webview's initial html content
    this.panel.webview.html = this.getWebviewContent();

    if (filePath2 && proPath2) {
      this.toggleProfilerData();
    } else {
      this.profilerService = new ProfilerService(proPath);

      this.initProfiler(this.profilerService, filePath);
    }

    // Event listener for view column changes
    this.panel.onDidChangeViewState((event) => {
      const currentViewColumn = event.webviewPanel.viewColumn;
      if (currentViewColumn !== this.previousViewColumn) {
        if (this.proPath2 && this.filePath2) {
          this.toggleProfilerData(true);
        } else {
          this.reloadProfilerData(this.proPath, this.filePath);
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

    // Handle incoming messages from the webview
    this.panel.webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case "requestCompareFiles":
          const selectedFiles = await vscode.window.showOpenDialog({
            canSelectMany: false,
            title: "Select one profiler file to compare with your " + path.basename(this.proPath),
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
            this.setLoading(false);
            vscode.window.showErrorMessage(
              `Please select profiler file to compare with your ${path.basename(
                this.proPath
              )}.`
            );

            await this.reloadProfilerData(this.proPath, this.filePath);
            return;
          }
          const file = selectedFiles[0].fsPath;

          const updatedPath = file.replace(/\\/g, "/");

          const relativePath = vscode.workspace.asRelativePath(updatedPath);

          this.proPath2 = relativePath;
          this.filePath2 = updatedPath;

          if (this.proPath2 && this.filePath2) {
            await this.toggleProfilerData();
          }
          break;
        case "GRAPH_TYPE_CHANGE":
          if (!this.isViewingAlternateProfiler && this.filePath2 && this.proPath2) {
            await this.initProfiler(
              new ProfilerService(this.proPath2),
              this.filePath2,
              message.showStartTime
            );
          } else if (this.profilerService) {
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

  // Reloads profiler data for the given paths
  private async reloadProfilerData(
    proPath: string,
    filePath: string
  ): Promise<void> {
    if (this.profilerService && this.parsedData) {
      await this.initProfiler(this.profilerService, this.filePath);
    } else {
      if (!this.profilerService) {
        this.profilerService = new ProfilerService(proPath);
      }
      await this.initProfiler(this.profilerService, filePath);
    }
  }

   // Loads, parses and then compares two profiler data sets
  private async loadTwoProfilerData(
    proPath: string,
    filePath: string,
    proPath2: string,
    filePath2: string,
    showStartTime = false
  ): Promise<void> {
    try {
      let firstProfilerData: PresentationData;
      let secondProfilerData: PresentationData;
      const cacheKey = `${filePath}_startTime_${showStartTime}`;
      const cacheKey2 = `${filePath2}_startTime_${showStartTime}`;

      this.profilerService = new ProfilerService(proPath);
      const profilerService2 = new ProfilerService(proPath2);

      if (this.parsedDataCache.has(cacheKey)) {
        firstProfilerData = this.parsedDataCache.get(cacheKey)!;
      } else {
        firstProfilerData = await this.profilerService.parse(
          filePath,
          showStartTime
        );
        this.parsedDataCache.set(cacheKey, firstProfilerData);
      }

      if (this.parsedDataCache.has(cacheKey2)) {
        secondProfilerData = this.parsedDataCache.get(cacheKey2)!;
      } else {
        secondProfilerData = await profilerService2.parse(
          filePath2,
          showStartTime
        );
        this.parsedDataCache.set(cacheKey2, secondProfilerData);
      }

      const dataString = await this.profilerService.compare(
        firstProfilerData,
        secondProfilerData
      );
      handleErrors(this.profilerService.getErrors());
      this.panel?.webview.postMessage({
        data: dataString,
        type: "Compare Data",
        fileName: path.basename(proPath),
        fileName2: path.basename(proPath2),
      });
    } catch (error) {
      handleErrors(["Failed to Compare ProPeek Profiler"]);
    }
  }

  // Toggles between two profiler data sets, caches data for future use
  private async toggleProfilerData(reloadCurrentState = false): Promise<void> {
    this.setLoading(true);
    if (reloadCurrentState) {
      if (
        this.currentViewedProfiler === "alternate" &&
        this.proPath2 &&
        this.filePath2 &&
        this.profilerService &&
        this.profilerService.getComparedData()
      ) {
        await this.initProfiler(
          new ProfilerService(this.proPath),
          this.filePath
        );

        const dataString = this.profilerService.getComparedData()!;

        this.panel?.webview.postMessage({
          data: dataString,
          type: "Compare Data",
          fileName: path.basename(this.proPath),
          fileName2: path.basename(this.proPath2),
        });
      } else {
        if (
          this.profilerService &&
          this.profilerService.getComparedData() &&
          this.proPath2 &&
          this.filePath2
        ) {
          await this.initProfiler(
            new ProfilerService(this.proPath2),
            this.filePath2
          );
          const dataString = this.profilerService.getComparedData()!;

          this.panel?.webview.postMessage({
            data: dataString,
            type: "Compare Data",
            fileName: path.basename(this.proPath),
            fileName2: path.basename(this.proPath2),
          });
        }
      }
      this.setLoading(false);
      return;
    }

    if (!this.isViewingAlternateProfiler) {
      try {
        this.parsedData = undefined;
        this.profilerService = new ProfilerService(this.proPath);

        await this.initProfiler(this.profilerService, this.filePath);

        if (this.proPath2 && this.filePath2) {
          await this.loadTwoProfilerData(
            this.proPath,
            this.filePath,
            this.proPath2,
            this.filePath2
          );
        }

        await this.reloadProfilerData(this.proPath, this.filePath);
      } catch (error) {
        handleErrors(["Failed to reload ProPeek Profiler"]);
      }
    } else {
      try {
        if (this.proPath2 && this.filePath2) {
          this.parsedData = undefined;
          this.profilerService = new ProfilerService(this.proPath2);

          await this.initProfiler(this.profilerService, this.filePath2);

          await this.loadTwoProfilerData(
            this.proPath2,
            this.filePath2,
            this.proPath,
            this.filePath
          );

          await this.reloadProfilerData(this.proPath2, this.filePath2);
        }
      } catch (error) {
        handleErrors(["Failed to reload ProPeek Profiler"]);
      }
    }
    this.setLoading(false);
    this.isViewingAlternateProfiler = !this.isViewingAlternateProfiler;
    this.currentViewedProfiler = this.isViewingAlternateProfiler ? "alternate" : "main";
  }

  // Initializes profiler by parsing and displaying profiler data, caches data for future use
  private async initProfiler(
    profilerService: ProfilerService,
    filePath: string,
    showStartTime = false
  ): Promise<void> {
    try {
      let parsedData: PresentationData;
      const cacheKey = `${filePath}_startTime_${showStartTime}`;
      if (this.parsedDataCache.has(cacheKey)) {
        parsedData = this.parsedDataCache.get(cacheKey)!;
      } else {
        parsedData = await profilerService.parse(filePath, showStartTime);
        this.parsedDataCache.set(cacheKey, parsedData);
      }
      handleErrors(profilerService.getErrors());
      await this.panel?.webview.postMessage({
        data: parsedData,
        type: "Presentation Data",
        showStartTime,
      });
    } catch (error) {
      handleErrors(["Failed to initialize ProPeek Profiler"]);
    }
  }

  // Sets the loading state and sends a message to the webview
  private async setLoading(isLoading: boolean): Promise<void> {
    this.panel?.webview.postMessage({
      type: "setLoading",
      isLoading,
    });
  }

  // Returns HTML content for the webview
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
