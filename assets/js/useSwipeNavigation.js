import { useEffect, useRef } from "react";

/**
 * Custom hook for swipe navigation on touch devices
 * @param {Function} onSwipeLeft - Callback for left swipe (next chapter)
 * @param {Function} onSwipeRight - Callback for right swipe (previous chapter)
 * @param {Object} options - Configuration options
 */
const useSwipeNavigation = (
    onSwipeLeft,
    onSwipeRight,
    { threshold = 50, enabled = true } = {}
) => {
    const touchStartX = useRef(null);
    const touchStartY = useRef(null);
    const touchEndX = useRef(null);
    const touchEndY = useRef(null);

    useEffect(() => {
        if (!enabled) return;

        const handleTouchStart = (e) => {
            touchStartX.current = e.touches[0].clientX;
            touchStartY.current = e.touches[0].clientY;
        };

        const handleTouchMove = (e) => {
            touchEndX.current = e.touches[0].clientX;
            touchEndY.current = e.touches[0].clientY;
        };

        const handleTouchEnd = () => {
            if (
                touchStartX.current === null ||
                touchEndX.current === null ||
                touchStartY.current === null ||
                touchEndY.current === null
            ) {
                return;
            }

            const deltaX = touchStartX.current - touchEndX.current;
            const deltaY = touchStartY.current - touchEndY.current;

            // Only trigger if horizontal swipe is more significant than vertical
            // This prevents accidental swipes when scrolling
            if (
                Math.abs(deltaX) > Math.abs(deltaY) &&
                Math.abs(deltaX) > threshold
            ) {
                if (deltaX > 0) {
                    // Swiped left - go to next chapter
                    onSwipeLeft?.();
                } else {
                    // Swiped right - go to previous chapter
                    onSwipeRight?.();
                }
            }

            // Reset values
            touchStartX.current = null;
            touchStartY.current = null;
            touchEndX.current = null;
            touchEndY.current = null;
        };

        // Add event listeners to the document
        document.addEventListener("touchstart", handleTouchStart, {
            passive: true,
        });
        document.addEventListener("touchmove", handleTouchMove, {
            passive: true,
        });
        document.addEventListener("touchend", handleTouchEnd, {
            passive: true,
        });

        return () => {
            document.removeEventListener("touchstart", handleTouchStart);
            document.removeEventListener("touchmove", handleTouchMove);
            document.removeEventListener("touchend", handleTouchEnd);
        };
    }, [onSwipeLeft, onSwipeRight, threshold, enabled]);
};

export default useSwipeNavigation;
