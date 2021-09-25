import React, {Component} from "react";
import Navigator from "./Navigator";
import Reader from "./Reader";
import StatusBar from "./StatusBar";

export default class Bible extends Component {
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

            selectedTranslation: 'pl_pubg', // default translation
            selectedBook: '',
            selectedChapter: '',
        };
    }

    changeSelectedTranslation(selectedTranslation) {

        this.setState({
            showVerses: false,
            isStructureLoaded: false,
            selectedTranslation: selectedTranslation,
        });

        fetch("/translation/" + selectedTranslation)
            .then(res => res.json())
            .then(
                (result) => {
                    this.setState({
                        isStructureLoaded: true,
                        structure: result.data,
                    }, () => {
                        const defaultBook = result.data.joh ? 'joh' : Object.keys(result.data)[0];
                        this.changeSelectedBook(defaultBook);
                    });
                },
                (error) => {
                    this.setState({
                        error
                    });
                }
            );
    }

    changeSelectedBook(selectedBook) {
        this.setState({
            selectedBook: selectedBook,
            chapters: this.state.structure[selectedBook],
        }, () => {
            const defaultChapter = this.state.structure[selectedBook][0];
            this.changeSelectedChapter(defaultChapter);
        });
    }

    changeSelectedChapter(selectedChapter) {

        this.setState({
            showVerses: false,
        });

        fetch("/translation/" + this.state.selectedTranslation + "/book/" + this.state.selectedBook + "/chapter/" + selectedChapter)
            .then(res => res.json())
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
                        error
                    });
                }
            );
    }

    componentDidMount() {
        Promise.all([
            fetch("/translation")
                .then(res => res.json())
                .then(
                    (result) => {
                        this.setState({
                            isTranslationsLoaded: true,
                            translations: result.data
                        });
                    },
                    (error) => {
                        this.setState({
                            isTranslationsLoaded: true,
                            error
                        });
                    }
                ),
            fetch("/book")
                .then(res => res.json())
                .then(
                    (result) => {
                        this.setState({
                            isBooksLoaded: true,
                            books: result.data
                        });
                    },
                    (error) => {
                        this.setState({
                            isBooksLoaded: true,
                            error
                        });
                    }
                )
            ]).then(() => {
                this.changeSelectedTranslation(this.state.selectedTranslation);
            });
    }

    render() {
        const {error, isTranslationsLoaded, isBooksLoaded, isStructureLoaded, showVerses,
            translations, books, verses, structure, chapters,
            selectedBook, selectedChapter, selectedTranslation} = this.state;

        if (error) {
            return (
                <div className="container app-preloader">
                    <div className="row">
                        <div className="col-12 d-flex align-items-center justify-content-center">
                            Wystąpił nieoczekiwany błąd: {error.message}
                        </div>
                    </div>
                </div>
            );
        } else if (!isTranslationsLoaded || !isBooksLoaded) {
            return (
                <div className="container app-preloader">
                    <div className="row">
                        <div className="col-12 d-flex align-items-center justify-content-center">
                            Przygotowuję aplikację, proszę czekać...
                        </div>
                    </div>
                </div>
            );
        } else {
            return (
                <div className="container app">
                    <Navigator
                        books={books}
                        translations={translations}
                        selectedTranslation={selectedTranslation}
                        selectedChapter={selectedChapter}
                        selectedBook={selectedBook}
                        structure={structure}
                        chapters={chapters}
                        isStructureLoaded={isStructureLoaded}
                        changeSelectedTranslation={this.changeSelectedTranslation.bind(this)}
                        changeSelectedBook={this.changeSelectedBook.bind(this)}
                        changeSelectedChapter={this.changeSelectedChapter.bind(this)}
                    />
                    <Reader
                        showVerses={showVerses}
                        selectedBook={selectedBook}
                        selectedChapter={selectedChapter}
                        verses={verses}
                    />
                    <StatusBar
                        translations={translations}
                    />
                </div>
            );
        }
    }
}
