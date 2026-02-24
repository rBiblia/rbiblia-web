import React from "react";
import Verse from "./Verse";
import SkeletonLoader from "./SkeletonLoader";

const Reader = ({
    selectedBook,
    selectedChapter,
    verses,
    showVerses,
    onVerseClick,
    onVerseLongPress,
    notesVersion = 0,
    highlightedVerse = null,
}) => {
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
                            verseContent={verseContent}
                            onClick={() => onVerseClick(verseId)}
                            onLongPress={() => onVerseLongPress?.(verseId)}
                            notesVersion={notesVersion}
                            isHighlighted={highlightedVerse === verseId}
                        />
                    ))}
                </div>
            </div>
        </main>
    );
};

export default Reader;
