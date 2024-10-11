import * as vscode from "vscode";
import * as path from "path";

export class ProfilerWebview {
    public readonly panel: vscode.WebviewPanel;
    private readonly extensionPath: string;
  
    constructor(private context: vscode.ExtensionContext, proPath: string) {
      this.extensionPath = context.asAbsolutePath("");
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
  
      this.panel.onDidDispose(
        () => {
          // When the panel is closed, cancel any future updates to the webview content
        },
        null,
        context.subscriptions
      );
    }
  
    // Sets the loading state and sends a message to the webview
    public async setLoading(isLoading: boolean): Promise<void> {
      this.panel.webview.postMessage({
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
  
      const reactAppUri = this.panel.webview.asWebviewUri(reactAppPathOnDisk);
      const cspSource = this.panel.webview.cspSource;
      return `<!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width,  
   initial-scale=1.0">
              <title>Config View</title>
              <meta http-equiv="Content-Security-Policy"
                      content="default-src 'none';
                              img-src https:;
                              script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net ${cspSource};

                              style-src ${cspSource} 'self' 'unsafe-inline' https://cdn.jsdelivr.net ${cspSource};"> 
  
  
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