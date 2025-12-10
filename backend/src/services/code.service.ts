// src/services/code.service.ts
// Code execution service (sandboxed)

import type { Language, ExecutionResult } from '../types/index.js';

export class CodeService {
    static async execute(code: string, language: Language): Promise<ExecutionResult> {
        // Simple sandboxed execution using Function constructor
        // In production, use isolated-vm or a container-based solution

        try {
            if (language === 'javascript' || language === 'typescript') {
                return this.executeJavaScript(code);
            } else if (language === 'python') {
                // Python execution would require a different approach
                // For mock, we'll return a placeholder
                return {
                    output: ['Python execution not available in mock mode'],
                    error: undefined,
                };
            }

            return {
                output: [],
                error: `Unsupported language: ${language}`,
            };
        } catch (error) {
            return {
                output: [],
                error: error instanceof Error ? error.message : 'Execution failed',
            };
        }
    }

    private static executeJavaScript(code: string): ExecutionResult {
        const output: string[] = [];

        // Create a mock console that captures output
        const mockConsole = {
            log: (...args: unknown[]) => {
                output.push(args.map(arg =>
                    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                ).join(' '));
            },
            error: (...args: unknown[]) => {
                output.push(`Error: ${args.map(String).join(' ')}`);
            },
            warn: (...args: unknown[]) => {
                output.push(`Warning: ${args.map(String).join(' ')}`);
            },
        };

        try {
            // Create a sandboxed function with limited scope
            const sandboxedFn = new Function('console', code);
            sandboxedFn(mockConsole);

            return { output, error: undefined };
        } catch (error) {
            return {
                output,
                error: error instanceof Error ? error.message : 'Execution error',
            };
        }
    }
}
