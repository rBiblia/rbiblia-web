import React, { useRef, useState, useEffect, useMemo, memo } from "react";
import PropTypes from "prop-types";
import { useIntl } from "react-intl";
import { getVerseKey, getTranslationVerseKey } from "./Notes";

const LONG_PRESS_DURATION = 500; // ms
const NOTE_PREVIEW_TOGGLE_THRESHOLD = 80;
const VERSE_ACTIONS_GAP_PX = 6;

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
    onVerseClick,
    onVerseLongPress,
    onVerseCompare,
    notesVersion = 0, // Increment to force note indicator refresh
    isHighlighted = false,
    allNotes = {},
    allTranslationNotes = {},
    continuousText = false,
}) {
    const { formatMessage } = useIntl();
    const [isNoteExpanded, setIsNoteExpanded] = useState(false);
    const verseRef = useRef(null);
    const verseNumberCellRef = useRef(null);
    const verseActionsRef = useRef(null);

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

    // Handle verse actions positioning when space is limited on the left
    useEffect(() => {
        const checkSpace = () => {
            if (!verseNumberCellRef.current || !verseActionsRef.current) return;

            const rect = verseNumberCellRef.current.getBoundingClientRect();
            const actionsWidth = 80; // Estimated width of actions panel

            if (rect.left < actionsWidth) {
                verseActionsRef.current.classList.add("shifted-right");
            } else {
                verseActionsRef.current.classList.remove("shifted-right");
            }
        };

        // Check initially and on scroll/resize
        checkSpace();
        window.addEventListener("scroll", checkSpace, { passive: true });
        window.addEventListener("resize", checkSpace);

        return () => {
            window.removeEventListener("scroll", checkSpace);
            window.removeEventListener("resize", checkSpace);
        };
    }, []);

    const openNoteEditor = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onVerseLongPress?.(verseId);
    };

    const openComparison = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onVerseCompare?.(verseId);
    };

    if (continuousText) {
        return (
            <span
                ref={verseRef}
                className={`verse verse-continuous line ${hasAnyNote ? "has-note" : ""} ${
                    isHighlighted ? "highlighted" : ""
                }`}
                data-verse-id={verseId}
            >
                <span className="verse-number-inline">
                    <a
                        href={appLink}
                        title={formatMessage({ id: "linkOpenInRBibliaApp" })}
                        onClick={(e) => {
                            if (shouldBlockAppDeepLink()) {
                                e.preventDefault();
                            }
                            e.stopPropagation();
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
        >
            <div
                ref={verseNumberCellRef}
                className="col-2 col-lg-1 verse-number-cell"
            >
                <div ref={verseActionsRef} className="verse-actions">
                    <button
                        type="button"
                        className={`verse-action-btn verse-action-note ${
                            hasAnyNote ? "has-note-value" : ""
                        }`}
                        title={formatMessage({
                            id: hasAnyNote ? "edit" : "addNote",
                        })}
                        onClick={openNoteEditor}
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        className="verse-action-btn verse-action-compare"
                        title={formatMessage({ id: "compareVerse" })}
                        onClick={openComparison}
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M16 3h5v5" />
                            <path d="M8 3H3v5" />
                            <path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" />
                            <path d="m15 9 6-6" />
                        </svg>
                    </button>
                </div>
                <a
                    href={appLink}
                    title={formatMessage({ id: "linkOpenInRBibliaApp" })}
                    onClick={(e) => {
                        if (shouldBlockAppDeepLink()) {
                            e.preventDefault();
                        }
                        e.stopPropagation();
                    }}
                >
                    {chapterId}:{verseId}
                </a>
            </div>
            <div className="col-10 col-lg-11 verse" data-verse-id={verseId}>
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
    onVerseClick: PropTypes.func,
    onVerseLongPress: PropTypes.func,
    onVerseCompare: PropTypes.func,
    notesVersion: PropTypes.number,
    isHighlighted: PropTypes.bool,
    allNotes: PropTypes.object,
    allTranslationNotes: PropTypes.object,
    continuousText: PropTypes.bool,
};

export default Verse;
