import path = require("path");
import * as vscode from "vscode";
import { ProfilerService } from "../services/profilerService";
import { PresentationData } from "../common/PresentationData";
import { IncludeFile } from "../common/XRefData"
import { IConfig } from "../view/app/model";
import { Constants } from "../common/Constants";
import * as fs from 'fs';

interface Message {
    showStartTime: any;
    moduleName: string;
}

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
        const showStartTime = false;
        let dataString = profilerService.parse(filePath, showStartTime);

        handleErrors(profilerService.getErrors());

        this.panel?.webview.postMessage(dataString);

        this.panel.webview.onDidReceiveMessage(
            message => {
                switch(message.type) {
                    case "GRAPH_TYPE_CHANGE":
                        const showStartTime = message.showStartTime;
                        const dataString = profilerService.parse(filePath, showStartTime);
                        handleErrors(new ProfilerService().getErrors());
                        this.panel?.webview.postMessage(dataString);
                        break;
                    case "MODULE_NAME":
                        const workspaceConnections = this.context.workspaceState.get<{
                            [key: string]: IConfig;
                        }>(`${Constants.globalExtensionKey}.propath`);
        
                        open(workspaceConnections, message.columns, message.lines, profilerService);
                        break;
                    default:
                }
            },
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

function handleErrors(errors: string[]) {
    if (errors.length > 0) {
        errors.forEach((error) => {
            vscode.window.showErrorMessage(error);
        });
    }
}

function open(workspaceConnections: { [key: string]: IConfig; } | undefined, moduleName: string, lineNumber: number, profilerService: ProfilerService) {
    let { fileName, procedureName } = getFileAndProcedureName(moduleName);
    const proPath = getProPath(workspaceConnections);

    if (!procedureName || lineNumber < 1) {
        openFile(proPath, fileName, 1);
        return;
    }

    const xRefFile = "**/.builder/.pct0/" + fileName + ".xref";

    vscode.workspace.findFiles(xRefFile).then(async (list) => {
        if (list.length === 0) {
            vscode.window.showWarningMessage(`xRef file not found: ${xRefFile}\nLine position might be incorrect`);
        } else {
            const xRefPath = list[0].path.slice(1);
            const includeFiles = profilerService.getIncludeFilesFromXref(xRefPath);

            ({ fileName, lineNumber } = await getAdjustedInfo(includeFiles, proPath, fileName, lineNumber));
        }

        openFile(proPath, fileName, lineNumber);
    });
}

async function openFile(proPath: string[], fileName: string, lineNumber: number) {
    const filePath = await getFilePath(proPath, fileName);

    const doc = await vscode.workspace.openTextDocument(filePath);

    vscode.window.showTextDocument(doc, { selection: new vscode.Range(lineNumber - 1, 0, lineNumber - 1, 0) });
}

function getFileAndProcedureName(moduleName: string): { fileName: string, procedureName: string } {
    const moduleNames: string[] = moduleName.split(" ");
    let fileName: string;
    let procedureName: string = "";

    if (moduleNames.length >= 2) {
        procedureName = moduleNames[0];
        fileName = moduleNames[1];
    }
    else {
        fileName = moduleNames[0];
    }

    fileName = replaceDots(fileName);

    return { fileName, procedureName };
}

async function getAdjustedInfo(includeFiles: IncludeFile[], proPath: string[], fileName: string, lineNumber: number): Promise<{ fileName: string, lineNumber: number }> {

    for (const includeFile of includeFiles) {
        if (lineNumber < includeFile.includeLine) {
            break;
        } else {
            let includeFilePath = await getFilePath(proPath, includeFile.includeFileName);
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
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');
    let lineCount = lines.length;

    if (lines[lineCount - 1] !== "") lineCount++;

    return lineCount;
}

async function getFilePath(proPath: string[], fileName: string): Promise<vscode.Uri> {
    let fileFound = false;

    if (fs.existsSync(fileName)) {
        return Promise.resolve(vscode.Uri.file(fileName));
    }

    if (proPath) {
        for (const path of proPath) {
            const files = await vscode.workspace.findFiles(convertToFilePath(fileName, path));
            if (files.length > 0) {
                return files[0];
            }
        }
        if (!fileFound) {
            vscode.window.showErrorMessage("File not found: " + fileName);
        }
    }
    return Promise.resolve(vscode.Uri.file(""));
}

function getProPath(workspaceConnections: { [key: string]: IConfig; } | undefined) {
    let proPath: string[] = [];

    if (workspaceConnections) {
        for (const id of Object.keys(workspaceConnections)) {
            proPath.push(workspaceConnections[id].path);
        }
    }
    return proPath;
}

function replaceDots(fileName: string): string {
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
}

function convertToFilePath(fileName: string, path: string) {
    if (fileName.length >= 2 && fileName[1] !== ":") {
        fileName = path + "/" + fileName;

        if (fileName.substring(0, 3) !== "**/") {
            fileName = "**/" + fileName;
        }
    }

    return fileName;
}