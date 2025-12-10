import { describe, it, expect, vi } from 'vitest';
import { CodeExecutor } from './executor';

// Mock Worker
class MockWorker {
  onmessage: ((e: any) => void) | null = null;
  onerror: ((e: any) => void) | null = null;
  
  constructor(stringUrl: string) {}

  postMessage(data: any) {
    // Simulate execution
    setTimeout(() => {
      if (data.code.includes('fail')) {
        this.onmessage?.({ data: { type: 'error', error: 'Runtime Error' } });
      } else if (data.code.includes('timeout')) {
        // Do nothing, let it timeout
      } else {
        this.onmessage?.({ data: { type: 'success', output: ['Hello World'], result: 'undefined' } });
      }
    }, 100);
  }

  terminate() {}
}

global.Worker = MockWorker as any;
global.URL.createObjectURL = vi.fn();
global.URL.revokeObjectURL = vi.fn();

describe('CodeExecutor', () => {
  it('should execute JS code successfully', async () => {
    const result = await CodeExecutor.execute('console.log("Hello World")', 'javascript');
    expect(result.output).toContain('Hello World');
    expect(result.error).toBeUndefined();
  });

  it('should handle JS errors', async () => {
    const result = await CodeExecutor.execute('fail', 'javascript');
    expect(result.error).toBe('Runtime Error');
  });

  it('should handle timeout', async () => {
    vi.useFakeTimers();
    const promise = CodeExecutor.execute('timeout', 'javascript');
    
    vi.advanceTimersByTime(3001);
    
    const result = await promise;
    expect(result.error).toContain('timed out');
    vi.useRealTimers();
  });
});
