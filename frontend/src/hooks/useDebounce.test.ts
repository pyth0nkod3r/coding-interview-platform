import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should return initial value immediately', () => {
        const { result } = renderHook(() => useDebounce('initial', 500));
        expect(result.current).toBe('initial');
    });

    it('should return debounced value after delay', () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: 'initial', delay: 500 } }
        );

        expect(result.current).toBe('initial');

        // Update the value
        rerender({ value: 'updated', delay: 500 });

        // Value should still be initial (not yet debounced)
        expect(result.current).toBe('initial');

        // Fast forward time
        act(() => {
            vi.advanceTimersByTime(500);
        });

        // Now should be updated
        expect(result.current).toBe('updated');
    });

    it('should reset timer when value changes rapidly', () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: 'initial', delay: 500 } }
        );

        // Update value multiple times rapidly
        rerender({ value: 'first', delay: 500 });
        act(() => {
            vi.advanceTimersByTime(200);
        });

        rerender({ value: 'second', delay: 500 });
        act(() => {
            vi.advanceTimersByTime(200);
        });

        rerender({ value: 'third', delay: 500 });

        // Should still be initial since timer keeps resetting
        expect(result.current).toBe('initial');

        // Wait for full delay after last change
        act(() => {
            vi.advanceTimersByTime(500);
        });

        // Should now be the last value
        expect(result.current).toBe('third');
    });

    it('should work with different delay values', () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: 'test', delay: 1000 } }
        );

        rerender({ value: 'changed', delay: 1000 });

        act(() => {
            vi.advanceTimersByTime(500);
        });
        expect(result.current).toBe('test');

        act(() => {
            vi.advanceTimersByTime(500);
        });
        expect(result.current).toBe('changed');
    });

    it('should work with object values', () => {
        const initialObj = { count: 0 };
        const updatedObj = { count: 1 };

        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: initialObj, delay: 300 } }
        );

        expect(result.current).toEqual({ count: 0 });

        rerender({ value: updatedObj, delay: 300 });

        act(() => {
            vi.advanceTimersByTime(300);
        });

        expect(result.current).toEqual({ count: 1 });
    });
});
