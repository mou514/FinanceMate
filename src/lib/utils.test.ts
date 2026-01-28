import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility', () => {
    it('should merge class names correctly', () => {
        expect(cn('c1', 'c2')).toBe('c1 c2');
    });

    it('should handle conditional classes', () => {
        const isTrue = true;
        const isFalse = false;
        expect(cn('c1', isTrue && 'c2', isFalse && 'c3')).toBe('c1 c2');
    });

    it('should merge tailwind classes using tailwind-merge', () => {
        // p-4 overrides p-2
        expect(cn('p-2', 'p-4')).toBe('p-4');
    });
});
