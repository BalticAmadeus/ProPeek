import path = require("path");
import * as vscode from "vscode";
import { ProfilerService } from "../services/profilerService";
import { PresentationData } from "../common/PresentationData";
import { IConfig } from "../view/app/model";
import { Constants } from "../common/Constants";

export class ProfilerViewer {
    private readonly panel: vscode.WebviewPanel | undefined;
    private readonly configuration = vscode.workspace.getConfiguration("");
    private readonly extensionPath: string;

    constructor(private context: vscode.ExtensionContext, action: string, filePath: string,) {

        this.extensionPath = context.asAbsolutePath("");
        this.panel = vscode.window.createWebviewPanel(
            'OEProfilerViewer', // Identifies the type of the webview. Used internally
            action, // Title of the panel displayed to the user
            vscode.ViewColumn.One, // Editor column to show the new webview panel in.
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(context.asAbsolutePath(''), "out"))
                ]
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

        this.panel.webview.html = this.getWebviewContent({
            moduleDetails: [], callingModules: [], calledModules: [], lineSummary: [],
            callTree: []
        });

        this.panel.onDidDispose(
            () => {
                // When the panel is closed, cancel any future updates to the webview content
            },
            null,
            context.subscriptions
        );

        const profilerService = new ProfilerService();

        var dataString = profilerService.parse(filePath);

        this.panel?.webview.postMessage(dataString);

        function convertToFilePath(fileName: string, path: string) {

            let filePath: string;
            const fileNames : string[] = fileName.split(" ");

            if(fileNames.length >= 2 ) {
                filePath = fileNames[1];
            }
            else {
                filePath = fileNames[0];
            }

            if (filePath.length >= 2 && filePath[1] !== ":") {
                filePath =path + "/" + filePath;

                if (filePath.substring(0, 3) !== "**/") {
                    filePath = "**/" + filePath;
                }
            }
                filePath = filePath.replace(/\./g, "/");
                filePath = filePath + ".cls";
                return filePath;
        }

        this.panel.webview.onDidReceiveMessage(
            (fileName) => {
                const workspaceConnections = this.context.workspaceState.get<{
                    [key: string]: IConfig;
                  }>(`${Constants.globalExtensionKey}.propaths`);

                  console.log("workspaceConnections", workspaceConnections);
                  let fileFound = false;
                  let num = 0;
                  let listNum = 0;
                  if (workspaceConnections) {
                    for (const id of Object.keys(workspaceConnections)) {
                        let proPath = workspaceConnections[id].path;
                        num ++;
                        vscode.workspace.findFiles(convertToFilePath(fileName.columns, proPath))
                        .then(async (list) => {
                            listNum ++;
                            if(list.length === 0) {
                            }
                            else {
                                fileFound = true;
                                const doc = await vscode.workspace.openTextDocument(list[0]);
                                vscode.window.showTextDocument(doc);
                                return;
                            }
                            if (!fileFound && num === listNum) {
                                vscode.window.showErrorMessage(
                                    "File not found: " + fileName.columns
                                  );
                                  return;
                            }
                        });
                    }
                  }
            }
        );
    }

    private getWebviewContent(data: PresentationData): string {
        // Local path to main script run in the webview
        const reactAppPathOnDisk = vscode.Uri.file(
            path.join(vscode.Uri.file(this.context.asAbsolutePath(path.join("out/view/app", "profiler.js"))).fsPath)
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
          window.presentationData = ${JSON.stringify(data)};
        </script>
    </head>
    <body>
        <div id="root"></div>
        <script src="${reactAppUri}"></script>
    </body>
    </html>`;
    }

}