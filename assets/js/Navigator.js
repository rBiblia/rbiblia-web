import React, {Component} from "react";
import TranslationSelector from "./TranslationSelector";
import BookSelector from "./BookSelector";
import ChapterSelector from "./ChapterSelector";

export default class Navigator extends Component {
    render() {
        return (
            <div className="row">
                <div className="col-4">
                    <TranslationSelector translations={this.props.translations} />
                </div>
                <div className="col-4">
                    <BookSelector books={this.props.books} />
                </div>
                <div className="col-4">
                    <ChapterSelector/>
                </div>
            </div>
        );
    }
}
