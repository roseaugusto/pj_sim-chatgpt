import * as vscode from 'vscode';
import * as openai from 'openai';
export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;
  _openAI?: openai.OpenAIApi;
  _extensionUri: vscode.Uri;
  constructor(private _context: vscode.ExtensionContext) {
    this._extensionUri = _context.extensionUri;
    this._context.secrets.get('apiKey').then((key) => {
      this._openAI = new openai.OpenAIApi(
        new openai.Configuration({
          apiKey: key,
        })
      );
    });
  }

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;
    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Listen for messages from the Sidebar component and execute action
    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case 'saveApiKey': {
          this._context.secrets.store('apiKey', data.value);
          this._openAI = new openai.OpenAIApi(
            new openai.Configuration({
              apiKey: data.value,
            })
          );
          break;
        }
        case 'getApiKey': {
          this._context.secrets.get('apiKey').then((key) => {
            this._view?.webview.postMessage({
              type: 'onLoadApiKey',
              value: key,
            });
          });
          break;
        }
        case 'queryChatGPT': {
          this._openAI
            ?.createChatCompletion({
              model: 'gpt-3.5-turbo',
              messages: [{ role: 'user', content: data.value }],
            })
            .then((res) => {
              this._view?.webview.postMessage({
                type: 'onChatGPTResponse',
                value: res.data.choices[0].message?.content,
              });
              const editor = vscode.window.activeTextEditor;
              const selection = editor?.selection;
              editor?.edit((editBuilder) => {
                editBuilder.insert(
                  selection?.end as vscode.Position,
                  `\n${res.data.choices[0].message?.content}`
                );
              });
            });
          break;
        }
      }
    });
  }

  public revive(panel: vscode.WebviewView) {
    this._view = panel;
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const logoUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media/icons', 'icon.svg')
    );
    const gearUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media/icons', 'gear.svg')
    );
    const userUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media/icons', 'user.svg')
    );
    const trashUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media/icons', 'trash.svg')
    );
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media/css', 'reset.css')
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media/css', 'vscode.css')
    );
    const jsVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media/js', 'main.js')
    );

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; connect-src 'self'; font-src 'self'; img-src 'self' data: 'data:image/svg+xml' https:; style-src ${webview.cspSource};   script-src ${webview.cspSource};">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
			</head>
      <body>
      <form class="flex" id="myForm">
        <input type="text" id="api-key" class="api-input code" placeholder="ChatGPT API Key"></input>
        <button class="btn-save" type="submit">Save</button>
      </form>
      <code id="message">Please enter your ChatGPT API Key. Make sure you have enough credits to use ChatGPT API. Your API key will be stored in vscode secret storage.</code>
      <hr id="divider"/>
      <div class="flex mb-5">
        <textarea id="input-query" readonly placeholder="Highlight code snippet to ask GPT..." class="w-full resize-vertical rounded-md p-2"></textarea>
        <div class="user space-y-2">
          <img src="${userUri}">
          <img class="trash" id="clear-input" src="${trashUri}">
        </div>
      </div>
      <div class="flex" id="search-output">
        <div class="logo">
          <img src="${logoUri}">
        </div>
        <div class="card" readonly">
          <textarea id="response-container" readonly class="w-full p-2" placeholder="Hello! How can I help you with unit testing today?"></textarea>
        </div>
      </div>
      <div id="gear-container" class="hidden">
        <div id="gear">
          <img width="50" height="50" src="${gearUri}">
          <p>Composing...</p>
        </div>
      </div>
      <script  nonce="${nonce}" src="${jsVSCodeUri}"></script>
	    </body>
	</html>`;
  }
}

function getNonce() {
  let text = '';
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
