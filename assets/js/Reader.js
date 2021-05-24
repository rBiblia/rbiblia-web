import React, {Component} from 'react';
import Verse from "./Verse";

export default class Reader extends Component {
    render() {
        return (
            <div className="row">
                <div className="col-12">
                    <Verse verseId={1} verseContent={"Treść wersetu"} />
                    <Verse verseId={2} verseContent={"Treść wersetu"} />
                    <Verse verseId={3} verseContent={"Treść wersetu"} />
                </div>
            </div>
        );
    }
}
