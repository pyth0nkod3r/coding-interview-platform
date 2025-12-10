// src/utils/worker.ts
// This worker script handles JavaScript/TypeScript execution safely

self.onmessage = (e: MessageEvent) => {
  const { code } = e.data;
  let logs: string[] = [];

  // Override console.log to capture output
  const originalLog = console.log;
  console.log = (...args: any[]) => {
    logs.push(args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' '));
  };

  try {
    // Basic infinite loop protection
    const start = Date.now();
    const timeout = 3000; // 3 seconds timeout

    // We wrap the code in an async function to allow await if needed,
    // though for simple execution eval is used here. 
    // For safer isolation, we'd use something like SES (Secure EcmaScript),
    // but a Worker provides a decent boundary for this demo.
    
    // We can't easily detect infinite loops in `eval` without code transformation (instrumentation).
    // So we rely on the main thread terminating this worker if it hangs.
    
    const result = new Function(code)();
    
    self.postMessage({ 
      type: 'success', 
      output: logs, 
      result: result !== undefined ? String(result) : undefined 
    });

  } catch (error: any) {
    self.postMessage({ 
      type: 'error', 
      error: error.message 
    });
  }
};
