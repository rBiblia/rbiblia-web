import React, { Component } from "react";
import TranslationSelector from "./TranslationSelector";
import BookSelector from "./BookSelector";
import ChapterSelector from "./ChapterSelector";

export default class Navigator extends Component {
    render() {
        const {
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
        } = this.props;

        return (
            <header className="row">
                <div className="col-12 col-sm-4">
                    <TranslationSelector
                        selectedTranslation={selectedTranslation}
                        translations={translations}
                        changeSelectedTranslation={changeSelectedTranslation}
                    />
                </div>
                <div className="col-12 col-sm-4">
                    <BookSelector
                        selectedBook={selectedBook}
                        books={books}
                        structure={structure}
                        isStructureLoaded={isStructureLoaded}
                        changeSelectedBook={changeSelectedBook}
                    />
                </div>
                <div className="col-12 col-sm-4">
                    <ChapterSelector
                        selectedChapter={selectedChapter}
                        chapters={chapters}
                        isStructureLoaded={isStructureLoaded}
                        changeSelectedChapter={changeSelectedChapter}
                    />
                </div>
            </header>
        );
    }
}
