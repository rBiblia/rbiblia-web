import React, { useRef, useState, useEffect, memo } from "react";
import { useIntl } from "react-intl";
import { loadNotes, getVerseKey } from "./Notes";

const LONG_PRESS_DURATION = 500; // ms
const NOTE_PREVIEW_TOGGLE_THRESHOLD = 80;

const Verse = memo(function Verse({
    verseContent,
    bookId,
    chapterId,
    verseId,
    onClick,
    onLongPress,
    onCompare,
    notesVersion = 0, // Increment to force note indicator refresh
    isHighlighted = false,
}) {
    const { formatMessage } = useIntl();
    const [hasNote, setHasNote] = useState(false);
    const [noteText, setNoteText] = useState("");
    const [isNoteExpanded, setIsNoteExpanded] = useState(false);
    const [isPressing, setIsPressing] = useState(false);
    const longPressTimer = useRef(null);
    const isLongPress = useRef(false);
    const startPos = useRef({ x: 0, y: 0 });
    const verseRef = useRef(null);

    // Scroll into view when highlighted
    useEffect(() => {
        if (isHighlighted && verseRef.current) {
            verseRef.current.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }
    }, [isHighlighted]);

    // Check if this verse has a note
    useEffect(() => {
        const notes = loadNotes();
        const key = getVerseKey(bookId, chapterId, verseId);
        const currentNote = (notes[key] || "").trim();
        setHasNote(!!currentNote);
        setNoteText(currentNote);
        setIsNoteExpanded(false);
    }, [bookId, chapterId, verseId, notesVersion]);

    const isNoteExpandable =
        noteText.length > NOTE_PREVIEW_TOGGLE_THRESHOLD ||
        noteText.includes("\n");

    const appLink = `bib://${bookId}${chapterId}:${verseId}`;

    const openNoteEditor = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onLongPress?.(verseId);
    };

    const openComparison = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onCompare?.(verseId);
    };

    // Trigger long press action
    const triggerLongPress = () => {
        isLongPress.current = true;
        setIsPressing(false);
        onLongPress?.(verseId);
    };

    // Touch events for mobile
    const handleTouchStart = (e) => {
        isLongPress.current = false;
        setIsPressing(true);
        startPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        longPressTimer.current = setTimeout(
            triggerLongPress,
            LONG_PRESS_DURATION
        );
    };

    const handleTouchEnd = (e) => {
        setIsPressing(false);
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        // Prevent click if it was a long press
        if (isLongPress.current) {
            e.preventDefault();
        }
    };

    const handleTouchMove = (e) => {
        // Cancel long press if user moves finger more than 10px
        const touch = e.touches[0];
        const dx = Math.abs(touch.clientX - startPos.current.x);
        const dy = Math.abs(touch.clientY - startPos.current.y);
        if (dx > 10 || dy > 10) {
            setIsPressing(false);
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
                longPressTimer.current = null;
            }
        }
    };

    // Mouse events for desktop
    const handleMouseDown = (e) => {
        // Only respond to left click
        if (e.button !== 0) return;

        isLongPress.current = false;
        setIsPressing(true);
        startPos.current = { x: e.clientX, y: e.clientY };

        longPressTimer.current = setTimeout(
            triggerLongPress,
            LONG_PRESS_DURATION
        );
    };

    const handleMouseUp = () => {
        setIsPressing(false);
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    const handleMouseLeave = () => {
        setIsPressing(false);
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    const handleMouseMove = (e) => {
        // Cancel long press if mouse moves more than 10px
        if (!isPressing) return;
        const dx = Math.abs(e.clientX - startPos.current.x);
        const dy = Math.abs(e.clientY - startPos.current.y);
        if (dx > 10 || dy > 10) {
            setIsPressing(false);
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
                longPressTimer.current = null;
            }
        }
    };

    const handleClick = (e) => {
        // Prevent click action if it was a long press
        if (isLongPress.current) {
            isLongPress.current = false;
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        onClick?.(e);
    };

    // Prevent context menu on long press
    const handleContextMenu = (e) => {
        if (isPressing || isLongPress.current) {
            e.preventDefault();
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
            }
        };
    }, []);

    return (
        <div
            ref={verseRef}
            className={`row line ${isPressing ? "pressing" : ""} ${hasNote ? "has-note" : ""
                } ${isHighlighted ? "highlighted" : ""}`}
        >
            <div className="col-2 col-lg-1 verse-number-cell">
                <div className="verse-actions">
                    <button
                        type="button"
                        className={`verse-action-btn verse-action-note ${hasNote ? "has-note-value" : ""}`}
                        title={formatMessage({ id: hasNote ? "edit" : "addNote" })}
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
                onClick={handleClick}
                onContextMenu={handleContextMenu}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchMove}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{ userSelect: "none" }}
            >
                <div>{verseContent.replaceAll("//", "\u000A")}</div>
                {hasNote && (
                    <div className="verse-note-preview-wrap">
                        <div
                            className={`verse-note-preview ${isNoteExpandable && !isNoteExpanded
                                ? "is-collapsed"
                                : ""
                                }`}
                        >
                            {noteText}
                        </div>
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

export default Verse;
