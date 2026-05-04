import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import useScrollDirection from '../../assets/js/useScrollDirection';

describe('useScrollDirection', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.stubGlobal('requestAnimationFrame', (cb) => cb());
        vi.stubGlobal('cancelAnimationFrame', vi.fn());
        // Reset scrollY
        Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('initializes as visible', () => {
        const { result } = renderHook(() => useScrollDirection());
        expect(result.current).toBe(true);
    });

    it('remains visible when disabled', () => {
        const { result } = renderHook(() => useScrollDirection({ disabled: true }));
        
        act(() => {
            window.scrollY = 1000;
            window.dispatchEvent(new Event('scroll'));
        });
        
        expect(result.current).toBe(true);
    });

    it('hides when scrolling down past threshold', () => {
        const { result } = renderHook(() => useScrollDirection({ threshold: 50, topThreshold: 10 }));
        
        act(() => {
            window.scrollY = 100; // difference is 100 > 50, direction is down
            window.dispatchEvent(new Event('scroll'));
        });
        
        expect(result.current).toBe(false);
    });

    it('shows when scrolling up past threshold', () => {
        const { result } = renderHook(() => useScrollDirection({ threshold: 50, topThreshold: 10 }));
        
        act(() => {
            window.scrollY = 200; // scroll down
            window.dispatchEvent(new Event('scroll'));
        });
        
        expect(result.current).toBe(false);

        act(() => {
            window.scrollY = 100; // scroll up by 100
            window.dispatchEvent(new Event('scroll'));
        });
        
        expect(result.current).toBe(true);
    });

    it('ignores scrolls below threshold', () => {
        const { result } = renderHook(() => useScrollDirection({ threshold: 50, topThreshold: 10 }));
        
        act(() => {
            window.scrollY = 40; // difference is 40 < 50
            window.dispatchEvent(new Event('scroll'));
        });
        
        expect(result.current).toBe(true);
    });

    it('always shows when scroll is near top', () => {
        const { result } = renderHook(() => useScrollDirection({ threshold: 50, topThreshold: 10 }));
        
        // Hide it first
        act(() => {
            window.scrollY = 100; 
            window.dispatchEvent(new Event('scroll'));
        });
        expect(result.current).toBe(false);

        // Scroll near top
        act(() => {
            window.scrollY = 5; 
            window.dispatchEvent(new Event('scroll'));
        });
        expect(result.current).toBe(true);
    });
});
