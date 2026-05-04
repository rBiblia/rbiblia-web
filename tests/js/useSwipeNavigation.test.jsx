import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import useSwipeNavigation from '../../assets/js/useSwipeNavigation';

describe('useSwipeNavigation', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    const simulateSwipe = (startX, startY, endX, endY) => {
        const touchStartEvent = new TouchEvent('touchstart', {
            touches: [{ clientX: startX, clientY: startY }],
            bubbles: true,
        });
        const touchEndEvent = new TouchEvent('touchend', {
            changedTouches: [{ clientX: endX, clientY: endY }],
            bubbles: true,
        });
        document.dispatchEvent(touchStartEvent);
        document.dispatchEvent(touchEndEvent);
    };

    it('calls onSwipeLeft when swiping left beyond threshold', () => {
        const onSwipeLeft = vi.fn();
        const onSwipeRight = vi.fn();

        const { unmount } = renderHook(() =>
            useSwipeNavigation(onSwipeLeft, onSwipeRight, { threshold: 50 })
        );

        // Swipe left: start at 200, end at 100 (delta = 100 > 50)
        simulateSwipe(200, 100, 100, 100);

        expect(onSwipeLeft).toHaveBeenCalledTimes(1);
        expect(onSwipeRight).not.toHaveBeenCalled();

        unmount();
    });

    it('calls onSwipeRight when swiping right beyond threshold', () => {
        const onSwipeLeft = vi.fn();
        const onSwipeRight = vi.fn();

        const { unmount } = renderHook(() =>
            useSwipeNavigation(onSwipeLeft, onSwipeRight, { threshold: 50 })
        );

        // Swipe right: start at 100, end at 200 (delta = -100, abs > 50)
        simulateSwipe(100, 100, 200, 100);

        expect(onSwipeRight).toHaveBeenCalledTimes(1);
        expect(onSwipeLeft).not.toHaveBeenCalled();

        unmount();
    });

    it('does not trigger when swipe distance is below threshold', () => {
        const onSwipeLeft = vi.fn();
        const onSwipeRight = vi.fn();

        const { unmount } = renderHook(() =>
            useSwipeNavigation(onSwipeLeft, onSwipeRight, { threshold: 50 })
        );

        // Small swipe: delta = 30 < 50
        simulateSwipe(200, 100, 170, 100);

        expect(onSwipeLeft).not.toHaveBeenCalled();
        expect(onSwipeRight).not.toHaveBeenCalled();

        unmount();
    });

    it('does not trigger when vertical scroll exceeds horizontal swipe', () => {
        const onSwipeLeft = vi.fn();
        const onSwipeRight = vi.fn();

        const { unmount } = renderHook(() =>
            useSwipeNavigation(onSwipeLeft, onSwipeRight, { threshold: 50 })
        );

        // Vertical scroll: deltaX=60, deltaY=100 — vertical wins
        simulateSwipe(200, 100, 140, 0);

        expect(onSwipeLeft).not.toHaveBeenCalled();
        expect(onSwipeRight).not.toHaveBeenCalled();

        unmount();
    });

    it('does nothing when disabled', () => {
        const onSwipeLeft = vi.fn();
        const onSwipeRight = vi.fn();

        const { unmount } = renderHook(() =>
            useSwipeNavigation(onSwipeLeft, onSwipeRight, { enabled: false })
        );

        simulateSwipe(200, 100, 100, 100);

        expect(onSwipeLeft).not.toHaveBeenCalled();
        expect(onSwipeRight).not.toHaveBeenCalled();

        unmount();
    });

    it('removes event listeners on unmount', () => {
        const removeSpy = vi.spyOn(document, 'removeEventListener');
        const onSwipeLeft = vi.fn();
        const onSwipeRight = vi.fn();

        const { unmount } = renderHook(() =>
            useSwipeNavigation(onSwipeLeft, onSwipeRight)
        );

        unmount();

        expect(removeSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
        expect(removeSpy).toHaveBeenCalledWith('touchend', expect.any(Function));

        removeSpy.mockRestore();
    });

    it('handles touchend without changedTouches gracefully', () => {
        const onSwipeLeft = vi.fn();
        const onSwipeRight = vi.fn();

        const { unmount } = renderHook(() =>
            useSwipeNavigation(onSwipeLeft, onSwipeRight)
        );

        // Fire touchstart
        const touchStartEvent = new TouchEvent('touchstart', {
            touches: [{ clientX: 200, clientY: 100 }],
            bubbles: true,
        });
        document.dispatchEvent(touchStartEvent);

        // Fire touchend with no changedTouches
        const touchEndEvent = new TouchEvent('touchend', {
            changedTouches: [],
            bubbles: true,
        });
        document.dispatchEvent(touchEndEvent);

        expect(onSwipeLeft).not.toHaveBeenCalled();
        expect(onSwipeRight).not.toHaveBeenCalled();

        unmount();
    });
});
