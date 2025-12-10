// src/utils/executor.ts
import type { Language } from '../services/interview.service';

export interface ExecutionResult {
  output: string[];
  error?: string;
}

export class CodeExecutor {
  private static pyodide: any = null;

  static async execute(code: string, language: Language): Promise<ExecutionResult> {
    if (language === 'python') {
      return this.executePython(code);
    } else {
      return this.executeJS(code);
    }
  }

  private static executeJS(code: string): Promise<ExecutionResult> {
    return new Promise((resolve) => {
      // Create a blob for the worker content
      // We can't import the worker file directly in Vite without ?worker suffix usually,
      // but for this purely client-side logic without server, let's try a dynamic blob approach
      // to avoid file serving issues in some environments.

      const workerCode = `
        self.onmessage = (e) => {
          const { code } = e.data;
          let logs = [];
          
          const consoleProxy = {
            log: (...args) => {
              logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
            },
            error: (...args) => {
              logs.push('Error: ' + args.map(a => String(a)).join(' '));
            }
          };

          try {
            // Function constructor is safer than eval for scope, but still runs in worker
            // We expose 'console' as our proxy
            const func = new Function('console', code);
            const result = func(consoleProxy);
            
            self.postMessage({ 
              type: 'success', 
              output: logs,
              result: result
            });
          } catch (err) {
            self.postMessage({ type: 'error', error: err.message });
          }
        };
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      const worker = new Worker(workerUrl);

      const timeoutId = setTimeout(() => {
        worker.terminate();
        resolve({ output: [], error: 'Execution timed out (3s limit)' });
      }, 3000);

      worker.onmessage = (e) => {
        clearTimeout(timeoutId);
        if (e.data.type === 'error') {
          resolve({ output: [], error: e.data.error });
        } else {
          const output = e.data.output || [];
          if (e.data.result !== undefined) {
            output.push(`> ${e.data.result}`);
          }
          resolve({ output });
        }
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
      };

      worker.onerror = (e) => {
        clearTimeout(timeoutId);
        resolve({ output: [], error: e.message });
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
      };

      worker.postMessage({ code });
    });
  }

  private static async executePython(code: string): Promise<ExecutionResult> {
    if (!this.pyodide) {
      try {
        // @ts-ignore
        this.pyodide = await window.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/"
        });
      } catch (e) {
        return { output: [], error: 'Failed to load Python engine. Please check internet connection.' };
      }
    }

    try {
      // Capture stdout
      this.pyodide.setStdout({ batched: (msg: string) => { } }); // Reset
      let logs: string[] = [];
      this.pyodide.setStdout({ batched: (msg: string) => logs.push(msg) });

      await this.pyodide.runPythonAsync(code);

      return { output: logs };
    } catch (err: any) {
      return { output: [], error: err.message };
    }
  }
}
