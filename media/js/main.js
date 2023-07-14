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
        break;
      }
      case 'onLoadApiKey': {
        handleInputMessage(message.value);
        break;
      }
      case 'onCommandClicked': {
        localStorage.setItem('isLoading', 'true');
        const textarea = document.getElementById('input-query');
        textarea.value = message.value + textarea.value;
        textarea.style.height = '';
        textarea.style.height = Math.min(textarea.scrollHeight, 500) + 'px';

        localStorage.setItem('selectedData', textarea.value);
        handleLoading(true);
        vscode.postMessage({ type: 'queryChatGPT', value: textarea.value });
        break;
      }
      case 'onChatGPTResponse': {
        localStorage.setItem('isLoading', 'false');
        handleLoading(false);
        const existingArrayString = localStorage.getItem('arrayGptOutput');
        const selectedArrayString = localStorage.getItem('selectedArray');
        let existingArray = [];
        let selectedArray = [];

        if (existingArrayString && selectedArray) {
          existingArray = JSON.parse(existingArrayString);
          selectedArray = JSON.parse(selectedArrayString);
        }

        existingArray.push(message.value);
        selectedArray.push(localStorage.getItem('selectedData'));

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
    let searchOutput = document.getElementById('response-container');
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
    textarea.style.height = '';
  };

  const cancelLoading = document.getElementById('cancel');
  cancelLoading.onclick = (e) => {
    e.stopPropagation();
    vscode.postMessage({ type: 'cancelQuery', value: null });
  };

  if (localStorage.getItem('selectedData')) {
    const textarea = document.getElementById('input-query');
    textarea.value = localStorage.getItem('selectedData');
    textarea.style.height = '';
    textarea.style.height = Math.min(textarea.scrollHeight, 500) + 'px';
    displayRecent();
    setTimeout(() => {
      localStorage.removeItem('selectedData');
      localStorage.removeItem('arrayGptOutput');
      localStorage.removeItem('selectedArray');
    }, 5 * 60 * 1000);
  }

  function displayRecent() {
    if (localStorage.getItem('arrayGptOutput')) {
      const container = document.querySelector('.dialog-box');
      const data = JSON.parse(localStorage.getItem('arrayGptOutput'));
      const selectedData = JSON.parse(localStorage.getItem('selectedArray'));

      const clearInput = document.getElementById('input-query');
      clearInput.value = 'Highlight code snippet to ask GPT...';
      const responseContainer = document.getElementById('response-container');
      container.insertBefore(
        responseContainer.parentElement,
        container.firstChild
      );

      for (let i = 0; i < data.length; i++) {
        const existingData = Array.from(
          container.querySelectorAll('textarea')
        ).map((textarea) => textarea.value);
        if (!existingData.includes(data[i])) {
          const card = document.createElement('div');
          card.className = 'card border-right';

          const textareaClone = document.createElement('textarea');
          textareaClone.value = data[i];
          textareaClone.readOnly = true;
          textareaClone.style.height = 'auto';
          textareaClone.className = 'response-container w-full p-2';

          card.appendChild(textareaClone);
          container.insertBefore(card, container.firstChild);
          textareaClone.style.height =
            Math.min(textareaClone.scrollHeight, 500) + 'px';

          const selectedCard = document.createElement('div');
          selectedCard.className = 'card border-left';

          const selectedClone = document.createElement('textarea');
          selectedClone.value = selectedData[i];
          selectedClone.readOnly = true;
          selectedClone.style.height = 'auto';
          selectedClone.className = 'response-container w-full p-2';

          selectedCard.appendChild(selectedClone);
          container.insertBefore(selectedCard, container.firstChild);
          selectedClone.style.height =
            Math.min(selectedClone.scrollHeight, 500) + 'px';
        }
      }

      const textarea = document.querySelector('.card-indicator');
      textarea.classList.add('hidden');
    }
  }
})();
