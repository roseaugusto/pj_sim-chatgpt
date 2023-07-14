import * as vscode from 'vscode';
import * as openai from 'openai';
import * as fs from 'fs';
import * as moment from 'moment';
import { showMessageWithTimeout } from '../components/ToastMessage';

export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;
  _openAI?: openai.OpenAIApi;
  _extensionUri: vscode.Uri;
  _isCancelled: boolean = false;

  constructor(private _context: vscode.ExtensionContext) {
    moment.locale();
    this._extensionUri = _context.extensionUri;
    this._context.secrets.get('unitTestApiKey').then((key) => {
      const apiKey = key ? JSON.parse(key as string) : undefined;
      this._openAI = new openai.OpenAIApi(
        new openai.Configuration({
          apiKey: apiKey ? apiKey.value : undefined,
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
          const apiKey = {
            value: data.value,
            dateAdded: moment(new Date()).format('llll'),
          };
          try {
            this._view?.webview.postMessage({
              type: 'onLoadApiKey',
              value: { ...apiKey, isLoading: true },
            });
            const configuration = new openai.Configuration({
              apiKey: data.value,
            });
            const openAI = new openai.OpenAIApi(configuration);
            const response = await openAI.createChatCompletion({
              model: 'gpt-3.5-turbo',
              messages: [{ role: 'user', content: data.value }],
            });

            if (response.status === 200) {
              this._openAI = openAI;
              await this._context.secrets.store(
                'unitTestApiKey',
                JSON.stringify(apiKey)
              );
              this._view?.webview.postMessage({
                type: 'onLoadApiKey',
                value: apiKey,
              });
              showMessageWithTimeout(
                'success',
                'SIM ChatGPT successfully added API key: ' + data.value
              );
            } else {
              throw new Error('API request failed');
            }
          } catch (error: any) {
            const errorMessage =
              error.response?.data?.error?.message ||
              error.message ||
              'Unknown error occurred';
            showMessageWithTimeout('error', errorMessage);
            this._view?.webview.postMessage({
              type: 'onLoadApiKey',
              value: undefined,
            });
          }
          break;
        }
        case 'getApiKey': {
          this._context.secrets.get('unitTestApiKey').then((key) => {
            const apiKey = key ? JSON.parse(key as string) : undefined;
            this._view?.webview.postMessage({
              type: 'onLoadApiKey',
              value: apiKey,
            });
          });
          break;
        }
        case 'cancelQuery': {
          this._isCancelled = true;
          this._view?.webview.postMessage({
            type: 'onChatGPTResponse',
            value: '',
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
              if (!this._isCancelled) {
                const editor = vscode.window.activeTextEditor;
                const selection = editor?.selection;
                editor
                  ?.edit((editBuilder) => {
                    editBuilder.insert(
                      selection?.end as vscode.Position,
                      `\n${res.data.choices[0].message?.content}`
                    );
                  })
                  .then(() => {
                    vscode.commands
                      .executeCommand('sim-chatgpt-sidebar.focus')
                      .then(() => {
                        this._view?.webview.postMessage({
                          type: 'onChatGPTResponse',
                          value: res.data.choices[0].message?.content,
                        });
                      });
                  });
              }
              this._isCancelled = false;
            })
            .catch((error) => {
              if (!this._isCancelled) {
                this._view?.webview.postMessage({
                  type: 'onChatGPTResponse',
                  value: error.response.data.error.message,
                });
              }
              showMessageWithTimeout(
                'error',
                error.response.data.error.message || error.message
              );
              this._isCancelled = false;
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
    const logoSVG = fs.readFileSync(logoUri.fsPath, 'utf-8');

    const cancelUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media/icons', 'cancel.svg')
    );
    const cancelSVG = fs.readFileSync(cancelUri.fsPath, 'utf-8');

    const gearUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media/icons', 'gear.svg')
    );
    const gearSVG = fs.readFileSync(gearUri.fsPath, 'utf-8');

    const userUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media/icons', 'user.svg')
    );
    const userSVG = fs.readFileSync(userUri.fsPath, 'utf-8');

    const trashUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media/icons', 'trash.svg')
    );
    const trashSVG = fs.readFileSync(trashUri.fsPath, 'utf-8');

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
      <code id="message">Verifying API Key...</code>
      <hr id="divider"/>
      <div class="flex mb-5">
        <textarea id="input-query" readonly placeholder="Highlight code snippet to ask GPT..." class="w-full resize-vertical rounded-md p-2"></textarea>
        <div class="user space-y-2">
          ${userSVG}
          <div id="clear-input">${trashSVG}</div>
        </div>
      </div>
      <div id="search-output">
        <div id="search-output-icons">
          <div class="logo">
            ${logoSVG}
          </div>
          <div id="clear-convo">${trashSVG}</div>
          <div id="cancel" class="hidden">
            ${cancelSVG}
          </div>
        </div>
        <div class="flex-column">
        <div id="gear-container" class="hidden">
        <div class="card">
        <div id="gear">
        ${gearSVG}
      </div>
        </div>
        </div>
        <div class="dialog-box">
        <div class="card card-indicator" id="card">
        <textarea id="response-container"  class="response-container w-full p-2" placeholder="Hello! How can I help you with unit testing today?"></textarea>
        </div>
        </div>
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
