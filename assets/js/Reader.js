import React, { memo } from "react";
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
    onVerseLongPress,
    onVerseCompare,
    notesVersion = 0,
    highlightedVerse = null,
    allNotes = {},
    allTranslationNotes = {},
}) {
    if (!showVerses || !verses) {
        return <SkeletonLoader lines={15} />;
    }

    return (
        <main className="container">
            <div className="row">
                <div className="col-12">
                    {Object.entries(verses).map(([verseId, verseContent]) => (
                        <Verse
                            key={verseId}
                            bookId={selectedBook}
                            chapterId={selectedChapter}
                            verseId={verseId}
                            translationId={selectedTranslation}
                            translationName={translationName}
                            verseContent={verseContent}
                            onVerseClick={onVerseClick}
                            onVerseLongPress={onVerseLongPress}
                            onVerseCompare={onVerseCompare}
                            notesVersion={notesVersion}
                            isHighlighted={highlightedVerse === verseId}
                            allNotes={allNotes}
                            allTranslationNotes={allTranslationNotes}
                        />
                    ))}
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
    onVerseLongPress: PropTypes.func,
    onVerseCompare: PropTypes.func,
    notesVersion: PropTypes.number,
    highlightedVerse: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    allNotes: PropTypes.object,
    allTranslationNotes: PropTypes.object,
};

export default Reader;
