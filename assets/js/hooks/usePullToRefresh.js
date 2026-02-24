import { useState, useRef, useCallback, useEffect } from "react";

/**
 * Custom hook for pull-to-refresh functionality on mobile
 *
 * @param {Function} onRefresh - Async callback to execute on refresh
 * @param {Object} options - Configuration options
 * @param {number} options.threshold - Pull distance threshold in pixels (default: 80)
 * @param {number} options.maxPull - Maximum pull distance in pixels (default: 120)
 * @param {boolean} options.enabled - Whether pull-to-refresh is enabled (default: true)
 * @returns {Object} State and handlers for pull-to-refresh
 */
const usePullToRefresh = (
    onRefresh,
    { threshold = 80, maxPull = 120, enabled = true } = {}
) => {
    const [isPulling, setIsPulling] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);

    const startY = useRef(0);
    const currentY = useRef(0);
    const isScrolledToTop = useRef(true);
    const isPullingRef = useRef(false);

    const handleTouchStart = useCallback(
        (e) => {
            if (!enabled || isRefreshing) return;

            // Check if at top of scroll container
            const target = e.currentTarget;
            isScrolledToTop.current = target.scrollTop === 0;

            if (isScrolledToTop.current) {
                startY.current = e.touches[0].clientY;
                isPullingRef.current = false;
            }
        },
        [enabled, isRefreshing]
    );

    const handleTouchMove = useCallback(
        (e) => {
            if (!enabled || isRefreshing || !isScrolledToTop.current) return;

            currentY.current = e.touches[0].clientY;
            const diff = currentY.current - startY.current;

            // Only trigger if pulling down
            if (diff > 0) {
                // Apply resistance for more natural feel
                const resistance = 0.5;
                const pulledDistance = Math.min(diff * resistance, maxPull);

                setPullDistance(pulledDistance);

                if (pulledDistance > 20 && !isPullingRef.current) {
                    isPullingRef.current = true;
                    setIsPulling(true);
                }
            }
        },
        [enabled, isRefreshing, maxPull]
    );

    const handleTouchEnd = useCallback(async () => {
        if (!enabled || isRefreshing) return;

        if (pullDistance >= threshold) {
            setIsRefreshing(true);
            setPullDistance(0);
            setIsPulling(false);

            try {
                await onRefresh?.();
            } catch (error) {
                console.error("Pull to refresh error:", error);
            } finally {
                setIsRefreshing(false);
            }
        } else {
            setPullDistance(0);
            setIsPulling(false);
        }

        isPullingRef.current = false;
    }, [enabled, isRefreshing, pullDistance, threshold, onRefresh]);

    // Reset state when disabled
    useEffect(() => {
        if (!enabled) {
            setIsPulling(false);
            setPullDistance(0);
            setIsRefreshing(false);
        }
    }, [enabled]);

    return {
        isPulling,
        isRefreshing,
        pullDistance,
        pullProgress: Math.min(pullDistance / threshold, 1),
        handlers: {
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd,
        },
    };
};

export default usePullToRefresh;
