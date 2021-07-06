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

            selectedTranslation: null,
            selectedBook: null,
            selectedChapter: null,
        };
    }

    onTranslationSelectorChange(event) {
        const selectedTranslation = event.target.value;

        this.setState({
            showVerses: false,
            isStructureLoaded: false,
            selectedTranslation: null,
            selectedBook: null,
            selectedChapter: null,
        });

        fetch("/translation/" + selectedTranslation)
            .then(res => res.json())
            .then(
                (result) => {
                    this.setState({
                        isStructureLoaded: true,
                        selectedTranslation: selectedTranslation,
                        structure: result.data,
                    });
                },
                (error) => {
                    this.setState({
                        error
                    });
                }
            );
    }

    onBookSelectorChange(event) {
        const selectedBook = event.target.value;

        this.setState({
            selectedBook: selectedBook,
            chapters: this.state.structure[selectedBook],
        });
    }

    onChapterSelectorChange(event) {
        const selectedChapter = event.target.value;

        this.setState({
            showVerses: false,
        });

        fetch("/translation/" + this.state.selectedTranslation + "/book/" + this.state.selectedBook + "/chapter/" + selectedChapter)
            .then(res => res.json())
            .then(
                (result) => {
                    this.setState({
                        showVerses: true,
                        selectedChapter: selectedChapter,
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
            );

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
    }

    render() {
        const {error, isTranslationsLoaded, isBooksLoaded, isStructureLoaded, showVerses,
            translations, books, verses, structure, chapters,
            selectedBook, selectedChapter} = this.state;

        if (error) {
            return (
                <div className="container">
                    Wystąpił nieoczekiwany błąd: {error.message}
                </div>
            );
        } else if (!isTranslationsLoaded || !isBooksLoaded) {
            return (
                <div className="container">
                    Przygotowuję aplikację, proszę czekać...
                </div>
            );
        } else {
            return (
                <div className="container app">
                    <Navigator
                        books={books}
                        translations={translations}
                        structure={structure}
                        chapters={chapters}
                        isStructureLoaded={isStructureLoaded}
                        onTranslationSelectorChange={this.onTranslationSelectorChange.bind(this)}
                        onBookSelectorChange={this.onBookSelectorChange.bind(this)}
                        onChapterSelectorChange={this.onChapterSelectorChange.bind(this)}
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
