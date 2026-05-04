import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import usePullToRefresh from '../../assets/js/hooks/usePullToRefresh';

describe('usePullToRefresh', () => {
    it('initializes with default state', () => {
        const { result } = renderHook(() => usePullToRefresh(vi.fn()));
        
        expect(result.current.isPulling).toBe(false);
        expect(result.current.isRefreshing).toBe(false);
        expect(result.current.pullDistance).toBe(0);
        expect(result.current.pullProgress).toBe(0);
    });

    it('ignores pull when disabled', () => {
        const { result } = renderHook(() => usePullToRefresh(vi.fn(), { enabled: false }));
        
        act(() => {
            result.current.handlers.onTouchStart({
                currentTarget: { scrollTop: 0 },
                touches: [{ clientY: 100 }]
            });
        });
        
        expect(result.current.isPulling).toBe(false);
    });

    it('handles pull to refresh lifecycle', async () => {
        const onRefresh = vi.fn().mockResolvedValue();
        const { result } = renderHook(() => usePullToRefresh(onRefresh, { threshold: 80 }));

        act(() => {
            result.current.handlers.onTouchStart({
                currentTarget: { scrollTop: 0 },
                touches: [{ clientY: 100 }]
            });
        });

        expect(result.current.isPulling).toBe(false); // only becomes true after diff > 20 / 0.5 resistance => 40px

        act(() => {
            result.current.handlers.onTouchMove({
                touches: [{ clientY: 200 }]
            });
        });

        // diff = 100, resistance = 0.5 => pullDistance = 50. > 20 => isPulling = true
        expect(result.current.pullDistance).toBe(50);
        expect(result.current.isPulling).toBe(true);

        act(() => {
            result.current.handlers.onTouchMove({
                touches: [{ clientY: 300 }]
            });
        });

        // diff = 200, resistance = 0.5 => pullDistance = 100 > 80 threshold
        expect(result.current.pullDistance).toBe(100);

        await act(async () => {
            await result.current.handlers.onTouchEnd();
        });

        expect(onRefresh).toHaveBeenCalledTimes(1);
        expect(result.current.isRefreshing).toBe(false);
        expect(result.current.isPulling).toBe(false);
        expect(result.current.pullDistance).toBe(0);
    });

    it('resets when touch ends below threshold', async () => {
        const onRefresh = vi.fn();
        const { result } = renderHook(() => usePullToRefresh(onRefresh, { threshold: 80 }));

        act(() => {
            result.current.handlers.onTouchStart({
                currentTarget: { scrollTop: 0 },
                touches: [{ clientY: 100 }]
            });
            result.current.handlers.onTouchMove({
                touches: [{ clientY: 150 }]
            });
        });

        // diff = 50 => distance = 25
        expect(result.current.pullDistance).toBe(25);

        await act(async () => {
            await result.current.handlers.onTouchEnd();
        });

        expect(onRefresh).not.toHaveBeenCalled();
        expect(result.current.pullDistance).toBe(0);
        expect(result.current.isPulling).toBe(false);
    });
});
