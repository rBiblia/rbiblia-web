import React, { Component } from "react";
import TranslationSelector from "./TranslationSelector";
import BookSelector from "./BookSelector";
import ChapterSelector from "./ChapterSelector";

export default function Navigator({
    translations,
    books,
    structure,
    chapters,
    isStructureLoaded,
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
}) {
    return (
        <header className="container sticky-top pt-2 pb-2">
            <div className="row">
                <div className="col-12 col-sm-4">
                    <TranslationSelector
                        selectedTranslation={selectedTranslation}
                        translations={translations}
                        changeSelectedTranslation={changeSelectedTranslation}
                    />
                </div>
                <div
                    className="col-1 col-sm-1 d-flex justify-content-end pe-0"
                    onClick={prevBook}
                >
                    <div className="icon-navigator icon-navigator-left"></div>
                </div>
                <div className="col-10 col-sm-2">
                    <BookSelector
                        selectedBook={selectedBook}
                        books={books}
                        structure={structure}
                        isStructureLoaded={isStructureLoaded}
                        changeSelectedBook={changeSelectedBook}
                    />
                </div>
                <div
                    className="col-1 col-sm-1 d-flex justify-content-start ps-0"
                    onClick={nextBook}
                >
                    <div className="icon-navigator icon-navigator-right"></div>
                </div>
                <div
                    className="col-1 col-sm-1 d-flex justify-content-end pe-0"
                    onClick={prevChapter}
                >
                    <div className="icon-navigator icon-navigator-left"></div>
                </div>
                <div className="col-10 col-sm-2">
                    <ChapterSelector
                        selectedChapter={selectedChapter}
                        chapters={chapters}
                        isStructureLoaded={isStructureLoaded}
                        changeSelectedChapter={changeSelectedChapter}
                    />
                </div>
                <div
                    className="col-1 col-sm-1 d-flex justify-content-start ps-0"
                    onClick={nextChapter}
                >
                    <div className="icon-navigator icon-navigator-right"></div>
                </div>
            </div>
        </header>
    );
}
