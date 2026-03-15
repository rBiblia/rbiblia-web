import React, { useState, useEffect } from "react";
import { safeLocalStorageGetItem, safeLocalStorageSetItem } from "./safeStorage";

const FONT_SIZE_KEY = "rbiblia_font_size";
const MIN_SIZE = 0.8;
const MAX_SIZE = 1.6;
const STEP = 0.1;
const DEFAULT_SIZE = 1.15;

/**
 * Font size control component with persistence
 */
const FontSizeControl = () => {
    const [fontSize, setFontSize] = useState(() => {
        const saved = safeLocalStorageGetItem(FONT_SIZE_KEY);
        return saved ? parseFloat(saved) : DEFAULT_SIZE;
    });
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        // Apply font size to verses
        document.documentElement.style.setProperty(
            "--verse-font-size",
            `${fontSize}rem`
        );
        safeLocalStorageSetItem(FONT_SIZE_KEY, fontSize.toString());
    }, [fontSize]);

    const increase = () => {
        setFontSize((prev) => Math.min(prev + STEP, MAX_SIZE));
    };

    const decrease = () => {
        setFontSize((prev) => Math.max(prev - STEP, MIN_SIZE));
    };

    const reset = () => {
        setFontSize(DEFAULT_SIZE);
    };

    const percentage = Math.round((fontSize / DEFAULT_SIZE) * 100);

    return (
        <div className="font-size-control">
            <button
                className="font-size-toggle"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-label="Change font size"
                title="Change font size"
            >
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path d="M4 7V4h16v3" />
                    <path d="M9 20h6" />
                    <path d="M12 4v16" />
                </svg>
            </button>

            {isExpanded && (
                <div className="font-size-panel">
                    <button
                        className="font-size-btn"
                        onClick={decrease}
                        disabled={fontSize <= MIN_SIZE}
                        aria-label="Decrease font size"
                    >
                        A-
                    </button>
                    <button
                        className="font-size-value"
                        onClick={reset}
                        title="Reset to default"
                    >
                        {percentage}%
                    </button>
                    <button
                        className="font-size-btn"
                        onClick={increase}
                        disabled={fontSize >= MAX_SIZE}
                        aria-label="Increase font size"
                    >
                        A+
                    </button>
                </div>
            )}
        </div>
    );
};

export default FontSizeControl;
