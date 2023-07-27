import * as vscode from 'vscode';
import { SidebarProvider } from './providers/SidebarProvider';

export async function activate(context: vscode.ExtensionContext) {
  const sidebarProvider = new SidebarProvider(context);
  const sidebarDisposable = vscode.window.registerWebviewViewProvider(
    'sim-chatgpt-sidebar',
    sidebarProvider
  );
  context.subscriptions.push(sidebarDisposable);

  const runUnitTestCommand = async (type: string) => {
    await vscode.commands.executeCommand('sim-chatgpt-sidebar.focus');

    setTimeout(async () => {
      sidebarProvider._view?.show();

      // Utilize this `unitTestPathname` variable to create the file alongside the path to the test folder
      const unitTestPathname = await vscode.window.showInputBox({
        placeHolder: 'Search query',
        prompt:
          'Input filename with full path to your test folder (e.g. c:\\<path-to-project>\\src\\tests)',
        value: vscode.workspace.workspaceFolders?.[0].uri.fsPath as string,
        ignoreFocusOut: true,
      });

      const editor = vscode.window.activeTextEditor;
      const selection = editor?.selection;
      const highlightedText = editor?.document.getText(selection);
      sidebarProvider._view?.webview.postMessage({
        type: 'onSelectedText',
        value: highlightedText,
      });
      let query = `Create a unit test using ${type}:\n`;
      sidebarProvider._view?.webview.postMessage({
        type: 'onCommandClicked',
        value: { query, unitTestPathname },
      });
    }, 100);
  };

  const apiKeyCommandDisposable = vscode.commands.registerCommand(
    'sim-chatgpt-unit-test.runApiKey',
    () => {
      sidebarProvider._view?.webview.postMessage({
        type: 'isApiKeyClicked',
        value: true,
      });
    }
  );
  context.subscriptions.push(apiKeyCommandDisposable);

  const jestCommandDisposable = vscode.commands.registerCommand(
    'sim-chatgpt-unit-test.runJest',
    () => runUnitTestCommand('Jest')
  );
  context.subscriptions.push(jestCommandDisposable);

  const jasmineCommandDisposable = vscode.commands.registerCommand(
    'sim-chatgpt-unit-test.runJasmine',
    () => runUnitTestCommand('Jasmine')
  );
  context.subscriptions.push(jasmineCommandDisposable);

  const mochaCommandDisposable = vscode.commands.registerCommand(
    'sim-chatgpt-unit-test.runMocha',
    () => runUnitTestCommand('Mocha')
  );
  context.subscriptions.push(mochaCommandDisposable);

  const avaCommandDisposable = vscode.commands.registerCommand(
    'sim-chatgpt-unit-test.runAVA',
    () => runUnitTestCommand('Ava')
  );
  context.subscriptions.push(avaCommandDisposable);

  const cypressCommandDisposable = vscode.commands.registerCommand(
    'sim-chatgpt-unit-test.runCypress',
    () => runUnitTestCommand('Cypress')
  );
  context.subscriptions.push(cypressCommandDisposable);

  const storybookCommandDisposable = vscode.commands.registerCommand(
    'sim-chatgpt-unit-test.runStorybook',
    () => runUnitTestCommand('Storybook')
  );
  context.subscriptions.push(storybookCommandDisposable);

  const puppeteerCommandDisposable = vscode.commands.registerCommand(
    'sim-chatgpt-unit-test.runPuppeteer',
    () => runUnitTestCommand('Puppeteer')
  );
  context.subscriptions.push(puppeteerCommandDisposable);

  const playwrightCommandDisposable = vscode.commands.registerCommand(
    'sim-chatgpt-unit-test.runPlaywright',
    () => runUnitTestCommand('Playwright')
  );
  context.subscriptions.push(playwrightCommandDisposable);
  const phpUnitCommandDisposable = vscode.commands.registerCommand(
    'sim-chatgpt-unit-test.runPHPUnit',
    () => runUnitTestCommand('PHPUnit')
  );
  context.subscriptions.push(phpUnitCommandDisposable);

  const rspecCommandDisposable = vscode.commands.registerCommand(
    'sim-chatgpt-unit-test.runRSpec',
    () => runUnitTestCommand('RSpec')
  );
  context.subscriptions.push(rspecCommandDisposable);

  const pyTestCommandDisposable = vscode.commands.registerCommand(
    'sim-chatgpt-unit-test.runPyTest',
    () => runUnitTestCommand('PyTest')
  );
  context.subscriptions.push(pyTestCommandDisposable);

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
