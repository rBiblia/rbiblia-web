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
    // Store callbacks in refs so event listeners don't need to be re-attached
    // when callbacks change (avoids listener churn on every render)
    const onSwipeLeftRef = useRef(onSwipeLeft);
    const onSwipeRightRef = useRef(onSwipeRight);
    onSwipeLeftRef.current = onSwipeLeft;
    onSwipeRightRef.current = onSwipeRight;

    const touchStartX = useRef(null);
    const touchStartY = useRef(null);

    useEffect(() => {
        if (!enabled) return;

        const handleTouchStart = (e) => {
            touchStartX.current = e.touches[0].clientX;
            touchStartY.current = e.touches[0].clientY;
        };

        const handleTouchEnd = (e) => {
            if (
                touchStartX.current === null ||
                touchStartY.current === null ||
                !e.changedTouches ||
                e.changedTouches.length === 0
            ) {
                return;
            }

            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;

            const deltaX = touchStartX.current - endX;
            const deltaY = touchStartY.current - endY;

            // Only trigger if horizontal swipe is more significant than vertical
            // This prevents accidental swipes when scrolling
            if (
                Math.abs(deltaX) > Math.abs(deltaY) &&
                Math.abs(deltaX) > threshold
            ) {
                if (deltaX > 0) {
                    // Swiped left - go to next chapter
                    onSwipeLeftRef.current?.();
                } else {
                    // Swiped right - go to previous chapter
                    onSwipeRightRef.current?.();
                }
            }

            // Reset values
            touchStartX.current = null;
            touchStartY.current = null;
        };

        // Add event listeners to the document
        document.addEventListener("touchstart", handleTouchStart, {
            passive: true,
        });
        document.addEventListener("touchend", handleTouchEnd, {
            passive: true,
        });

        return () => {
            document.removeEventListener("touchstart", handleTouchStart);
            document.removeEventListener("touchend", handleTouchEnd);
        };
    }, [threshold, enabled]); // Callbacks removed from deps — stored in refs
};

export default useSwipeNavigation;
