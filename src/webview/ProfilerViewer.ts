import path = require("path");
import * as vscode from "vscode";
import { ProfilerService } from "../services/profilerService";
import { PresentationData } from "../common/PresentationData";
import { IConfig, XRefInfo } from "../view/app/model";
import { Constants } from "../common/Constants";
import * as fs from 'fs';

export class ProfilerViewer {
    private readonly panel: vscode.WebviewPanel | undefined;
    private readonly configuration = vscode.workspace.getConfiguration("");
    private readonly extensionPath: string;

    constructor(private context: vscode.ExtensionContext, action: string, filePath: string,) {

        this.extensionPath = context.asAbsolutePath("");
        this.panel = vscode.window.createWebviewPanel(
            "OEProfilerViewer",
            action,
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(context.asAbsolutePath(""), "out"))
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
            moduleDetails: [], calledModules: [], lineSummary: [],
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

        let dataString = profilerService.parse(filePath);

        handleErrors(profilerService.getErrors());

        this.panel?.webview.postMessage(dataString);

        this.panel.webview.onDidReceiveMessage(
            (obj) => {
                const workspaceConnections = this.context.workspaceState.get<{
                    [key: string]: IConfig;
                }>(`${Constants.globalExtensionKey}.propaths`);

                if (obj.findLine === false) {
                    open(workspaceConnections, obj.moduleName, obj.lineNumber, profilerService);
                }
                else {
                    findSpecificLine(workspaceConnections, obj.moduleName, obj.lineNumber, profilerService);
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

function getProcedureNames(moduleName: string) {
    const moduleNames: string[] = moduleName.split(" ");

    const xRefInfo: XRefInfo = {
        fileName: "",
        endLine: 0,
        type: "",
        procedureName: ""
    };

    if (moduleNames.length >= 2) {
        xRefInfo.procedureName = moduleNames[0];
        xRefInfo.fileName = moduleNames[1];
    }
    else {
        xRefInfo.fileName = moduleNames[0];
    }
    xRefInfo.fileName = replaceDots(xRefInfo.fileName);

    return xRefInfo;
}

function handleErrors(errors: string[]) {
    if (errors.length > 0) {
        errors.forEach((error) => {
            vscode.window.showErrorMessage(error);
        });
    }
}

function replaceDots(input: string): string {
    const lastIndex = input.lastIndexOf(".");

    if (lastIndex !== -1) {
        const prefix = input.substring(0, lastIndex);
        const suffix = input.substring(lastIndex);

        if (suffix.endsWith(".p") || suffix.endsWith(".r")) {
            return prefix.replace(/\./g, "/") + ".p";
        } else {
            return input.replace(/\./g, "/") + ".cls";
        }
    }
    return input + ".cls";
}

function convertToFilePath(filePath: string, path: string) {
    if (filePath.length >= 2 && filePath[1] !== ":") {
        filePath = path + "/" + filePath;

        if (filePath.substring(0, 3) !== "**/") {
            filePath = "**/" + filePath;
        }
    }

    return filePath;
}

function findSpecificLine(workspaceConnections: { [key: string]: IConfig; } | undefined, moduleName: string, lineNumber: number, profilerService: ProfilerService) {
    let xRefInfo = getProcedureNames(moduleName);

    xRefInfo.procedureName = "";

    if (lineNumber < 1) {
        lineNumber = 1;
    }

    const xRefFile = "**/.builder/.pct0/" + xRefInfo.fileName + ".xref";
    vscode.workspace.findFiles(xRefFile).then(async (list) => {
        if (list.length === 0) {
            vscode.window.showWarningMessage(
                "xRef file not found: " + xRefFile
            );
            openFile(workspaceConnections, xRefInfo, lineNumber, profilerService);
            return;
        }
        else {
            const xRefPath = list[0].path.slice(1);
            const includesInfo = profilerService.parseXrefIncludes(xRefPath);

            if(lineNumber < includesInfo[0].includeLine) {
                openFile(workspaceConnections, xRefInfo, lineNumber, profilerService);
            }
            else {
                let fileFound = false;
                let num = 0;
                let listNum = 0;

                if (workspaceConnections) {
                    for (const id of Object.keys(workspaceConnections)) {
                        let proPath = workspaceConnections[id].path;
                        num++;
                        vscode.workspace.findFiles(convertToFilePath(includesInfo[0].includeName, proPath))
                            .then(async (list) => {
                                listNum++;
                                if (list.length === 0) {
                                }
                                else {
                                    fileFound = true;

                                    let includeLineCOunt = countLinesInFile(list[0].path.slice(1));

                                    let includeEndLine = includeLineCOunt + includesInfo[0].includeLine;
                                    if (lineNumber <= includeEndLine) {
                                        xRefInfo.fileName = includesInfo[0].includeName;
                                        openFile(workspaceConnections, xRefInfo, lineNumber - includesInfo[0].includeLine, profilerService);
                                    }
                                    else {
                                        openFile(workspaceConnections, xRefInfo, lineNumber - includeLineCOunt - 1, profilerService);
                                    }


                                }
                                if (!fileFound && num === listNum) {
                                    vscode.window.showErrorMessage(
                                        "File not found: " + includesInfo[0].includeName
                                    );
                                    return;
                                }
                            });
                    }
                }

            }




            // xRefInfo = profilerService.parseXrefLine(xRefPath, lineNumber);
            // openFileLine(workspaceConnections, xRefInfo, lineNumber, profilerService);
        }
    });

}

function open(workspaceConnections: { [key: string]: IConfig; } | undefined, moduleName: string, lineNumber: number, profilerService: ProfilerService) {
    let xRefInfo = getProcedureNames(moduleName);


    if (xRefInfo.procedureName === "" && lineNumber === 1) {
        openFile(workspaceConnections, xRefInfo, lineNumber, profilerService);
        return;
    }

    const xRefFile = "**/.builder/.pct0/" + xRefInfo.fileName + ".xref";
    vscode.workspace.findFiles(xRefFile).then(async (list) => {
        if (list.length === 0) {
            vscode.window.showWarningMessage(
                "xRef file not found: " + xRefFile
            );
            openFile(workspaceConnections, xRefInfo, lineNumber, profilerService);
            return;
        }
        else {
            const xRefPath = list[0].path.slice(1);
            xRefInfo = profilerService.parseXRef(xRefPath, xRefInfo.procedureName);
            openFile(workspaceConnections, xRefInfo, lineNumber, profilerService);
        }
    });
}

function openFile(workspaceConnections: { [key: string]: IConfig; } | undefined, xRefInfo: XRefInfo, lineNumber: number, profilerService: ProfilerService) {
    let fileFound = false;
    let num = 0;
    let listNum = 0;

    if (workspaceConnections) {
        for (const id of Object.keys(workspaceConnections)) {
            let proPath = workspaceConnections[id].path;
            num++;
            vscode.workspace.findFiles(convertToFilePath(xRefInfo.fileName, proPath))
                .then(async (list) => {
                    listNum++;
                    if (list.length === 0) {
                    }
                    else {
                        fileFound = true;

                        if (xRefInfo.procedureName !== "") {
                            const functionName = xRefInfo.type + " ";
                            lineNumber = profilerService.findFunctionStart(list[0].path.slice(1), xRefInfo.endLine, functionName);
                        }
                        const doc = await vscode.workspace.openTextDocument(list[0]);
                        vscode.window.showTextDocument(doc, { selection: new vscode.Range(lineNumber - 1, 0, lineNumber - 1, 0) });
                        return;
                    }
                    if (!fileFound && num === listNum) {
                        vscode.window.showErrorMessage(
                            "File not found: " + xRefInfo.fileName
                        );
                        return;
                    }
                });
        }
    }
}

function countLinesInFile(filePath: string): number {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');
    return lines.length;
}