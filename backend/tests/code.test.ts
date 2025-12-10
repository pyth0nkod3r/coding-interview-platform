// tests/code.test.ts
// Code execution service tests

import { describe, it, expect } from 'vitest';
import { CodeService } from '../src/services/code.service.js';

describe('CodeService', () => {
    describe('execute', () => {
        it('should execute simple JavaScript code', async () => {
            const result = await CodeService.execute('console.log("Hello, World!");', 'javascript');

            expect(result.output).toContain('Hello, World!');
            expect(result.error).toBeUndefined();
        });

        it('should capture multiple console.log outputs', async () => {
            const code = `
        console.log("Line 1");
        console.log("Line 2");
        console.log("Line 3");
      `;
            const result = await CodeService.execute(code, 'javascript');

            expect(result.output.length).toBe(3);
            expect(result.output[0]).toBe('Line 1');
            expect(result.output[1]).toBe('Line 2');
            expect(result.output[2]).toBe('Line 3');
        });

        it('should handle JavaScript errors gracefully', async () => {
            const result = await CodeService.execute('throw new Error("Test error");', 'javascript');

            expect(result.error).toBeDefined();
            expect(result.error).toContain('Test error');
        });

        it('should handle syntax errors', async () => {
            const result = await CodeService.execute('const x = {;', 'javascript');

            expect(result.error).toBeDefined();
        });

        it('should log objects as JSON', async () => {
            const result = await CodeService.execute('console.log({ name: "test", value: 42 });', 'javascript');

            expect(result.output[0]).toContain('name');
            expect(result.output[0]).toContain('test');
        });

        it('should return placeholder for Python', async () => {
            const result = await CodeService.execute('print("Hello")', 'python');

            expect(result.output[0]).toContain('Python');
        });

        it('should handle TypeScript same as JavaScript', async () => {
            const result = await CodeService.execute('console.log("TypeScript works!");', 'typescript');

            expect(result.output).toContain('TypeScript works!');
        });
    });
});
