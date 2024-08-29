// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ProfilerViewer } from './webview/ProfilerViewer';
import { getBuildPaths, readFile } from "./common/OpenEdgeJsonReader";
import { Constants } from './common/Constants';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    Constants.context = context;
    
    let compareDisposable = vscode.commands.registerCommand('vsc-profiler.compareProfilerFiles', async () => {

        const selectedFiles = await vscode.window.showOpenDialog({
            canSelectMany: true,
            openLabel: 'Select Profiler Files',
            filters: {
                'Profiler Files': ['prof', 'out']
            }
        });        

        if (!selectedFiles || selectedFiles.length !== 2) {
            vscode.window.showErrorMessage("Please select exactly two profiler files.");
            return;
        }

        const file1 = selectedFiles[0].fsPath;
        const file2 = selectedFiles[1].fsPath;

        const updatedPath1 = file1.replace(/\\/g, '/');
        const updatedPath2 = file2.replace(/\\/g, '/');
    
        const relativePath1 = vscode.workspace.asRelativePath(updatedPath1);
        const relativePath2 = vscode.workspace.asRelativePath(updatedPath2);

        new ProfilerViewer(context, relativePath1, updatedPath1, relativePath2, updatedPath2);

    });

    context.subscriptions.push(compareDisposable);

    vscode.workspace.findFiles("**/openedge-project.json").then((list) => {
        list.forEach((uri) => updatePropath(uri));
    });

    vscode.workspace
        .createFileSystemWatcher("**/openedge-project.json")
        .onDidChange((uri) => updatePropath(uri));

    function updatePropath(uri: vscode.Uri) {
        const fileContent: string = readFile(uri.path);
        const buildPaths = getBuildPaths(fileContent);

        context.workspaceState.update(
            `${Constants.globalExtensionKey}.propath`,
            buildPaths
        );
    }

    let disposable = vscode.commands.registerCommand('vsc-profiler.profiler', async (uri: vscode.Uri) => {
        const filePath = uri.path;
        const updatedPath = filePath.replace(/\\/g, '/').slice(1);
        const fileName = vscode.workspace.asRelativePath(updatedPath);
        new ProfilerViewer(context, fileName, updatedPath);
    });

    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('vsc-profiler.profilerFromTask', async (args) => {
        console.log(args.length, args.length < 3);
        if (args.length < 3) {
            vscode.window.showErrorMessage("ProPeek: Please pass a parameter to the task");
            return;
        }

        const path = getPathFromTaskArgs(args);

        new ProfilerViewer(context, path, path);
    });

    context.subscriptions.push(disposable);
}

/**
 * Function that returns the path from a list of arguments
 * @param args array of strings
 * @returns single path
 */
const getPathFromTaskArgs = (args: Array<string>): string => {
    // accept only 1 arg, which is the 2nd element in the array
    const realArg = args[1];

    // transform argument from "${path.prof}" to "path.prof"
    return realArg.replace(/\${(.*?)}/g, '$1');
};

// This method is called when your extension is deactivated
export function deactivate() { }