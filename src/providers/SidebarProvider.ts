import * as vscode from 'vscode';
export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;
  
  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;
    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
  }

  public revive(panel: vscode.WebviewView) {
    this._view = panel;
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const logoUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media/icons', 'icon.svg')
    );
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media/css', 'reset.css')
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media/css', 'vscode.css')
    );
    const jsVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media/js', 'script.js')
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
        <input type="text" id="api-key" class="api-input" placeholder="API key"></input>
        <button class="btn-save" type="submit">Save</button>
      </form>
      <div class="flex hidden" id="search-output">
        <div class="logo">
          <img src="${logoUri}">
        </div>
        <div class="card " readonly">
          <p> Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus id ex ultricies, facilisis libero id, congue felis. Nulla in mi lorem. Vivamus elementum, lectus vel congue bibendum, sapien orci gravida mauris, vitae eleifend tortor odio non nunc. Quisque ac elit sed mauris vulputate hendrerit. Duis vitae purus id sem congue eleifend at vel mi. Aliquam malesuada congue vestibulum. Ut sollicitudin dolor a hendrerit bibendum. Nulla id nulla condimentum, pellentesque mi id, fringilla est. Vestibulum id nibh a sem feugiat tristique.
          </p>
        </div>
      </div>
      <h2 id="message"></h2>
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
