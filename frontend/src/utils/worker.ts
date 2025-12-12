// src/utils/worker.ts
// This worker script handles JavaScript/TypeScript execution safely

self.onmessage = (e: MessageEvent) => {
  const { code } = e.data;
  const logs: string[] = [];

  // Create a custom console that captures output
  const customConsole = {
    log: (...args: unknown[]) => {
      logs.push(args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' '));
    },
    error: (...args: unknown[]) => {
      logs.push('Error: ' + args.map(arg => String(arg)).join(' '));
    }
  };

  try {
    // Create a function that receives console as parameter
    const fn = new Function('console', code);
    const result = fn(customConsole);

    self.postMessage({
      type: 'success',
      output: logs,
      result: result !== undefined ? String(result) : undefined
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    self.postMessage({
      type: 'error',
      error: errorMessage
    });
  }
};
