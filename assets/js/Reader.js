import React, { Component } from "react";
import Verse from "./Verse";

export default class Reader extends Component {
    render() {
        const { selectedBook, selectedChapter, verses, showVerses } =
            this.props;

        if (showVerses && verses) {
            return (
                <main className="container">
                    <div className="row">
                        <div className="col-12">
                            {Object.entries(verses).map((verse) => (
                                <Verse
                                    key={verse[0]}
                                    bookId={selectedBook}
                                    chapterId={selectedChapter}
                                    verseId={verse[0]}
                                    verseContent={verse[1]}
                                />
                            ))}
                        </div>
                    </div>
                </main>
            );
        }

        return (
            <main className="container">
                <div className="row">
                    <div className="col-12 text-center m-auto">
                        <div className="preloader-image"></div>
                    </div>
                </div>
            </main>
        );
    }
}
