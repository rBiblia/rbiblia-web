import { useState, useEffect, useRef } from "react";

/**
 * Custom hook for debouncing values
 * @param {any} value - The value to debounce
 * @param {number} delay - Delay in milliseconds
 * @param {number} minLength - Minimum length required (for strings)
 * @returns {any} The debounced value
 */
export const useDebounce = (value, delay, minLength = 0) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    const timeoutRef = useRef(null);

    useEffect(() => {
        // For strings, check minimum length
        if (typeof value === "string" && value.length < minLength) {
            setDebouncedValue("");
            return;
        }

        timeoutRef.current = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [value, delay, minLength]);

    return debouncedValue;
};

/**
 * Custom hook for debounced callback
 * @param {Function} callback - The callback to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} The debounced callback
 */
export const useDebouncedCallback = (callback, delay) => {
    const timeoutRef = useRef(null);
    const callbackRef = useRef(callback);

    // Update callback ref on each render
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return (...args) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            callbackRef.current(...args);
        }, delay);
    };
};

export default useDebounce;
