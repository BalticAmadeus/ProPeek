// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ProfilerViewer } from './webview/ProfilerViewer';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "vsc-profiler" is now active!');

    let disposable2 = vscode.commands.registerCommand('vsc-profiler.profiler', () => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        vscode.window.showInformationMessage('profiler');
        new ProfilerViewer(context, "Add New Profiler");
        console.log("after Profiler");

    });

    context.subscriptions.push(disposable2);

}

// This method is called when your extension is deactivated
export function deactivate() { }