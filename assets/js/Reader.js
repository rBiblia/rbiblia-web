import React from "react";
import Verse from "./Verse";

const Reader = ({ selectedBook, selectedChapter, verses, showVerses }) => {
    if (!showVerses || !verses) {
        return <main className="container preloader-image" />;
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
                        />
                    ))}
                </div>
            </div>
        </main>
    );
};

export default Reader;
