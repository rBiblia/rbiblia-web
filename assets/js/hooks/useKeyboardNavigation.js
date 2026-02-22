import { useEffect, useCallback } from "react";

/**
 * Custom hook for keyboard navigation between chapters/books
 * Mirrors the keyboard navigation from ComparisonGrid but adapted for the main reading view.
 *
 * Keys:
 *   ArrowLeft  → previous chapter (or previous book if at first chapter)
 *   ArrowRight → next chapter (or next book if at last chapter)
 *
 * Navigation is automatically suppressed when:
 *   - An overlay / modal / panel is open
 *   - An input, textarea, or select element is focused
 *
 * @param {Function} onPrevChapter - Callback to go to the previous chapter
 * @param {Function} onNextChapter - Callback to go to the next chapter
 * @param {Object}   options
 * @param {boolean}  options.enabled - Master switch (set false when overlays are open)
 */
const useKeyboardNavigation = (
    onPrevChapter,
    onNextChapter,
    { enabled = true } = {}
) => {
    const handleKeyDown = useCallback(
        (e) => {
            // Don't intercept when user is typing in an input
            const activeTag = document.activeElement?.tagName?.toLowerCase();
            if (
                activeTag === "input" ||
                activeTag === "textarea" ||
                activeTag === "select"
            ) {
                return;
            }

            // Don't intercept when an element with a contenteditable attribute is focused
            if (document.activeElement?.isContentEditable) {
                return;
            }

            if (e.key === "ArrowLeft") {
                e.preventDefault();
                onPrevChapter?.();
            } else if (e.key === "ArrowRight") {
                e.preventDefault();
                onNextChapter?.();
            }
        },
        [onPrevChapter, onNextChapter]
    );

    useEffect(() => {
        if (!enabled) return;

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown, enabled]);
};

export default useKeyboardNavigation;
