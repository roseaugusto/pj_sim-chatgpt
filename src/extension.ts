// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { SidebarProvider } from './providers/SidebarProvider';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "programming-language-translator" is now active!'
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json

  // The code you place here will be executed every time your command is executed
  // Display a message box to the user

  const sidebarProvider = new SidebarProvider(context.extensionUri);
  vscode.window.registerWebviewViewProvider(
    'sim-chatgpt-sidebar',
    sidebarProvider
  );
  vscode.commands.registerCommand(
    'programming-language-translator.runApiKey',
    () => {
      sidebarProvider._view?.webview.postMessage({
        type: 'isApiKeyClicked',
        value: true,
      });
    }
  );
  context.subscriptions.push();
}

// This method is called when your extension is deactivated
export function deactivate() {}
