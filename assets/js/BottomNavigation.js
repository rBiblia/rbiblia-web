import React from "react";
import { useIntl } from "react-intl";
import Icon from "./Icon";

const BottomNavigation = ({
    onPrevChapter,
    onNextChapter,
    onOpenSelection,
    onOpenNotes,
    onOpenSearch,
    isPrevAvailable,
    isNextAvailable,
    currentBook,
    currentChapter,
    className = "",
}) => {
    const { formatMessage } = useIntl();

    return (
        <nav className={`bottom-nav d-lg-none ${className}`}>
            {/* Left arrow - far left position */}
            <button
                className="bottom-nav-btn bottom-nav-arrow"
                onClick={onPrevChapter}
                disabled={!isPrevAvailable}
                aria-label={formatMessage({ id: "previousChapter" })}
            >
                <Icon
                    className="bottom-nav-icon"
                    name="chevron-left"
                    strokeWidth="2.5"
                />
            </button>

            {/* Notes - left of center */}
            <button
                className="bottom-nav-btn"
                onClick={onOpenNotes}
                aria-label={formatMessage({ id: "notes" })}
            >
                <Icon className="bottom-nav-icon" name="square-pen" />
                <span className="bottom-nav-label">
                    {formatMessage({ id: "notes" })}
                </span>
            </button>

            {/* Book selection - center */}
            <button
                className="bottom-nav-btn bottom-nav-btn-center"
                onClick={onOpenSelection}
                aria-label={formatMessage({ id: "selectBook" })}
            >
                <Icon className="bottom-nav-icon" name="book-marked" />
                <span className="bottom-nav-label bottom-nav-location">
                    {currentBook ? `${currentBook} ${currentChapter}` : "..."}
                </span>
            </button>

            {/* Search - right of center */}
            <button
                className="bottom-nav-btn"
                onClick={onOpenSearch}
                aria-label={formatMessage({ id: "search" })}
            >
                <Icon className="bottom-nav-icon" name="search" />
                <span className="bottom-nav-label">
                    {formatMessage({ id: "search" })}
                </span>
            </button>

            {/* Right arrow - far right position */}
            <button
                className="bottom-nav-btn bottom-nav-arrow"
                onClick={onNextChapter}
                disabled={!isNextAvailable}
                aria-label={formatMessage({ id: "nextChapter" })}
            >
                <Icon
                    className="bottom-nav-icon"
                    name="chevron-right"
                    strokeWidth="2.5"
                />
            </button>
        </nav>
    );
};

export default BottomNavigation;
