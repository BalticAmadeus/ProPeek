// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ProfilerViewer } from './webview/ProfilerViewer';
import path from 'path';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

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


    let test = vscode.commands.registerCommand('vsc-profiler.helloWorld', () => {

        vscode.workspace.findFiles("**/test.prof").then(async (list) => {
            list.forEach(async (uri) =>{
                const doc = await vscode.workspace.openTextDocument(uri);
                await vscode.window.showTextDocument(doc);
              });

            console.log("done");
        });
    });

    context.subscriptions.push(disposable);
    context.subscriptions.push(test);
}

// This method is called when your extension is deactivated
export function deactivate() { }