import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useDebounce, useDebouncedCallback } from '../../assets/js/hooks/useDebounce';

describe('useDebounce', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns debounced value after delay', () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: 'initial', delay: 300 } }
        );

        expect(result.current).toBe('initial');

        rerender({ value: 'updated', delay: 300 });
        expect(result.current).toBe('initial');

        act(() => {
            vi.advanceTimersByTime(300);
        });

        expect(result.current).toBe('updated');
    });

    it('returns empty string if length is less than minLength', () => {
        const { result, rerender } = renderHook(
            ({ value, delay, minLength }) => useDebounce(value, delay, minLength),
            { initialProps: { value: 'initial', delay: 300, minLength: 3 } }
        );

        rerender({ value: 'hi', delay: 300, minLength: 3 });

        expect(result.current).toBe('');

        act(() => {
            vi.advanceTimersByTime(300);
        });

        expect(result.current).toBe('');
    });
});

describe('useDebouncedCallback', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('debounces the callback execution', () => {
        const callback = vi.fn();
        const { result } = renderHook(() => useDebouncedCallback(callback, 300));

        act(() => {
            result.current('test1');
            result.current('test2');
            result.current('test3');
        });

        expect(callback).not.toHaveBeenCalled();

        act(() => {
            vi.advanceTimersByTime(300);
        });

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith('test3');
    });

    it('cleans up timeout on unmount', () => {
        const callback = vi.fn();
        const { result, unmount } = renderHook(() => useDebouncedCallback(callback, 300));

        act(() => {
            result.current('test1');
        });

        unmount();

        act(() => {
            vi.advanceTimersByTime(300);
        });

        expect(callback).not.toHaveBeenCalled();
    });
});
