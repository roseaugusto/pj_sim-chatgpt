'use strict';
//@ts-check
// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  const vscode = acquireVsCodeApi();
  function fetchText() {
    const query =
      'Create a unit test with this code using ' +
      document.getElementById('framework').value +
      ':\n```' +
      document.getElementById('highlighted-text').value +
      '```';
    vscode.postMessage({ type: 'getQuery', value: query });
  }
  window.addEventListener('message', (event) => {
    const message = event.data;
    switch (message.type) {
      case 'onSelectedText': {
        document.getElementById('highlighted-text').value = message.value;
        break;
      }
      case 'onChatGPTResponse': {
        document.getElementById('query').innerHTML = message.value;
        break;
      }
    }
  });
  const fetchBtn = document.getElementById('fetch-btn');
  fetchBtn.addEventListener('click', fetchText);
})();
