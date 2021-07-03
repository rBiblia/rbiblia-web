import React, {Component} from 'react';
import Verse from "./Verse";

export default class Reader extends Component {
    render() {
        return (
            <main className="row">
                <div className="col-12">
                    <Verse bookId={"gen"} chapterId={1} verseId={1} verseContent={"Treść wersetu"} />
                    <Verse bookId={"exo"} chapterId={1} verseId={2} verseContent={"Treść wersetu"} />
                    <Verse bookId={"lev"} chapterId={1} verseId={3} verseContent={"Treść wersetu"} />
                </div>
            </main>
        );
    }
}
