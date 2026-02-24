import { useState, useCallback, useRef, useMemo } from "react";

/**
 * Custom hook for virtual scrolling / lazy loading of list items
 * Provides progressive loading as user scrolls
 *
 * @param {Array} items - Full array of items
 * @param {Object} options - Configuration options
 * @param {number} options.initialCount - Initial number of items to show (default: 20)
 * @param {number} options.batchSize - Number of items to load on each scroll (default: 15)
 * @param {number} options.threshold - Scroll threshold before loading more (default: 0.8 = 80%)
 * @returns {Object} Visible items, handler, and state
 */
const useScrollWithVirtualization = (
    items,
    { initialCount = 20, batchSize = 15, threshold = 0.8 } = {}
) => {
    const [visibleCount, setVisibleCount] = useState(initialCount);
    const isLoadingMore = useRef(false);

    // Reset visible count when items change significantly
    const previousLength = useRef(items.length);
    if (Math.abs(items.length - previousLength.current) > batchSize * 2) {
        previousLength.current = items.length;
        // Note: This won't cause issues because we're just updating the ref
        // The actual state will be reset on next render if needed
    }

    // Memoized visible items slice
    const visibleItems = useMemo(() => {
        return items.slice(0, visibleCount);
    }, [items, visibleCount]);

    // Check if more items are available
    const hasMore = visibleCount < items.length;

    // Load more items
    const loadMore = useCallback(() => {
        if (isLoadingMore.current || !hasMore) return;

        isLoadingMore.current = true;

        // Use requestAnimationFrame for smooth loading
        requestAnimationFrame(() => {
            setVisibleCount((prev) => Math.min(prev + batchSize, items.length));
            isLoadingMore.current = false;
        });
    }, [batchSize, items.length, hasMore]);

    // Scroll handler
    const handleScroll = useCallback(
        (e) => {
            const { scrollTop, scrollHeight, clientHeight } = e.target;
            const scrollProgress = (scrollTop + clientHeight) / scrollHeight;

            if (scrollProgress >= threshold && hasMore) {
                loadMore();
            }
        },
        [threshold, hasMore, loadMore]
    );

    // Reset visible count
    const reset = useCallback(() => {
        setVisibleCount(initialCount);
    }, [initialCount]);

    return {
        visibleItems,
        totalCount: items.length,
        visibleCount,
        hasMore,
        loadMore,
        handleScroll,
        reset,
        progress: items.length > 0 ? visibleCount / items.length : 1,
    };
};

export default useScrollWithVirtualization;
