import React, {Component} from 'react';

export default class Verse extends Component {
    render() {
        const {verseContent, bookId, chapterId, verseId} = this.props,
              appLink = 'bib://' + bookId + chapterId + ':' + verseId,
              appVerse = bookId+' '+chapterId+':'+verseId;

        return (
            <div className="row">
                <div className="col-2 col-lg-1 d-flex align-items-center justify-content-center">
                    <a href={appLink} title="Otwórz w programie rBiblia dla Windows">{appVerse}</a>
                </div>
                <div className="col-10 col-lg-11">
                    {verseContent}
                </div>
            </div>
        );
    }
}
