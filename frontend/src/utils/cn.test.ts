import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn utility', () => {
    it('should merge class names correctly', () => {
        const result = cn('foo', 'bar');
        expect(result).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
        const isActive = true;
        const isDisabled = false;
        const result = cn('base', isActive && 'active', isDisabled && 'disabled');
        expect(result).toBe('base active');
    });

    it('should handle undefined and null values', () => {
        const result = cn('base', undefined, null, 'other');
        expect(result).toBe('base other');
    });

    it('should handle object syntax', () => {
        const result = cn('base', { active: true, disabled: false });
        expect(result).toBe('base active');
    });

    it('should merge Tailwind classes correctly (smaller wins)', () => {
        // twMerge should resolve the conflict
        const result = cn('p-4', 'p-2');
        expect(result).toBe('p-2');
    });

    it('should handle empty input', () => {
        const result = cn();
        expect(result).toBe('');
    });

    it('should handle array input', () => {
        const result = cn(['foo', 'bar']);
        expect(result).toBe('foo bar');
    });
});
