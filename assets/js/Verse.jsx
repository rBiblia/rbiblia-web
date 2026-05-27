import React, { useRef, useState, useEffect, useMemo, memo } from "react";
import PropTypes from "prop-types";
import { useIntl } from "react-intl";
import { getVerseKey, getTranslationVerseKey } from "./Notes";

const NOTE_PREVIEW_TOGGLE_THRESHOLD = 80;

const shouldBlockAppDeepLink = () => {
    if (
        typeof globalThis === "undefined" ||
        typeof globalThis.matchMedia !== "function"
    ) {
        return false;
    }

    return (
        globalThis.matchMedia("(hover: none) and (pointer: coarse)").matches ||
        globalThis.matchMedia("(max-width: 991.98px)").matches
    );
};

const Verse = memo(function Verse({
    verseContent,
    bookId,
    chapterId,
    verseId,
    translationId,
    translationName,
    notesVersion = 0, // Increment to force note indicator refresh
    isHighlighted = false,
    allNotes = {},
    allTranslationNotes = {},
    continuousText = false,
    hideVerseNumbers = false,
}) {
    const { formatMessage } = useIntl();
    const [isNoteExpanded, setIsNoteExpanded] = useState(false);
    const verseRef = useRef(null);

    // Derive note state from pre-loaded notes (no localStorage reads)
    const noteKey = getVerseKey(bookId, chapterId, verseId);
    const noteText = useMemo(
        () => (allNotes[noteKey] || "").trim(),
        [allNotes, noteKey]
    );
    const hasNote = !!noteText;

    const tKey = translationId
        ? getTranslationVerseKey(translationId, bookId, chapterId, verseId)
        : null;
    const translationNoteText = useMemo(
        () => (tKey ? (allTranslationNotes[tKey] || "").trim() : ""),
        [allTranslationNotes, tKey]
    );
    const hasTranslationNote = !!translationNoteText;

    // Reset expansion when verse changes
    useEffect(() => {
        setIsNoteExpanded(false);
    }, [bookId, chapterId, verseId, notesVersion]);

    const hasAnyNote = hasNote || hasTranslationNote;

    const isNoteExpandable =
        (hasNote &&
            (noteText.length > NOTE_PREVIEW_TOGGLE_THRESHOLD ||
                noteText.includes("\n"))) ||
        (hasTranslationNote &&
            (translationNoteText.length > NOTE_PREVIEW_TOGGLE_THRESHOLD ||
                translationNoteText.includes("\n")));

    const appLink = `bib://${bookId}${chapterId}:${verseId}`;
    const shouldHideNumbers = continuousText && hideVerseNumbers;

    // Scroll into view when highlighted
    useEffect(() => {
        if (isHighlighted && verseRef.current) {
            // Use rAF to ensure the element is laid out before scrolling
            requestAnimationFrame(() => {
                verseRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });
            });
        }
    }, [isHighlighted]);

    if (continuousText) {
        return (
            <span
                ref={verseRef}
                className={`verse verse-continuous line ${hasAnyNote ? "has-note" : ""} ${
                    isHighlighted ? "highlighted" : ""
                }`}
                data-verse-id={verseId}
                data-book-id={bookId}
                data-chapter-id={chapterId}
            >
                <span className={`verse-number-inline ${shouldHideNumbers ? "d-none" : ""}`}>
                    <a
                        href={appLink}
                        title={formatMessage({ id: "linkOpenInRBibliaApp" })}
                        onClick={(e) => {
                            if (shouldBlockAppDeepLink()) {
                                e.preventDefault();
                            } else {
                                e.stopPropagation();
                            }
                        }}
                    >
                        {verseId}
                    </a>
                </span>
                <span className="verse-text-inline">
                    {verseContent.replaceAll("//", " ")}
                </span>
                {hasAnyNote && (
                    <span className="verse-note-indicator-inline" title={noteText || translationNoteText}>
                        📝
                    </span>
                )}
            </span>
        );
    }

    return (
        <article
            ref={verseRef}
            className={`row line ${hasAnyNote ? "has-note" : ""} ${
                isHighlighted ? "highlighted" : ""
            }`}
            data-verse-id={verseId}
            data-book-id={bookId}
            data-chapter-id={chapterId}
        >
            <div
                className={`col-2 col-lg-1 verse-number-cell ${shouldHideNumbers ? "d-none" : ""}`}
            >
                <a
                    href={appLink}
                    title={formatMessage({ id: "linkOpenInRBibliaApp" })}
                    onClick={(e) => {
                        if (shouldBlockAppDeepLink()) {
                            e.preventDefault();
                        } else {
                            e.stopPropagation();
                        }
                    }}
                >
                    {chapterId}:{verseId}
                </a>
            </div>
            <div
                className={`${shouldHideNumbers ? "col-12" : "col-10 col-lg-11"} verse`}
            >
                <div>{verseContent.replaceAll("//", "\u000A")}</div>
                {hasAnyNote && (
                    <div className="verse-note-preview-wrap">
                        {hasNote && (
                            <div
                                className={`verse-note-preview ${
                                    isNoteExpandable && !isNoteExpanded
                                        ? "is-collapsed"
                                        : ""
                                }`}
                            >
                                {hasTranslationNote && (
                                    <span className="verse-note-label verse-note-label-global">
                                        {formatMessage({
                                            id: "noteGlobal",
                                        })}
                                    </span>
                                )}
                                {noteText}
                            </div>
                        )}
                        {hasTranslationNote && (
                            <div
                                className={`verse-note-preview verse-note-preview-translation ${
                                    isNoteExpandable && !isNoteExpanded
                                        ? "is-collapsed"
                                        : ""
                                }`}
                            >
                                {hasNote && (
                                    <span className="verse-note-label verse-note-label-translation">
                                        {translationName || translationId}
                                    </span>
                                )}
                                {translationNoteText}
                            </div>
                        )}
                        {isNoteExpandable && (
                            <button
                                type="button"
                                className="verse-note-toggle"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsNoteExpanded((value) => !value);
                                }}
                            >
                                {formatMessage({
                                    id: isNoteExpanded
                                        ? "showLess"
                                        : "showMore",
                                })}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </article>
    );
});

Verse.propTypes = {
    verseContent: PropTypes.string.isRequired,
    bookId: PropTypes.string.isRequired,
    chapterId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
    verseId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
    translationId: PropTypes.string,
    translationName: PropTypes.string,
    notesVersion: PropTypes.number,
    isHighlighted: PropTypes.bool,
    allNotes: PropTypes.object,
    allTranslationNotes: PropTypes.object,
    continuousText: PropTypes.bool,
    hideVerseNumbers: PropTypes.bool,
};

export default Verse;
