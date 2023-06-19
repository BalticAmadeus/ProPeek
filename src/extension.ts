// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ProfilerViewer } from './webview/ProfilerViewer';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    let disposable = vscode.commands.registerCommand('vsc-profiler.profiler', () => {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            console.error('Cannot get the active editor');
            return;
        };
        console.log(activeEditor.document.fileName);
        const filePath = activeEditor.document.fileName;
        const updatedPath = filePath.replace(/\\/g, '/');
        const fileName = vscode.workspace.asRelativePath(updatedPath);
        new ProfilerViewer(context, fileName, updatedPath);
    });

    context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }