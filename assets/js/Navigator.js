import React, {Component} from "react";
import TranslationSelector from "./TranslationSelector";
import BookSelector from "./BookSelector";
import ChapterSelector from "./ChapterSelector";

export default class Navigator extends Component {
    render() {
        const {translations, books, structure, chapters, isStructureLoaded,
            onTranslationSelectorChange, onBookSelectorChange, onChapterSelectorChange} = this.props;

        return (
            <header className="row">
                <div className="col-12 col-sm-4">
                    <TranslationSelector
                        translations={translations}
                        onTranslationSelectorChange={onTranslationSelectorChange}
                    />
                </div>
                <div className="col-12 col-sm-4">
                    <BookSelector
                        books={books}
                        structure={structure}
                        isStructureLoaded={isStructureLoaded}
                        onBookSelectorChange={onBookSelectorChange}
                    />
                </div>
                <div className="col-12 col-sm-4">
                    <ChapterSelector
                        chapters={chapters}
                        isStructureLoaded={isStructureLoaded}
                        onChapterSelectorChange={onChapterSelectorChange}
                    />
                </div>
            </header>
        );
    }
}
