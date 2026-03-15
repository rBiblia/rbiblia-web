import React, { useRef, useState, useEffect, useMemo, useCallback, memo } from "react";
import PropTypes from "prop-types";
import { useIntl } from "react-intl";
import { getVerseKey, getTranslationVerseKey } from "./Notes";

const LONG_PRESS_DURATION = 500; // ms
const NOTE_PREVIEW_TOGGLE_THRESHOLD = 80;
const VERSE_ACTIONS_GAP_PX = 6;

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
    isFirstVerse = false,
    allNotes = {},
    allTranslationNotes = {},
}) {
    const { formatMessage } = useIntl();
    const [isNoteExpanded, setIsNoteExpanded] = useState(false);
    const verseRef = useRef(null);
    const verseNumberCellRef = useRef(null);
    const verseActionsRef = useRef(null);

    // Cache DOM lookups for header / bottom-nav (shared across all hovers)
    const headerElRef = useRef(undefined);
    const bottomNavElRef = useRef(undefined);

    // For the first verse, default to "below" on mount so the tooltip
    // doesn't clip under the sticky header before any hover occurs.
    useEffect(() => {
        if (isFirstVerse && verseActionsRef.current) {
            verseActionsRef.current.classList.add("is-below");
        }
    }, [isFirstVerse]);

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
        (hasNote && (noteText.length > NOTE_PREVIEW_TOGGLE_THRESHOLD || noteText.includes("\n"))) ||
        (hasTranslationNote && (translationNoteText.length > NOTE_PREVIEW_TOGGLE_THRESHOLD || translationNoteText.includes("\n")));

    const appLink = `bib://${bookId}${chapterId}:${verseId}`;

    // Scroll into view when highlighted
    useEffect(() => {
        if (isHighlighted && verseRef.current) {
            verseRef.current.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }
    }, [isHighlighted]);

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

    // Synchronously toggle the "is-below" class on the actions element
    // via direct DOM manipulation.  This MUST happen before the browser
    // processes the CSS :hover rule (which makes the tooltip visible).
    // Using React state (setState) would be too late — the re-render is
    // asynchronous and the tooltip would briefly flash in the wrong position.
    const updateActionsPlacement = useCallback(() => {
        if (typeof window === "undefined") return;

        // On touch devices we hide the actions entirely (CSS media query),
        // so avoid doing any measurements.
        if (
            window.matchMedia &&
            window.matchMedia("(hover: none)").matches
        ) {
            return;
        }

        const cellEl = verseNumberCellRef.current;
        const actionsEl = verseActionsRef.current;
        if (!cellEl || !actionsEl) return;

        const actionsRect = actionsEl.getBoundingClientRect();
        if (!actionsRect.height) {
            actionsEl.classList.remove("is-below");
            return;
        }

        const cellRect = cellEl.getBoundingClientRect();

        // Cache header/bottomNav lookups — they don't change between hovers
        if (headerElRef.current === undefined) {
            headerElRef.current = document.querySelector("header.sticky-top") || null;
        }
        if (bottomNavElRef.current === undefined) {
            bottomNavElRef.current = document.querySelector(".bottom-nav") || null;
        }

        const headerRect = headerElRef.current
            ? headerElRef.current.getBoundingClientRect()
            : null;
        const topLimit = Math.max(headerRect?.bottom ?? 0, 0);

        const bottomNavRect = bottomNavElRef.current
            ? bottomNavElRef.current.getBoundingClientRect()
            : null;
        const bottomLimit = Math.min(
            bottomNavRect?.top ?? window.innerHeight,
            window.innerHeight
        );

        const aboveTop = cellRect.top - actionsRect.height - VERSE_ACTIONS_GAP_PX;
        const belowBottom =
            cellRect.bottom + actionsRect.height + VERSE_ACTIONS_GAP_PX;

        const canShowAbove = aboveTop >= topLimit;
        const canShowBelow = belowBottom <= bottomLimit;

        // Default is above; only flip to below when above would be hidden
        // under the sticky header, and there's space below.
        actionsEl.classList.toggle("is-below", !canShowAbove && canShowBelow);
    }, []);

    return (
        <div
            ref={verseRef}
            className={`row line ${hasAnyNote ? "has-note" : ""} ${isHighlighted ? "highlighted" : ""
                }`}
            onMouseEnter={updateActionsPlacement}
        >
            <div
                ref={verseNumberCellRef}
                className="col-2 col-lg-1 verse-number-cell"
            >
                <div
                    ref={verseActionsRef}
                    className="verse-actions"
                >
                    <button
                        type="button"
                        className={`verse-action-btn verse-action-note ${hasAnyNote ? "has-note-value" : ""
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
                    onClick={(e) => e.stopPropagation()}
                >
                    {chapterId}:{verseId}
                </a>
            </div>
            <div
                className="col-10 col-lg-11 verse"
                data-verse-id={verseId}
                tabIndex={0}
            >
                <div>{verseContent.replaceAll("//", "\u000A")}</div>
                {hasAnyNote && (
                    <div className="verse-note-preview-wrap">
                        {hasNote && (
                            <div
                                className={`verse-note-preview ${isNoteExpandable && !isNoteExpanded
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
                                className={`verse-note-preview verse-note-preview-translation ${isNoteExpandable && !isNoteExpanded
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
        </div>
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
    isFirstVerse: PropTypes.bool,
    allNotes: PropTypes.object,
    allTranslationNotes: PropTypes.object,
};

export default Verse;
