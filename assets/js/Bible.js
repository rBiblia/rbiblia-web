import React, {Component} from "react";
import Navigator from "./Navigator";
import Reader from "./Reader";

export default class Bible extends Component {
    constructor(props) {
        super(props);

        this.state = {
            error: null,
            isBooksLoaded: false,
            isTranslationsLoaded: false,
            translations: [],
            books: [],
        };
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
        const {error, isTranslationsLoaded, isBooksLoaded, translations, books} = this.state;

        if (error) {
            return (
                <div>Wystąpił nieoczekiwany błąd: {error.message}</div>
            );
        } else if (!isTranslationsLoaded || !isBooksLoaded) {
            return (
                <div className="container">
                    Przygotowuję aplikację, proszę czekać...
                </div>
            );
        } else {
            return (
                <div className="container">
                    <Navigator translations={translations} books={books} />
                    <Reader/>
                </div>
            );
        }
    }
}
