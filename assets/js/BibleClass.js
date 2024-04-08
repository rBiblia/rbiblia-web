import React, { Component } from "react";
import Navigator from "./Navigator";
import Reader from "./Reader";
import StatusBar from "./StatusBar";
import { DEFAULT_BOOK } from "../consts";
import getDataFromCurrentPathname from "./getDataFromCurrentPathname";
import AppError from "./AppError";
import AppLoading from "./AppLoading";
import updateHistory from "./updateHistory";

class BibleClass extends Component {
    constructor(props) {
        super(props);

        this.state = {
            error: null,

            isBooksLoaded: false,
            isTranslationsLoaded: false,
            isStructureLoaded: false,
            showVerses: false,

            // Note: it holds all books, NOT only translation specific
            books: [],
            translations: [],
            structure: [],
            chapters: [],
            verses: [],

            selectedTranslation: getDataFromCurrentPathname().translation, // default translation
            selectedBook: getDataFromCurrentPathname().book,
            selectedChapter: getDataFromCurrentPathname().chapter,
        };

        this.getAppropriateBook = this.getAppropriateBook.bind(this);
        this.getAppropriateChapter = this.getAppropriateChapter.bind(this);
        this.setLocaleAndUpdateHistory =
            this.setLocaleAndUpdateHistory.bind(this);
        this.loadTranslationsAndBooks =
            this.loadTranslationsAndBooks.bind(this);
        this.changeSelectedTranslation =
            this.changeSelectedTranslation.bind(this);
        this.changeSelectedBook = this.changeSelectedBook.bind(this);
        this.changeSelectedChapter = this.changeSelectedChapter.bind(this);
        this.prevBook = this.prevBook.bind(this);
        this.nextBook = this.nextBook.bind(this);
        this.prevChapter = this.prevChapter.bind(this);
        this.nextChapter = this.nextChapter.bind(this);
        this.isNextChapterAvailable = this.isNextChapterAvailable.bind(this);
        this.isPrevChapterAvailable = this.isPrevChapterAvailable.bind(this);
        this.isNextBookAvailable = this.isNextBookAvailable.bind(this);
        this.isPrevBookAvailable = this.isPrevBookAvailable.bind(this);
        this.getBookIndex = this.getBookIndex.bind(this);
        this.getChapterIndex = this.getChapterIndex.bind(this);
    }

    changeSelectedTranslation(selectedTranslation) {
        this.setState(
            {
                showVerses: false,
                isStructureLoaded: false,
                selectedTranslation: selectedTranslation,
            },
            () => {
                const {
                    intl: { locale },
                } = this.props;

                fetch("/api/" + locale + "/translation/" + selectedTranslation)
                    .then((res) => res.json())
                    .then(
                        (result) => {
                            this.setState(
                                {
                                    isStructureLoaded: true,
                                    structure: result.data,
                                },
                                () => {
                                    this.changeSelectedBook(
                                        this.getAppropriateBook()
                                    );
                                }
                            );
                        },
                        (error) => {
                            this.setState({
                                error,
                            });
                        }
                    );
            }
        );
    }

    getAppropriateBook() {
        const { structure, selectedBook } = this.state;
        if (structure[selectedBook]) {
            return selectedBook;
        }

        if (structure[DEFAULT_BOOK]) {
            return DEFAULT_BOOK;
        }

        // otherwise, get first book
        return Object.keys(structure)[0];
    }

    getAppropriateChapter(keepChapterIfPossible) {
        const { structure, selectedBook, selectedChapter } = this.state;

        if (
            keepChapterIfPossible &&
            structure[selectedBook].some(
                (chapter) => chapter == selectedChapter
            )
        ) {
            return selectedChapter;
        }

        return structure[selectedBook][0];
    }

    changeSelectedBook(selectedBook) {
        // if the book is the same as previous, keep the chapter if possible as well
        const keepChapterIfPossible = selectedBook === this.state.selectedBook;

        this.setState(
            {
                selectedBook: selectedBook,
                chapters: this.state.structure[selectedBook],
            },
            () => {
                this.changeSelectedChapter(
                    this.getAppropriateChapter(keepChapterIfPossible)
                );
            }
        );
    }

    changeSelectedChapter(selectedChapter) {
        const { selectedTranslation, selectedBook } = this.state;
        const {
            intl: { locale },
        } = this.props;
        updateHistory(
            locale,
            selectedTranslation,
            selectedBook,
            selectedChapter
        );

        this.setState({
            showVerses: false,
        });

        fetch(
            "/api/" +
                locale +
                "/translation/" +
                selectedTranslation +
                "/book/" +
                selectedBook +
                "/chapter/" +
                selectedChapter
        )
            .then((res) => res.json())
            .then(
                (result) => {
                    this.setState({
                        showVerses: true,
                        selectedChapter,
                        verses: result.data,
                    });
                },
                (error) => {
                    this.setState({
                        error,
                    });
                }
            );
    }

    componentDidMount() {
        this.loadTranslationsAndBooks();
    }

    loadTranslationsAndBooks() {
        const {
            intl: { locale },
        } = this.props;

        // TODO: We can store translations in localStorage
        Promise.all([
            fetch("/api/" + locale + "/translation")
                .then((res) => res.json())
                .then(
                    (result) => {
                        this.setState({
                            isTranslationsLoaded: true,
                            translations: result.data,
                        });
                    },
                    (error) => {
                        this.setState({
                            isTranslationsLoaded: true,
                            error,
                        });
                    }
                ),
            fetch("/api/" + locale + "/book")
                .then((res) => res.json())
                .then(
                    (result) => {
                        this.setState({
                            isBooksLoaded: true,
                            books: result.data,
                        });
                    },
                    (error) => {
                        this.setState({
                            isBooksLoaded: true,
                            error,
                        });
                    }
                ),
        ]).then(() => {
            this.changeSelectedTranslation(this.state.selectedTranslation);
        });
    }

    setLocaleAndUpdateHistory(locale) {
        const { setLocale } = this.props;
        const { chapter, book, translation } = getDataFromCurrentPathname();

        setLocale(locale);
        this.updateHistory(locale, translation, book, chapter);
        this.setState({}, this.loadTranslationsAndBooks);
    }

    getChapterIndex() {
        // Note: parseInt is here because sometimes selectedChapter is a string.
        //    Probably when chapter is parsed from the URL during first load it become a string

        return this.state.chapters.findIndex(
            (value) => value === parseInt(this.state.selectedChapter)
        );
    }

    isNextChapterAvailable() {
        return (
            this.state.isStructureLoaded &&
            typeof this.state.chapters[this.getChapterIndex() + 1] !==
                "undefined"
        );
    }

    isPrevChapterAvailable() {
        return this.state.isStructureLoaded && this.getChapterIndex() !== 0;
    }

    getBookIndex() {
        return Object.keys(this.state.structure).findIndex(
            (bookKey) => bookKey === this.state.selectedBook
        );
    }

    isNextBookAvailable() {
        return (
            this.state.isStructureLoaded &&
            typeof this.state.structure[
                Object.keys(this.state.structure)[this.getBookIndex() + 1]
            ] !== "undefined"
        );
    }

    isPrevBookAvailable() {
        return this.state.isStructureLoaded && this.getBookIndex() !== 0;
    }

    nextChapter() {
        if (this.isNextChapterAvailable()) {
            this.changeSelectedChapter(
                this.state.chapters[this.getChapterIndex() + 1]
            );
            return;
        }
        this.nextBook();
    }

    prevChapter() {
        if (this.isPrevChapterAvailable()) {
            this.changeSelectedChapter(
                this.state.chapters[this.getChapterIndex() - 1]
            );
            return;
        }
        this.prevBook(true);
    }

    nextBook() {
        if (this.isNextBookAvailable()) {
            this.changeSelectedBook(
                Object.keys(this.state.structure)[this.getBookIndex() + 1]
            );
        }
    }

    prevBook(startFromLastVerse = false) {
        if (!this.isPrevBookAvailable()) {
            return;
        }

        this.changeSelectedBook(
            Object.keys(this.state.structure)[this.getBookIndex() - 1]
        );
        if (startFromLastVerse) {
            // Note: We are using setTimeout here to wait for setState to be updated
            // It's not very clean hack but it should work
            // It might be refactored after this component would be:
            // - refactored to functional component
            // - refactored to use hooks and contexts
            setTimeout(() => {
                this.changeSelectedChapter(
                    this.state.chapters[this.state.chapters.length - 1]
                );
            }, 100);
        }
    }

    render() {
        const {
            error,
            isTranslationsLoaded,
            isBooksLoaded,
            isStructureLoaded,
            showVerses,
            translations,
            books,
            verses,
            structure,
            chapters,
            selectedBook,
            selectedChapter,
            selectedTranslation,
        } = this.state;

        if (error) {
            return <AppError message={error.message} />;
        } else if (!isTranslationsLoaded || !isBooksLoaded) {
            return <AppLoading />;
        } else {
            return (
                <>
                    <Navigator
                        books={books}
                        translations={translations}
                        selectedTranslation={selectedTranslation}
                        selectedChapter={selectedChapter}
                        selectedBook={selectedBook}
                        structure={structure}
                        chapters={chapters}
                        isStructureLoaded={isStructureLoaded}
                        changeSelectedTranslation={
                            this.changeSelectedTranslation
                        }
                        changeSelectedBook={this.changeSelectedBook}
                        changeSelectedChapter={this.changeSelectedChapter}
                        prevChapter={this.prevChapter}
                        nextChapter={this.nextChapter}
                        prevBook={this.prevBook}
                        nextBook={this.nextBook}
                        isPrevBookAvailable={this.isPrevBookAvailable}
                        isNextBookAvailable={this.isNextBookAvailable}
                        isPrevChapterAvailable={this.isPrevChapterAvailable}
                        isNextChapterAvailable={this.isNextChapterAvailable}
                    />
                    <Reader
                        showVerses={showVerses}
                        selectedBook={selectedBook}
                        selectedChapter={selectedChapter}
                        verses={verses}
                    />
                    <StatusBar
                        setLocaleAndUpdateHistory={
                            this.setLocaleAndUpdateHistory
                        }
                        translations={translations}
                    />
                </>
            );
        }
    }
}

export default BibleClass;
