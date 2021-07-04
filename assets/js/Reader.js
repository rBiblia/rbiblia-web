import React, {Component} from 'react';
import Verse from "./Verse";

export default class Reader extends Component {
    render() {
        const {selectedBook, selectedChapter, verses, showVerses} = this.props;

        if (showVerses) {
            return (
                <main className="row">
                    <div className="col-12">
                        {Object.entries(verses).map(verse => {
                            return (
                                <Verse
                                    key={verse[0]}
                                    bookId={selectedBook}
                                    chapterId={selectedChapter}
                                    verseId={verse[0]}
                                    verseContent={verse[1]}
                                />
                            );
                        })}
                    </div>
                </main>
            );
        } else
            return (
                <main className="row">
                    <div className="col-12 text-center">
                        Ładowanie...
                    </div>
                </main>
            );
    }
}
