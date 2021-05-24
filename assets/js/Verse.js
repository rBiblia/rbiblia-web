import React, {Component} from 'react';

export default class Verse extends Component {
    render() {
        return (
            <div className="row">
                <div className="col-1">
                    {this.props.verseId}
                </div>
                <div className="col-11">
                    {this.props.verseContent}
                </div>
            </div>
        );
    }
}
