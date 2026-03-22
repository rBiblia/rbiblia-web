import React, { memo } from "react";
import { useIntl } from "react-intl";
import PropTypes from "prop-types";
import Icon from "./Icon";
import useScrollDirection from "./useScrollDirection";

const BottomNavigation = memo(function BottomNavigation({
    onPrevChapter,
    onNextChapter,
    onOpenSelection,
    onOpenNotes,
    onOpenChapterComparison,
    isPrevAvailable,
    isNextAvailable,
    currentBook,
    currentChapter,
    className = "",
    immersiveDisabled = false,
}) {
    const { formatMessage } = useIntl();
    const isNavVisible = useScrollDirection({ disabled: immersiveDisabled });

    return (
        <nav
            className={`bottom-nav d-lg-none ${className} ${
                isNavVisible ? "" : "nav-hidden-bottom"
            }`}
        >
            {/* Left arrow - far left position */}
            <button
                className="bottom-nav-btn bottom-nav-arrow"
                onClick={(e) => {
                    e.currentTarget.blur();
                    onPrevChapter();
                }}
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

            {/* Chapter Comparison - right of center */}
            <button
                className="bottom-nav-btn"
                onClick={onOpenChapterComparison}
                aria-label={formatMessage({ id: "chapterComparison" })}
            >
                <svg
                    className="bottom-nav-icon"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
                    <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
                    <path d="M7 21h10" />
                    <path d="M12 3v18" />
                    <path d="M3 7h18" />
                </svg>
            </button>

            {/* Right arrow - far right position */}
            <button
                className="bottom-nav-btn bottom-nav-arrow"
                onClick={(e) => {
                    e.currentTarget.blur();
                    onNextChapter();
                }}
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
});

BottomNavigation.propTypes = {
    onPrevChapter: PropTypes.func.isRequired,
    onNextChapter: PropTypes.func.isRequired,
    onOpenSelection: PropTypes.func.isRequired,
    onOpenNotes: PropTypes.func.isRequired,
    onOpenChapterComparison: PropTypes.func.isRequired,
    isPrevAvailable: PropTypes.bool.isRequired,
    isNextAvailable: PropTypes.bool.isRequired,
    currentBook: PropTypes.string.isRequired,
    currentChapter: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
    className: PropTypes.string,
    immersiveDisabled: PropTypes.bool,
};

export default BottomNavigation;
