import React, { useCallback, memo } from "react";
import { useIntl } from "react-intl";
import TranslationSelector from "./TranslationSelector";
import DirectionalNavigationButton from "./DirectionalNavigationButton";
import PropTypes from "prop-types";
import useScrollDirection from "./useScrollDirection";
import Icon from "./Icon";
import blurOnTouchInteraction from "./blurOnTouchInteraction";

const Navigator = memo(function Navigator({
    translations,
    books,
    structure,
    isStructureLoading,
    listsLoading,
    changeSelectedTranslation,
    selectedTranslation,
    selectedBook,
    selectedChapter,
    prevChapter,
    nextChapter,
    isNextBookAvailable,
    isPrevBookAvailable,
    isNextChapterAvailable,
    isPrevChapterAvailable,
    onOpenSelection,
    onOpenNotes,
    onOpenSearch,
    onOpenSettings,
    onOpenChapterComparison,
    className = "",
    immersiveDisabled = false,
}) {
    const { formatMessage } = useIntl();
    const isNavVisible = useScrollDirection({ disabled: immersiveDisabled });

    const isNextChapterOrBookAvailable =
        isNextChapterAvailable || isNextBookAvailable;
    const isPrevChapterOrBookAvailable =
        isPrevChapterAvailable || isPrevBookAvailable;

    const handlePrevChapter = useCallback(() => prevChapter(), [prevChapter]);

    return (
        <header
            className={`container sticky-top pt-2 pb-2 user-select-none ${className} ${
                isNavVisible ? "" : "nav-hidden-header"
            }`}
        >
            <div className="row align-items-center">
                <div className="col-10 col-lg-3 translation-col pe-1 pe-lg-3">
                    <TranslationSelector
                        selectedTranslation={selectedTranslation}
                        translations={translations}
                        changeSelectedTranslation={changeSelectedTranslation}
                        isLoading={listsLoading}
                    />
                </div>

                {/* Mobile action button (Search) */}
                <div className="col-2 d-lg-none d-flex justify-content-end ps-0">
                    <button
                        className="nav-action-btn d-flex justify-content-center align-items-center"
                        onClick={(e) => {
                            onOpenSearch();
                            blurOnTouchInteraction(e);
                        }}
                        onPointerUp={blurOnTouchInteraction}
                        onTouchEnd={blurOnTouchInteraction}
                        title={formatMessage({ id: "search" })}
                        style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "12px",
                        }}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                    </button>
                </div>

                <div className="col-1 d-none d-lg-flex justify-content-center p-0">
                    <DirectionalNavigationButton
                        direction="left"
                        onClick={handlePrevChapter}
                        disabled={!isPrevChapterOrBookAvailable}
                    />
                </div>

                <div className="col-4 d-none d-lg-block text-center location-col">
                    <button
                        className="btn btn-location p-0 w-100"
                        onClick={onOpenSelection}
                        disabled={isStructureLoading}
                        title={
                            books[selectedBook] ? books[selectedBook].name : ""
                        }
                    >
                        <span className="location-text">
                            {books[selectedBook]
                                ? `${books[selectedBook].name} ${selectedChapter}`
                                : "..."}
                        </span>
                        <Icon name="chevron-down" className="ms-2" size={16} />
                    </button>
                </div>

                <div className="col-1 d-none d-lg-flex justify-content-center p-0">
                    <DirectionalNavigationButton
                        direction="right"
                        onClick={nextChapter}
                        disabled={!isNextChapterOrBookAvailable}
                    />
                </div>

                {/* Desktop action buttons */}
                <div className="col-3 d-none d-lg-flex justify-content-end gap-2">
                    <button
                        className="nav-action-btn"
                        onClick={(e) => {
                            onOpenSelection();
                            blurOnTouchInteraction(e);
                        }}
                        onPointerUp={blurOnTouchInteraction}
                        onTouchEnd={blurOnTouchInteraction}
                        title={formatMessage({ id: "selectBook" })}
                    >
                        <Icon name="book-marked" size={20} />
                    </button>
                    <button
                        className="nav-action-btn"
                        onClick={(e) => {
                            onOpenSearch();
                            blurOnTouchInteraction(e);
                        }}
                        onPointerUp={blurOnTouchInteraction}
                        onTouchEnd={blurOnTouchInteraction}
                        title={formatMessage({ id: "search" })}
                    >
                        <Icon name="search" size={20} />
                    </button>
                    <button
                        className="nav-action-btn"
                        onClick={(e) => {
                            onOpenNotes();
                            blurOnTouchInteraction(e);
                        }}
                        onPointerUp={blurOnTouchInteraction}
                        onTouchEnd={blurOnTouchInteraction}
                        title={formatMessage({ id: "notes" })}
                    >
                        <Icon name="square-pen" size={20} />
                    </button>
                    <button
                        className="nav-action-btn"
                        onClick={(e) => {
                            onOpenChapterComparison();
                            blurOnTouchInteraction(e);
                        }}
                        onPointerUp={blurOnTouchInteraction}
                        onTouchEnd={blurOnTouchInteraction}
                        title={formatMessage({ id: "chapterComparison" })}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
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
                    <button
                        className="nav-action-btn"
                        onClick={(e) => {
                            onOpenSettings();
                            blurOnTouchInteraction(e);
                        }}
                        onPointerUp={blurOnTouchInteraction}
                        onTouchEnd={blurOnTouchInteraction}
                        title={formatMessage({ id: "settings" })}
                    >
                        <Icon name="settings" size={20} />
                    </button>
                </div>
            </div>
        </header>
    );
});

Navigator.propTypes = {
    translations: PropTypes.array.isRequired,
    books: PropTypes.objectOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
        })
    ).isRequired,
    structure: PropTypes.object,
    isStructureLoading: PropTypes.bool.isRequired,
    listsLoading: PropTypes.bool.isRequired,
    changeSelectedTranslation: PropTypes.func.isRequired,
    selectedTranslation: PropTypes.string,
    selectedBook: PropTypes.string,
    selectedChapter: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    prevChapter: PropTypes.func.isRequired,
    nextChapter: PropTypes.func.isRequired,
    isNextBookAvailable: PropTypes.bool.isRequired,
    isPrevBookAvailable: PropTypes.bool.isRequired,
    isNextChapterAvailable: PropTypes.bool.isRequired,
    isPrevChapterAvailable: PropTypes.bool.isRequired,
    onOpenSelection: PropTypes.func.isRequired,
    onOpenNotes: PropTypes.func.isRequired,
    onOpenSearch: PropTypes.func.isRequired,
    onOpenSettings: PropTypes.func.isRequired,
    onOpenChapterComparison: PropTypes.func.isRequired,
    className: PropTypes.string,
    immersiveDisabled: PropTypes.bool,
};

export default Navigator;
