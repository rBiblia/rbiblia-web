import { useState, useEffect, useRef } from "react";

/**
 * Custom hook to detect scroll direction and toggle visibility of navigation elements.
 * Returns true if navigation should be visible, false otherwise.
 *
 * @param {Object} options Configuration options
 * @param {number} options.threshold Minimum scroll difference to trigger change
 * @param {number} options.topThreshold Distance from top where nav is always visible
 */
const useScrollDirection = ({ threshold = 50, topThreshold = 10 } = {}) => {
    const [isVisible, setIsVisible] = useState(true);
    const prevScrollY = useRef(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Always show at the very top of the page
            if (currentScrollY < topThreshold) {
                setIsVisible(true);
                prevScrollY.current = currentScrollY;
                return;
            }

            // Calculate difference
            const diff = Math.abs(currentScrollY - prevScrollY.current);

            // Ignore small scroll movements to prevent jitter
            if (diff < threshold) {
                return;
            }

            // Determine direction
            if (currentScrollY > prevScrollY.current) {
                // Scrolling down -> Hide
                setIsVisible(false);
            } else {
                // Scrolling up -> Show
                setIsVisible(true);
            }

            prevScrollY.current = currentScrollY;
        };

        window.addEventListener("scroll", handleScroll, { passive: true });

        return () => window.removeEventListener("scroll", handleScroll);
    }, [threshold, topThreshold]);

    return isVisible;
};

export default useScrollDirection;
