import React, {Component} from 'react';

export default class Verse extends Component {
    render() {
        return (
            <div className="row">
                <div className="col-1">
                    <a href={"bib://" + this.props.bookId + this.props.chapterId + ":" + this.props.verseId}>{this.props.verseId}</a>
                </div>
                <div className="col-11">
                    {this.props.verseContent}
                </div>
            </div>
        );
    }
}
