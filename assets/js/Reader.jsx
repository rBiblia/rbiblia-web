import React, { memo, useCallback } from "react";
import PropTypes from "prop-types";
import Verse from "./Verse";
import SkeletonLoader from "./SkeletonLoader";

const Reader = memo(function Reader({
    selectedBook,
    selectedChapter,
    selectedTranslation,
    translationName,
    verses,
    showVerses,
    onVerseClick,
    notesVersion = 0,
    highlightedVerse = null,
    allNotes = {},
    allTranslationNotes = {},
    continuousText = false,
    hideVerseNumbers = false,
}) {
    const handleClick = useCallback(
        (e) => {
            const lineEl = e.target.closest(".line");
            if (!lineEl) return;

            const verseId = lineEl.dataset.verseId;
            const bookId = lineEl.dataset.bookId;
            const chapterId = lineEl.dataset.chapterId;
            if (verseId) {
                onVerseClick?.(verseId, bookId, chapterId);
            }
        },
        [onVerseClick]
    );

    const handleKeyDown = useCallback(
        (e) => {
            if (e.key === "Enter" || e.key === " ") {
                const lineEl = e.target.closest(".line");
                if (lineEl) {
                    if (e.key === " ") e.preventDefault();
                    const verseId = lineEl.dataset.verseId;
                    const bookId = lineEl.dataset.bookId;
                    const chapterId = lineEl.dataset.chapterId;
                    if (verseId) {
                        onVerseClick?.(verseId, bookId, chapterId);
                    }
                }
            }
        },
        [onVerseClick]
    );

    if (!showVerses || !verses) {
        return <SkeletonLoader lines={15} />;
    }

    return (
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
        <main
            className="container" // NOSONAR
            onClick={handleClick}
            onKeyDown={handleKeyDown}
        >
            <div className={`row ${continuousText ? "reader-continuous-row" : ""}`}>
                <div className={`col-12 ${continuousText ? "reader-continuous" : ""}`}>
                    {Object.entries(verses).map(
                        ([verseId, verseContent]) => (
                            <Verse
                                key={verseId}
                                bookId={selectedBook}
                                chapterId={selectedChapter}
                                verseId={verseId}
                                translationId={selectedTranslation}
                                translationName={translationName}
                                verseContent={verseContent}
                                onVerseClick={onVerseClick}
                                notesVersion={notesVersion}
                                isHighlighted={highlightedVerse === verseId}
                                allNotes={allNotes}
                                allTranslationNotes={allTranslationNotes}
                                continuousText={continuousText}
                                hideVerseNumbers={hideVerseNumbers}
                            />
                        )
                    )}
                </div>
            </div>
        </main>
    );
});

Reader.propTypes = {
    selectedBook: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    selectedChapter: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    selectedTranslation: PropTypes.string,
    translationName: PropTypes.string,
    verses: PropTypes.objectOf(PropTypes.string),
    showVerses: PropTypes.bool,
    onVerseClick: PropTypes.func.isRequired,
    notesVersion: PropTypes.number,
    highlightedVerse: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    allNotes: PropTypes.object,
    allTranslationNotes: PropTypes.object,
    continuousText: PropTypes.bool,
    hideVerseNumbers: PropTypes.bool,
    selectedBookName: PropTypes.string,
};

export default Reader;
