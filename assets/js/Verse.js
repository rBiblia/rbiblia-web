import React from "react";
import { useIntl } from "react-intl";

export default function Verse({ verseContent, bookId, chapterId, verseId }) {
    const { formatMessage } = useIntl();
    const appLink = "bib://" + bookId + chapterId + ":" + verseId;
    const appVerse = chapterId + ":" + verseId;

    return (
        <div className="row line">
            <div className="col-2 col-lg-1 d-flex align-items-center justify-content-center">
                <a
                    href={appLink}
                    title={formatMessage({ id: "linkOpenInRBibliaApp" })}
                >
                    {appVerse}
                </a>
            </div>
            <div className="col-10 col-lg-11 verse">
                {verseContent.replaceAll("//", "\u000A")}
            </div>
        </div>
    );
}
