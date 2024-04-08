import React, { useCallback } from "react";
import TranslationSelector from "./TranslationSelector";
import BookSelector from "./BookSelector";
import ChapterSelector from "./ChapterSelector";
import DirectionalNavigationButton from "./DirectionalNavigationButton";

export default function Navigator({
    translations,
    books,
    structure,
    chapters,
    isStructureLoading,
    changeSelectedTranslation,
    changeSelectedBook,
    changeSelectedChapter,
    selectedTranslation,
    selectedBook,
    selectedChapter,
    prevChapter,
    nextChapter,
    prevBook,
    nextBook,
    isNextBookAvailable,
    isPrevBookAvailable,
    isNextChapterAvailable,
    isPrevChapterAvailable,
}) {
    const isNextChapterOrBookAvailable =
        isNextChapterAvailable() || isNextBookAvailable();
    const isPrevChapterOrBookAvailable =
        isPrevChapterAvailable() || isPrevBookAvailable();

    const handlePrevBook = useCallback(() => prevBook(), [prevBook]);

    return (
        <header className="container sticky-top pt-2 pb-2 user-select-none">
            <div className="row">
                <div className="col-12 col-sm-4">
                    <TranslationSelector
                        selectedTranslation={selectedTranslation}
                        translations={translations}
                        changeSelectedTranslation={changeSelectedTranslation}
                    />
                </div>
                <div className="col-1 col-sm-1 d-flex justify-content-end p-0">
                    <DirectionalNavigationButton
                        direction="left"
                        onClick={handlePrevBook}
                        disabled={!isPrevBookAvailable()}
                    />
                </div>
                <div className="col-10 col-sm-2">
                    <BookSelector
                        selectedBook={selectedBook}
                        books={books}
                        structure={structure}
                        isStructureLoading={isStructureLoading}
                        changeSelectedBook={changeSelectedBook}
                    />
                </div>
                <div className="col-1 col-sm-1 d-flex justify-content-start p-0">
                    <DirectionalNavigationButton
                        direction="right"
                        onClick={nextBook}
                        disabled={!isNextBookAvailable()}
                    />
                </div>
                <div className="col-1 col-sm-1 d-flex justify-content-end p-0">
                    <DirectionalNavigationButton
                        direction="left"
                        onClick={prevChapter}
                        disabled={!isPrevChapterOrBookAvailable}
                    />
                </div>
                <div className="col-10 col-sm-2">
                    <ChapterSelector
                        selectedChapter={selectedChapter}
                        chapters={chapters}
                        isStructureLoading={isStructureLoading}
                        changeSelectedChapter={changeSelectedChapter}
                    />
                </div>
                <div className="col-1 col-sm-1 d-flex justify-content-start p-0">
                    <DirectionalNavigationButton
                        direction="right"
                        onClick={nextChapter}
                        disabled={!isNextChapterOrBookAvailable}
                    />
                </div>
            </div>
        </header>
    );
}
