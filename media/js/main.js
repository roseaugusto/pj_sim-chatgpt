'use strict';
//@ts-check
// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  const vscode = acquireVsCodeApi();

  document.getElementById('myForm').addEventListener('submit', handleSubmit);

  window.addEventListener(
    'load',
    () => {
      vscode.postMessage({ type: 'getApiKey', value: null });
      handleLoading(localStorage.getItem('isLoading') === 'true');

      if (localStorage.getItem('selectedData')) {
        const textarea = document.getElementById('input-query');
        textarea.value = localStorage.getItem('selectedData');
        textarea.style.height = '';
        textarea.style.height = Math.min(textarea.scrollHeight, 500) + 'px';
      }

      if (localStorage.getItem('selectedArray')) {
        const textarea = document.getElementById('input-query');
        textarea.style.height = '';
        textarea.style.height = Math.min(textarea.scrollHeight, 500) + 'px';
        displayRecent();
      }
    },
    { capture: true }
  );
  window.addEventListener('message', (event) => {
    const message = event.data;
    switch (message.type) {
      case 'isApiKeyClicked': {
        let form = document.getElementById('myForm');
        if (form.classList.contains('hidden')) {
          getApiInputField('visible');
        } else {
          getApiInputField('hidden');
        }
        break;
      }
      case 'onSelectedText': {
        const textarea = document.getElementById('input-query');
        textarea.value = message.value;
        textarea.style.height = '';
        textarea.style.height = Math.min(textarea.scrollHeight, 500) + 'px';
        localStorage.setItem('selectedData', textarea.value);
        break;
      }
      case 'onLoadApiKey': {
        handleInputMessage(message.value);
        break;
      }
      case 'onCommandClicked': {
        localStorage.setItem('isLoading', 'true');
        const instructionPrompt = `\nStrictly enclose the result of unit test like the code block below:\n
        \`\`\`suggestion\n
          // Unit Test Code
        \`\`\``;
        const textarea = document.getElementById('input-query');
        textarea.value = message.value.query + textarea.value;
        textarea.style.height = '';
        textarea.style.height = Math.min(textarea.scrollHeight, 500) + 'px';
        localStorage.setItem('selectedData', textarea.value);
        handleLoading(true);
        vscode.postMessage({
          type: 'queryChatGPT',
          value: textarea.value + instructionPrompt,
          pathLocation: message.value.unitTestPathname,
        });
        break;
      }
      case 'onChatGPTResponse': {
        localStorage.setItem('isLoading', 'false');
        handleLoading(false);
        const existingArrayString = localStorage.getItem('arrayGptOutput');
        const selectedArrayString = localStorage.getItem('selectedArray');
        let existingArray = [];
        let selectedArray = [];

        if (existingArrayString && selectedArrayString) {
          existingArray = JSON.parse(existingArrayString);
          selectedArray = JSON.parse(selectedArrayString);
        }

        if (message.value !== 'cancelled') {
          existingArray.push(message.value);
          selectedArray.push(localStorage.getItem('selectedData'));
          const clearInput = document.getElementById('input-query');
          clearInput.style.height = '';
          clearInput.value = '';
          localStorage.setItem('selectedData', clearInput.value);
          clearInput.ariaPlaceholder = 'Highlight code snippet to ask GPT...';
        }

        const updatedArrayString = JSON.stringify(existingArray);
        const updatedSelectedArrayString = JSON.stringify(selectedArray);

        localStorage.setItem('arrayGptOutput', updatedArrayString);
        localStorage.setItem('selectedArray', updatedSelectedArrayString);
        displayRecent();
        break;
      }
    }
  });

  function handleInputMessage(details) {
    const inputMessage = document.getElementById('message');
    if (details) {
      if (details.isLoading) {
        inputMessage.innerHTML = `Verifying API key...`;
      } else {
        inputMessage.innerHTML = `You have already added an API key last ${details.dateAdded}`;
        getApiInputField('hidden');
      }
    } else {
      inputMessage.innerHTML = `API Key is not added. Obtain one from https://platform.openai.com/account/api-keys`;
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    let apiKeyInput = document.getElementById('api-key');
    let apiKey = apiKeyInput.value.trim();
    if (apiKey !== '') {
      vscode.postMessage({ type: 'saveApiKey', value: apiKey });
    }
  }

  function handleLoading(isLoading) {
    let searchOutput = document.getElementById('card');
    let loading = document.getElementById('gear-container');
    let cancel = document.getElementById('cancel');
    if (isLoading) {
      searchOutput.classList.add('hidden');
      loading.classList.remove('hidden');
      cancel.classList.remove('hidden');
    } else {
      searchOutput.classList.remove('hidden');
      loading.classList.add('hidden');
      cancel.classList.add('hidden');
    }
  }

  function getApiInputField(visibility) {
    let form = document.getElementById('myForm');
    let message = document.getElementById('message');
    let divider = document.getElementById('divider');
    if (visibility === 'hidden') {
      message.classList.add(visibility);
      form.classList.add(visibility);
      divider.classList.add(visibility);
    } else {
      message.classList.remove('hidden');
      form.classList.remove('hidden');
      divider.classList.remove('hidden');
    }
    document.getElementById('myForm').reset();
  }
  const clearInput = document.getElementById('clear-input');
  clearInput.onclick = () => {
    const textarea = document.getElementById('input-query');

    textarea.value = '';
    localStorage.setItem('selectedData', textarea.value);
    textarea.style.height = '';
  };

  const clearConvoInput = document.getElementById('clear-convo');
  clearConvoInput.onclick = () => {
    localStorage.removeItem('arrayGptOutput');
    localStorage.removeItem('selectedArray');
    localStorage.removeItem('selectedItem');
    const dialogBox = document.getElementById('dialog-box');
    dialogBox.querySelectorAll('.card-response').forEach((res) => {
      res.remove();
    });
    dialogBox.querySelectorAll('.card-input').forEach((res) => {
      res.remove();
    });
    const textarea = document.querySelector('.card-indicator');
    textarea.classList.remove('hidden');
  };

  const cancelLoading = document.getElementById('cancel');
  cancelLoading.onclick = (e) => {
    e.stopPropagation();
    vscode.postMessage({ type: 'cancelQuery', value: null });
  };

  function displayRecent() {
    if (localStorage.getItem('arrayGptOutput')) {
      const textarea = document.querySelector('.card-indicator');
      textarea.classList.add('hidden');
      const container = document.querySelector('.dialog-box');
      const data = JSON.parse(localStorage.getItem('arrayGptOutput'));
      const selectedData = JSON.parse(localStorage.getItem('selectedArray'));

      container.querySelectorAll('.card-response').forEach((child) => {
        child.remove();
      });
      container.querySelectorAll('.card-input').forEach((child) => {
        child.remove();
      });

      if (data.length) {
        for (let i = 0; i < data.length; i++) {
          const card = document.createElement('div');
          card.className = 'card border-right card-response';
          card.innerHTML = data[i];
          container.insertBefore(card, container.firstChild);
          card.querySelectorAll('textarea').forEach((textarea) => {
            textarea.style.height = '';
            textarea.style.height = Math.min(textarea.scrollHeight, 500) + 'px';
          });

          const selectedCard = document.createElement('div');
          selectedCard.className = 'card border-left card-input';

          const selectedClone = document.createElement('textarea');
          selectedClone.value = selectedData[i];
          selectedClone.readOnly = true;
          selectedClone.style.height = 'auto';
          selectedClone.className =
            'response-container input-response-container w-full';

          selectedCard.appendChild(selectedClone);
          container.insertBefore(selectedCard, container.firstChild);
          selectedClone.style.height =
            Math.min(selectedClone.scrollHeight, 500) + 'px';
        }
      } else {
        const textarea = document.querySelector('.card-indicator');
        textarea.classList.remove('hidden');
      }
    }
  }
})();
