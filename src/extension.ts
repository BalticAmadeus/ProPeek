// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ProfilerViewer } from './webview/ProfilerViewer';
import { parseOEFile, readFile} from "./common/OpenEdgeJsonReaded";
import { IConfig } from "../src/view/app/model";
import { Constants } from './common/Constants';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    Constants.context = context;

    let disposable = vscode.commands.registerCommand('vsc-profiler.profiler', () => {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            console.error('Cannot get the active editor');
            return;
        };
        const filePath = activeEditor.document.fileName;
        const updatedPath = filePath.replace(/\\/g, '/');
        const fileName = vscode.workspace.asRelativePath(updatedPath);
        new ProfilerViewer(context, fileName, updatedPath);
    });

    context.subscriptions.push(disposable);

    vscode.workspace.findFiles("**/openedge-project.json").then((list) => {
        list.forEach((uri) => createJsonDatabases(uri));
      });

      vscode.workspace
        .createFileSystemWatcher("**/openedge-project.json")
        .onDidChange((uri) => createJsonDatabases(uri));

        function createJsonDatabases(uri: vscode.Uri) {
            let allFileContent: string = "";
            allFileContent = readFile(uri.path);
            const buildPaths = parseOEFile(allFileContent);

            let paths = context.workspaceState.get<{ [id: string]: IConfig }>(
                `${Constants.globalExtensionKey}.dbconfig`
              );
              paths = {};

              buildPaths.forEach((path) => {
                if (!paths) {
                  paths = {};
                }
                paths[path.id] = path;
                context.workspaceState.update(
                  `${Constants.globalExtensionKey}.dbconfig`,
                  paths
                );
                vscode.window.showInformationMessage("Connection saved succesfully.");
                vscode.commands.executeCommand(
                  `${Constants.globalExtensionKey}.refreshList`
                );
              });
          }
}

// This method is called when your extension is deactivated
export function deactivate() { }