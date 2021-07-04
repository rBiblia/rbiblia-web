import React, {Component} from 'react';

export default class Verse extends Component {
    render() {
        const {verseContent, bookId, chapterId, verseId} = this.props,
              appLink = "bib://" + bookId + chapterId + ":" + verseId;

        return (
            <div className="row">
                <div className="col-1">
                    <a href={appLink}>{verseId}</a>
                </div>
                <div className="col-11">
                    {verseContent}
                </div>
            </div>
        );
    }
}
