import { useRef, useCallback } from "react";
import { safeJsonParse } from "./safeJsonParse";

/**
 * Hook for caching verses - prevents re-fetching already downloaded chapters
 * and enables prefetching of next/previous chapters
 */
const useVersesCache = (locale) => {
    // Cache: Map<cacheKey, versesData>
    const cacheRef = useRef(new Map());

    // Maximum number of items in cache (to avoid excessive memory usage)
    const MAX_CACHE_SIZE = 50;

    /**
     * Generate cache key
     */
    const getCacheKey = useCallback((translation, book, chapter) => {
        return `${translation}_${book}_${chapter}`;
    }, []);

    /**
     * Get verses from cache or API
     */
    const getVerses = useCallback(
        async (translation, book, chapter) => {
            const cacheKey = getCacheKey(translation, book, chapter);

            // Check cache
            if (cacheRef.current.has(cacheKey)) {
                return {
                    data: cacheRef.current.get(cacheKey),
                    fromCache: true,
                };
            }

            // Fetch from API
            const response = await fetch(
                `/api/${locale}/translation/${translation}/book/${book}/chapter/${chapter}`
            );
            const result = await safeJsonParse(response);

            // Save to cache
            if (result.data) {
                // Remove oldest items if cache is full
                if (cacheRef.current.size >= MAX_CACHE_SIZE) {
                    const firstKey = cacheRef.current.keys().next().value;
                    cacheRef.current.delete(firstKey);
                }
                cacheRef.current.set(cacheKey, result.data);
            }

            return {
                data: result.data,
                fromCache: false,
            };
        },
        [locale, getCacheKey]
    );

    /**
     * Prefetch chapter in background (non-blocking)
     */
    const prefetch = useCallback(
        (translation, book, chapter) => {
            const cacheKey = getCacheKey(translation, book, chapter);

            // Don't fetch if already in cache
            if (cacheRef.current.has(cacheKey)) {
                return;
            }

            // Fetch in background with low priority
            requestIdleCallback(
                () => {
                    fetch(
                        `/api/${locale}/translation/${translation}/book/${book}/chapter/${chapter}`
                    )
                        .then((res) => safeJsonParse(res))
                        .then((result) => {
                            if (
                                result?.data &&
                                cacheRef.current.size < MAX_CACHE_SIZE
                            ) {
                                cacheRef.current.set(cacheKey, result.data);
                            }
                        })
                        .catch(() => {
                            // Silent error - prefetch is not critical
                        });
                },
                { timeout: 2000 }
            );
        },
        [locale, getCacheKey]
    );

    /**
     * Prefetch next and previous chapters
     */
    const prefetchAdjacent = useCallback(
        (translation, book, chapter, structure) => {
            if (!structure || !structure[book]) return;

            const chapters = structure[book];
            const currentIndex = chapters.indexOf(chapter);

            // Prefetch next chapter
            if (currentIndex < chapters.length - 1) {
                prefetch(translation, book, chapters[currentIndex + 1]);
            }

            // Prefetch previous chapter
            if (currentIndex > 0) {
                prefetch(translation, book, chapters[currentIndex - 1]);
            }
        },
        [prefetch]
    );

    /**
     * Clear cache (e.g. when translation changes)
     */
    const clearCache = useCallback(() => {
        cacheRef.current.clear();
    }, []);

    /**
     * Check if chapter is in cache
     */
    const isInCache = useCallback(
        (translation, book, chapter) => {
            const cacheKey = getCacheKey(translation, book, chapter);
            return cacheRef.current.has(cacheKey);
        },
        [getCacheKey]
    );

    return {
        getVerses,
        prefetch,
        prefetchAdjacent,
        clearCache,
        isInCache,
    };
};

// Polyfill for requestIdleCallback (Safari)
if (
    typeof globalThis !== "undefined" &&
    typeof globalThis.requestIdleCallback !== "function"
) {
    globalThis.requestIdleCallback = (cb, options) => {
        const timeout = options?.timeout || 1000;
        return setTimeout(() => {
            cb({
                didTimeout: false,
                timeRemaining: () => Math.max(0, 50),
            });
        }, Math.min(100, timeout));
    };
    globalThis.cancelIdleCallback = (id) => clearTimeout(id);
}

export default useVersesCache;
