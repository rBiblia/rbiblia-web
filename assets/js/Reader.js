import React, { memo, useRef, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import Verse from "./Verse";
import SkeletonLoader from "./SkeletonLoader";

const LONG_PRESS_DURATION = 500; // ms

const Reader = memo(function Reader({
    selectedBook,
    selectedChapter,
    selectedTranslation,
    translationName,
    verses,
    showVerses,
    onVerseClick,
    onVerseLongPress,
    onVerseCompare,
    notesVersion = 0,
    highlightedVerse = null,
    allNotes = {},
    allTranslationNotes = {},
}) {
    // Shared state/refs for long press event delegation
    const isPressing = useRef(false);
    const longPressTimer = useRef(null);
    const isLongPress = useRef(false);
    const startPos = useRef({ x: 0, y: 0 });
    const targetVerseEl = useRef(null);

    const clearPress = useCallback(() => {
        isPressing.current = false;
        if (targetVerseEl.current) {
            targetVerseEl.current.classList.remove("pressing");
            targetVerseEl.current = null;
        }
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, []);

    const triggerLongPress = useCallback(() => {
        isLongPress.current = true;
        if (targetVerseEl.current) {
            const verseId = targetVerseEl.current.dataset.verseId;
            targetVerseEl.current.classList.remove("pressing");
            if (verseId) {
                onVerseLongPress?.(verseId);
            }
        }
    }, [onVerseLongPress]);

    const handleTouchStart = useCallback(
        (e) => {
            const verseEl = e.target.closest(".verse");
            if (!verseEl || e.touches.length > 1) return;

            isLongPress.current = false;
            isPressing.current = true;
            targetVerseEl.current = verseEl;
            verseEl.classList.add("pressing");

            startPos.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
            };
            longPressTimer.current = setTimeout(
                triggerLongPress,
                LONG_PRESS_DURATION
            );
        },
        [triggerLongPress]
    );

    const handleTouchEnd = useCallback(
        (e) => {
            clearPress();
        },
        [clearPress]
    );

    const handleTouchMove = useCallback(
        (e) => {
            if (!longPressTimer.current) return;
            const touch = e.touches[0];
            const dx = Math.abs(touch.clientX - startPos.current.x);
            const dy = Math.abs(touch.clientY - startPos.current.y);
            if (dx > 10 || dy > 10) {
                clearPress();
            }
        },
        [clearPress]
    );

    const handleMouseDown = useCallback(
        (e) => {
            if (e.button !== 0) return;
            const verseEl = e.target.closest(".verse");
            if (!verseEl) return;

            isLongPress.current = false;
            isPressing.current = true;
            targetVerseEl.current = verseEl;
            verseEl.classList.add("pressing");

            startPos.current = { x: e.clientX, y: e.clientY };
            longPressTimer.current = setTimeout(
                triggerLongPress,
                LONG_PRESS_DURATION
            );
        },
        [triggerLongPress]
    );

    const handleMouseMove = useCallback(
        (e) => {
            if (!isPressing.current) return;
            const dx = Math.abs(e.clientX - startPos.current.x);
            const dy = Math.abs(e.clientY - startPos.current.y);
            if (dx > 10 || dy > 10) {
                clearPress();
            }
        },
        [clearPress]
    );

    const handleClick = useCallback(
        (e) => {
            const verseEl = e.target.closest(".verse");
            if (!verseEl) return;

            if (isLongPress.current) {
                isLongPress.current = false;
                e.preventDefault();
                e.stopPropagation();
                return;
            }

            const verseId = verseEl.dataset.verseId;
            if (verseId) {
                onVerseClick?.(verseId);
            }
        },
        [onVerseClick]
    );

    const handleContextMenu = useCallback((e) => {
        if (
            e.target.closest(".verse") &&
            (isPressing.current || isLongPress.current)
        ) {
            e.preventDefault();
        }
    }, []);

    const handleKeyDown = useCallback(
        (e) => {
            if (e.key === "Enter" || e.key === " ") {
                const verseEl = e.target.closest(".verse");
                if (verseEl) {
                    if (e.key === " ") e.preventDefault();
                    handleClick(e);
                }
            }
        },
        [handleClick]
    );

    useEffect(() => {
        return clearPress;
    }, [clearPress]);

    if (!showVerses || !verses) {
        return <SkeletonLoader lines={15} />;
    }

    return (
        <main
            className="container" // NOSONAR
            onClick={handleClick}
            onContextMenu={handleContextMenu}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
            onMouseDown={handleMouseDown}
            onMouseUp={clearPress}
            onMouseMove={handleMouseMove}
            onMouseLeave={clearPress}
            onKeyDown={handleKeyDown}
        >
            <div className="row">
                <div className="col-12">
                    {Object.entries(verses).map(
                        ([verseId, verseContent], index) => (
                            <Verse
                                key={verseId}
                                bookId={selectedBook}
                                chapterId={selectedChapter}
                                verseId={verseId}
                                translationId={selectedTranslation}
                                translationName={translationName}
                                verseContent={verseContent}
                                onVerseClick={onVerseClick}
                                onVerseLongPress={onVerseLongPress}
                                onVerseCompare={onVerseCompare}
                                notesVersion={notesVersion}
                                isHighlighted={highlightedVerse === verseId}
                                allNotes={allNotes}
                                allTranslationNotes={allTranslationNotes}
                            />
                        )
                    )}
                </div>
            </div>
        </main>
    );
});

Reader.propTypes = {
    selectedBook: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    selectedChapter: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    selectedTranslation: PropTypes.string,
    translationName: PropTypes.string,
    verses: PropTypes.objectOf(PropTypes.string),
    showVerses: PropTypes.bool,
    onVerseClick: PropTypes.func.isRequired,
    onVerseLongPress: PropTypes.func,
    onVerseCompare: PropTypes.func,
    notesVersion: PropTypes.number,
    highlightedVerse: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    allNotes: PropTypes.object,
    allTranslationNotes: PropTypes.object,
};

export default Reader;
