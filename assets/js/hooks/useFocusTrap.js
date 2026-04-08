import { useEffect, useRef } from "react";

/**
 * Custom hook for trapping focus within a modal/panel
 * Implements accessibility best practices for modal dialogs
 *
 * @param {boolean} isOpen - Whether the modal is open
 * @param {Function} onClose - Callback to close the modal (triggered by Escape key)
 * @returns {Object} ref - Ref to attach to the container element
 */
const useFocusTrap = (isOpen, onClose) => {
    const containerRef = useRef(null);
    const previousActiveElement = useRef(null);

    useEffect(() => {
        if (!isOpen) return;

        // Store the previously focused element
        previousActiveElement.current = document.activeElement;

        const container = containerRef.current;
        if (!container) return;

        // Get all focusable elements
        const getFocusableElements = () => {
            return container.querySelectorAll(
                "button:not([disabled]), " +
                    "[href], " +
                    "input:not([disabled]), " +
                    "select:not([disabled]), " +
                    "textarea:not([disabled]), " +
                    '[tabindex]:not([tabindex="-1"]):not([disabled])'
            );
        };

        const handleKeyDown = (e) => {
            // Handle Escape key
            if (e.key === "Escape") {
                e.preventDefault();
                onClose?.();
                return;
            }

            // Handle Tab key for focus trapping
            if (e.key === "Tab") {
                const focusableElements = getFocusableElements();
                if (focusableElements.length === 0) return;

                const firstElement = focusableElements[0];
                const lastElement =
                    focusableElements[focusableElements.length - 1];

                if (e.shiftKey) {
                    // Shift + Tab: go backwards
                    if (
                        document.activeElement === firstElement ||
                        !container.contains(document.activeElement)
                    ) {
                        e.preventDefault();
                        lastElement?.focus();
                    }
                } else if (
                    document.activeElement === lastElement ||
                    !container.contains(document.activeElement)
                ) {
                    // Tab: go forwards
                    e.preventDefault();
                    firstElement?.focus();
                }
            }
        };

        // Set initial focus with a small delay to ensure DOM is ready
        const focusTimer = setTimeout(() => {
            const focusableElements = getFocusableElements();
            // Try to find a close button or first focusable element
            const closeButton = container.querySelector('[class*="close"]');
            const firstInput = container.querySelector("input, textarea");
            const targetElement =
                firstInput || closeButton || focusableElements[0];
            targetElement?.focus();
        }, 10);

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            clearTimeout(focusTimer);
            document.removeEventListener("keydown", handleKeyDown);

            // Restore focus to the previously focused element
            if (previousActiveElement.current?.focus) {
                // Avoid browser auto-scrolling the page when restoring focus.
                // This can fight verse scrollIntoView after selecting a search result,
                // especially in Chromium-based browsers (e.g. Brave).
                try {
                    previousActiveElement.current.focus({
                        preventScroll: true,
                    });
                } catch {
                    // Fallback for older browsers that don't support focus options
                    previousActiveElement.current.focus();
                }
            }
        };
    }, [isOpen, onClose]);

    return containerRef;
};

export default useFocusTrap;
