import path = require("path");
import * as vscode from "vscode";
import { ProfilerService } from "../services/profilerService";
import { PresentationData } from "../common/PresentationData";
import { ProfilerWebview } from "./ProfilerWebView";
import { FileHandler } from "./FileHandler";
import { OpenFileTypeEnum } from "../common/openFile";

interface Message {
  showStartTime: any;
  moduleName: string;
}

export class ProfilerViewer {
  private isViewingAlternateProfiler = false;
  private currentViewedProfiler: "main" | "alternate" = "main";

  private proPath: string;
  private filePath: string;
  private proPath2?: string;
  private filePath2?: string;

  private previousViewColumn: vscode.ViewColumn | undefined;
  private profilerService?: ProfilerService;

  private parsedData?: PresentationData;
  private parsedDataCache: Map<String, PresentationData> = new Map();

  // Webview Instance
  private webview: ProfilerWebview;

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

    this.previousViewColumn = vscode.ViewColumn.One;

    // Create Webview Instance
    this.webview = new ProfilerWebview(context, this.proPath, this.proPath2);

    if (filePath2 && proPath2) {
      this.toggleProfilerData();
    } else {
      this.profilerService = new ProfilerService(proPath);
      this.initProfiler(this.profilerService, filePath);
    }

    // Event listener for view column changes (using webview instance)
    this.webview.panel.onDidChangeViewState((event) => {
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

    // Handle incoming messages from the webview (using webview instance)
    this.webview.panel.webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case "readFile":
          const receivedModuleName = message.filePath;
          const receivedListingFile = message.listingFile;
          const receivedFileType = message.openFileType;
          const fileContent = await FileHandler.getFileContent(
            receivedModuleName,
            receivedListingFile,
            receivedFileType
          );

          this.webview.panel?.webview.postMessage({
            type: "fileContent",
            content: fileContent,
          });

          break;

        case "requestCompareFiles":
          const selectedFiles = await vscode.window.showOpenDialog({
            canSelectMany: false,
            title:
              "Select one profiler file to compare with your " +
              path.basename(this.proPath),
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
            this.webview.setLoading(false);
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
          if (
            !this.isViewingAlternateProfiler &&
            this.filePath2 &&
            this.proPath2
          ) {
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
            await FileHandler.open(
              message.name,
              message.lineNumber,
              this.profilerService
            );
          }
          break;
        case OpenFileTypeEnum.LISTING:
          await FileHandler.openListing(
            message.listingFile,
            message.lineNumber
          );
          break;
        case "TOGGLE_PROFILER":
          await this.toggleProfilerData();
          break;
        case "THEME":
          this.sendThemeToWebview();
          break;
        default:
      }
    });
    vscode.window.onDidChangeActiveColorTheme(() => this.sendThemeToWebview());
  }

  private sendThemeToWebview() {
    const currentTheme = vscode.window.activeColorTheme.kind;
    this.webview.panel?.webview.postMessage({
      type: "themeChange",
      themeKind: currentTheme,
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
      this.webview.panel?.webview.postMessage({
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
        this.profilerService!.getComparedData()
      ) {
        await this.initAndSendProfilerData(this.proPath, this.filePath);
      } else if (this.profilerService!.getComparedData()) {
        await this.initAndSendProfilerData(this.proPath2!, this.filePath2!);
      }
    } else {
      await this.toggleProfilerView();
    }

    this.setLoading(false);
  }

  private async toggleProfilerView(): Promise<void> {
    try {
      if (!this.isViewingAlternateProfiler) {
        await this.switchToMainProfiler();
      } else if (this.proPath2 && this.filePath2) {
        await this.switchToAlternateProfiler();
      }
    } catch (error) {
      handleErrors(["Failed to reload ProPeek Profiler"]);
    }

    this.isViewingAlternateProfiler = !this.isViewingAlternateProfiler;
    this.currentViewedProfiler = this.isViewingAlternateProfiler
      ? "alternate"
      : "main";

    this.updateWebviewPanelTitle();
  }

  // Updates the webview panel tab title
  private updateWebviewPanelTitle() {
    let newTitle = "";

    if (this.proPath2) {
      newTitle = this.isViewingAlternateProfiler
        ? `${path.basename(this.proPath)} \u21C4 ${path.basename(
            this.proPath2
          )}`
        : `${path.basename(this.proPath2)} \u21C4 ${path.basename(
            this.proPath
          )}`;
    } else {
      newTitle = this.proPath;
    }
    this.webview.updatePanelTitle(newTitle);
  }

  private async switchToMainProfiler(): Promise<void> {
    this.parsedData = undefined;
    this.profilerService = new ProfilerService(this.proPath);
    await this.initProfiler(this.profilerService, this.filePath);

    await this.loadTwoProfilerData(
      this.proPath,
      this.filePath,
      this.proPath2!,
      this.filePath2!
    );

    await this.reloadProfilerData(this.proPath, this.filePath);
  }

  private async switchToAlternateProfiler(): Promise<void> {
    this.parsedData = undefined;
    this.profilerService = new ProfilerService(this.proPath2!);
    await this.initProfiler(this.profilerService, this.filePath2!);

    await this.loadTwoProfilerData(
      this.proPath2!,
      this.filePath2!,
      this.proPath,
      this.filePath
    );
    await this.reloadProfilerData(this.proPath2!, this.filePath2!);
  }

  private async initAndSendProfilerData(
    proPath: string,
    filePath: string
  ): Promise<void> {
    await this.initProfiler(new ProfilerService(proPath), filePath);
    if (this.profilerService) {
      const dataString = this.profilerService.getComparedData()!;

      this.webview.panel?.webview.postMessage({
        data: dataString,
        type: "Compare Data",
        fileName: path.basename(this.proPath),
        fileName2: path.basename(this.proPath2!),
      });
    }
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
      await this.webview.panel?.webview.postMessage({
        data: parsedData,
        type: "Presentation Data",
        showStartTime,
      });
    } catch (error) {
      handleErrors(["Failed to initialize ProPeek Profiler"]);
    }
  }

  // Sets the loading state
  private async setLoading(isLoading: boolean): Promise<void> {
    this.webview.setLoading(isLoading);
  }
}

function handleErrors(errors: string[]) {
  if (errors.length > 0) {
    errors.forEach((error) => {
      vscode.window.showErrorMessage(error);
    });
  }
}
