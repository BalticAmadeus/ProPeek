import path = require("path");
import * as vscode from "vscode";
import { ProfilerService } from "../services/profilerService";
import { PresentationData } from "../common/PresentationData";

export class ProfilerViewer {
    private readonly panel: vscode.WebviewPanel | undefined;
    private readonly configuration = vscode.workspace.getConfiguration("");

    constructor(private context: vscode.ExtensionContext, action: string, id?: string,) {

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

        this.panel.webview.html = this.getWebviewContent({ moduleDetails: [], callingModules: [], calledModules: [], lineSummary: [] });

        this.panel.onDidDispose(
            () => {
                // When the panel is closed, cancel any future updates to the webview content
            },
            null,
            context.subscriptions
        );

        const profilerService = new ProfilerService();

        var dataString = profilerService.parse('C:/WorkSpace/Profiler/ProfilingOE/profiler.prof');

        this.panel?.webview.postMessage(dataString);

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