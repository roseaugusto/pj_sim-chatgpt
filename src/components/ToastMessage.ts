import * as vscode from 'vscode';

export const showMessageWithTimeout = (
  type: 'success' | 'warn' | 'error',
  message: string,
  timeout: number = 5
): void => {
  void vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `${mapMessageType(type)}: ${message}`,
      cancellable: true,
    },
    async (progress: any): Promise<void> => {
      for (let i = 0; i < timeout; i++) {
        progress.report({
          increment: i + 100 / timeout,
        });
        await sleep(1000);
      }
    }
  );
};

export const sleep = (ms: number): Promise<unknown> => {
  return new Promise((resolve) => {
    return setTimeout(resolve, ms);
  });
};

export const mapMessageType = (type: string): string => {
  let messageType = '❌ ERROR';
  switch (type) {
    case 'success':
      messageType = '✅ SUCCESS';
      break;
    case 'warn':
      messageType = '⚠️ WARNING';
      break;
  }
  return messageType;
};
