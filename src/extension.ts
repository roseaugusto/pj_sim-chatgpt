import * as vscode from 'vscode';
import { SidebarProvider } from './providers/SidebarProvider';

export function activate(context: vscode.ExtensionContext) {
  const sidebarProvider = new SidebarProvider(context);
  vscode.window.registerWebviewViewProvider(
    'sim-chatgpt-sidebar',
    sidebarProvider
  );

  const runUnitTestCommand = (type: string) => {
    if (!sidebarProvider._view?.visible) {
      sidebarProvider._view?.show();
      const editor = vscode.window.activeTextEditor;
      const selection = editor?.selection;
      const highlightedText = editor?.document.getText(selection);
      sidebarProvider._view?.webview.postMessage({
        type: 'onSelectedText',
        value: highlightedText,
      });
    }
    let query = `Create a unit test using ${type}:\n`;
    sidebarProvider._view?.webview.postMessage({
      type: 'onCommandClicked',
      value: query,
    });
  };

  const disposable1 = vscode.commands.registerCommand(
    'programming-language-translator.runApiKey',
    () => {
      sidebarProvider._view?.webview.postMessage({
        type: 'isApiKeyClicked',
        value: true,
      });
    }
  );
  context.subscriptions.push(disposable1);

  const disposable2 = vscode.commands.registerCommand(
    'programming-language-translator.runJest',
    () => runUnitTestCommand('Jest')
  );
  context.subscriptions.push(disposable2);

  const disposable3 = vscode.commands.registerCommand(
    'programming-language-translator.runJasmine',
    () => runUnitTestCommand('Jasmine')
  );
  context.subscriptions.push(disposable3);

  const disposable4 = vscode.commands.registerCommand(
    'programming-language-translator.runMocha',
    () => runUnitTestCommand('Mocha')
  );
  context.subscriptions.push(disposable4);

  const disposable5 = vscode.commands.registerCommand(
    'programming-language-translator.runAVA',
    () => runUnitTestCommand('Ava')
  );
  context.subscriptions.push(disposable5);

  vscode.window.onDidChangeTextEditorSelection((event) => {
    if (event.kind !== vscode.TextEditorSelectionChangeKind.Mouse) {
      return;
    }
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }
    const selection = editor.selection;
    if (selection.isEmpty) {
      return;
    }
    const highlightedText = editor.document.getText(selection);
    sidebarProvider._view?.webview.postMessage({
      type: 'onSelectedText',
      value: highlightedText,
    });
  });
}

// This method is called when your extension is deactivated
export function deactivate() {}
