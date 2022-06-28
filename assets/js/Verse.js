import React from 'react';

export default function Verse({verseContent, bookId, chapterId, verseId}) {
    const appLink = 'bib://' + bookId + chapterId + ':' + verseId;
    const appVerse = bookId+'\u00A0'+chapterId+':'+verseId;

    return (
        <div className="row">
            <div className="col-2 col-lg-1 d-flex align-items-center justify-content-center">
                <a href={appLink} title="Otwórz w programie rBiblia dla Windows">{appVerse}</a>
            </div>
            <div className="col-10 col-lg-11 verse">
                {verseContent.replaceAll('//', "\u000A")}
            </div>
        </div>
    );
}
