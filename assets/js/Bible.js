import React, { Component } from "react";
import Cookies from "js-cookie";
import Navigator from "./Navigator";
import Reader from "./Reader";
import StatusBar from "./StatusBar";
import { injectIntl } from "react-intl";
import { URL_PREFIX, DEFAULT_BOOK, COOKIE_EXPIRES } from "../consts";
import getDataFromCurrentPathname from "./getDataFromCurrentPathname";

class Bible extends Component {
    constructor(props) {
        super(props);

        this.state = {
            error: null,

            isBooksLoaded: false,
            isTranslationsLoaded: false,
            isStructureLoaded: false,
            showVerses: false,

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
    }

    /*
     * The history (url path) should be updated when
     * the last call is finished and verses are ready to be displayed
     */
    updateHistory(language, translation, book, chapter) {
        Cookies.set("recent_language", language, { expires: COOKIE_EXPIRES });
        Cookies.set("recent_translation", translation, {
            expires: COOKIE_EXPIRES,
        });
        Cookies.set("recent_book", book, { expires: COOKIE_EXPIRES });
        Cookies.set("recent_chapter", chapter, { expires: COOKIE_EXPIRES });

        window.history.pushState(
            {},
            "",
            `${URL_PREFIX}/${language}/${translation}/${book}/${chapter}`
        );
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
        this.updateHistory(
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

        const {
            intl: { formatMessage },
        } = this.props;

        if (error) {
            return (
                <div className="container app-preloader">
                    <div className="row">
                        <div className="col-12 d-flex align-items-center justify-content-center">
                            {formatMessage({ id: "unexpectedErrorOccurred" })}{" "}
                            {error.message}
                        </div>
                    </div>
                </div>
            );
        } else if (!isTranslationsLoaded || !isBooksLoaded) {
            return (
                <div className="container app-preloader">
                    <div className="row">
                        <div className="col-12 d-flex align-items-center justify-content-center">
                            {formatMessage({
                                id: "preparingApplicationPleaseWait",
                            })}
                        </div>
                    </div>
                </div>
            );
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

export default injectIntl(Bible);
