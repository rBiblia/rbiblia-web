import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import useScrollWithVirtualization from '../../assets/js/hooks/useScrollWithVirtualization';

describe('useScrollWithVirtualization', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        // Mock requestAnimationFrame for immediate execution in tests
        vi.stubGlobal('requestAnimationFrame', (cb) => cb());
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('initializes with initialCount items', () => {
        const items = Array.from({ length: 100 }, (_, i) => i);
        const { result } = renderHook(() => useScrollWithVirtualization(items, { initialCount: 20 }));

        expect(result.current.visibleItems.length).toBe(20);
        expect(result.current.totalCount).toBe(100);
        expect(result.current.visibleCount).toBe(20);
        expect(result.current.hasMore).toBe(true);
    });

    it('loads more items when handleScroll hits threshold', () => {
        const items = Array.from({ length: 100 }, (_, i) => i);
        const { result } = renderHook(() => useScrollWithVirtualization(items, { initialCount: 20, batchSize: 15, threshold: 0.8 }));

        act(() => {
            result.current.handleScroll({
                target: {
                    scrollTop: 850,
                    clientHeight: 100,
                    scrollHeight: 1000
                }
            });
        });

        // (850 + 100) / 1000 = 0.95 >= 0.8
        expect(result.current.visibleCount).toBe(35);
        expect(result.current.visibleItems.length).toBe(35);
    });

    it('does not load more items if threshold not met', () => {
        const items = Array.from({ length: 100 }, (_, i) => i);
        const { result } = renderHook(() => useScrollWithVirtualization(items, { initialCount: 20, batchSize: 15, threshold: 0.8 }));

        act(() => {
            result.current.handleScroll({
                target: {
                    scrollTop: 100,
                    clientHeight: 100,
                    scrollHeight: 1000
                }
            });
        });

        // (100 + 100) / 1000 = 0.2 < 0.8
        expect(result.current.visibleCount).toBe(20);
    });

    it('resets visible count', () => {
        const items = Array.from({ length: 100 }, (_, i) => i);
        const { result } = renderHook(() => useScrollWithVirtualization(items, { initialCount: 20 }));

        act(() => {
            result.current.loadMore();
        });

        expect(result.current.visibleCount).toBe(35);

        act(() => {
            result.current.reset();
        });

        expect(result.current.visibleCount).toBe(20);
    });
});
