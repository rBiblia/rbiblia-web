/* global globalThis */
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { getSigla } from "./bookSigla";
import Navigator from "./Navigator";
import Reader from "./Reader";
import { injectIntl } from "react-intl";
import getDataFromCurrentPathname from "./getDataFromCurrentPathname";
import PropTypes from "prop-types";
import { AppError, ErrorToast } from "./AppError";
import updateHistory from "./updateHistory";
import getAppropriateBook from "./getAppropriateBook";
import SelectionGrid from "./SelectionGrid";
import ComparisonGrid from "./ComparisonGrid";
import BottomNavigation from "./BottomNavigation";
import useSwipeNavigation from "./useSwipeNavigation";
import { SideMenu, SideMenuTab, DisplaySettings } from "./SideMenu";
import {
    NotesPanel,
    NoteEditor,
    loadNotes,
    loadTranslationNotes,
} from "./Notes";
import SearchPanel from "./SearchPanel";
import ChapterComparison from "./ChapterComparison";
import ChangelogModal from "./ChangelogModal";
import WelcomePopup, { isWelcomePopupDisabled } from "./WelcomePopup";
import useVersesCache from "./useVersesCache";
import useScrollDirection from "./useScrollDirection";
import { useKeyboardNavigation } from "./hooks";
import { safeJsonParse } from "./safeJsonParse";

const Bible = ({ intl, setLocale }) => {
    const [error, setError] = useState(null);
    const [toastError, setToastError] = useState(null); // Non-blocking error notifications
    const [isBooksLoading, setIsBooksLoading] = useState(true);
    const [isTranslationsLoading, setIsTranslationsLoading] = useState(true);
    const [isStructureLoading, setIsStructureLoading] = useState(true);
    const [showVerses, setShowVerses] = useState(false);
    const [isSelectionOpen, setIsSelectionOpen] = useState(false);
    const [comparedVerse, setComparedVerse] = useState(null);

    // Verses cache for faster loading
    const versesCache = useVersesCache(intl.locale);

    // Side menu states
    const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
    const [isNotesOpen, setIsNotesOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isChangelogOpen, setIsChangelogOpen] = useState(false);
    const [isWelcomePopupOpen, setIsWelcomePopupOpen] = useState(false);
    const [isChapterCompOpen, setIsChapterCompOpen] = useState(false);

    // Note editor state
    const [editingNoteVerse, setEditingNoteVerse] = useState(null);
    const [notesVersion, setNotesVersion] = useState(0); // Increment to refresh note indicators

    // Font size (saved to localStorage)
    const [fontSize, setFontSize] = useState(() => {
        return localStorage.getItem("rbiblia-font-size") || "medium";
    });

    // Zen Mode — lock navigation visible (disable hide-on-scroll)
    const [zenMode, setZenMode] = useState(() => {
        return localStorage.getItem("rbiblia-zen-mode") === "1";
    });

    // Immersive Mode (hide nav on scroll) — disabled when zenMode is on
    const isNavVisible = useScrollDirection({ disabled: zenMode });

    // Font family (saved to localStorage)
    const [fontFamily, setFontFamily] = useState(() => {
        return localStorage.getItem("rbiblia-font-family") || "serif";
    });

    // Save font size to localStorage and apply to CSS variable
    useEffect(() => {
        localStorage.setItem("rbiblia-font-size", fontSize);
        const sizeMap = {
            small: "0.9rem",
            medium: "1.15rem",
            large: "1.4rem",
            xlarge: "1.7rem",
        };
        const numberSizeMap = {
            small: "0.9rem",
            medium: "1.15rem",
            large: "1.4rem",
            xlarge: "1.7rem",
        };
        document.documentElement.style.setProperty(
            "--verse-font-size",
            sizeMap[fontSize]
        );
        document.documentElement.style.setProperty(
            "--verse-number-font-size",
            numberSizeMap[fontSize]
        );
    }, [fontSize]);

    // Theme State (saved to localStorage)
    // Values: 'system', 'light', 'dark'
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem("rbiblia-theme") || "system";
    });

    // Dark mode variant: 'gold' (warm neutral) or 'blue' (slate-blue)
    const [darkVariant, setDarkVariant] = useState(() => {
        return localStorage.getItem("rbiblia-dark-variant") || "gold";
    });

    // Apply Theme Side Effect
    useEffect(() => {
        localStorage.setItem("rbiblia-theme", theme);

        const root = document.documentElement;
        if (theme === "system") {
            delete root.dataset.theme;
        } else {
            root.dataset.theme = theme;
        }
    }, [theme]);

    // Apply Dark Variant Side Effect
    useEffect(() => {
        localStorage.setItem("rbiblia-dark-variant", darkVariant);
        document.documentElement.dataset.darkVariant = darkVariant;
    }, [darkVariant]);

    // Save font family to localStorage and apply to CSS variable
    useEffect(() => {
        localStorage.setItem("rbiblia-font-family", fontFamily);
        const familyMap = {
            serif: 'Georgia, "Times New Roman", serif',
            sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            mono: '"Fira Code", "Cascadia Code", Consolas, monospace',
        };
        document.documentElement.style.setProperty(
            "--verse-font-family",
            familyMap[fontFamily]
        );
        document.documentElement.style.setProperty(
            "--verse-number-font-family",
            familyMap[fontFamily]
        );
    }, [fontFamily]);

    // Note: It contains all books available - not only translation specific
    const [books, setBooks] = useState({});
    const [translations, setTranslations] = useState([]);
    const [structure, setStructure] = useState(null);
    const [verses, setVerses] = useState({});
    const [selectedTranslation, setSelectedTranslation] = useState(
        getDataFromCurrentPathname().translation
    );
    const [selectedBook, setSelectedBook] = useState(
        getDataFromCurrentPathname().book
    );
    const [selectedChapter, setSelectedChapter] = useState(
        getDataFromCurrentPathname().chapter
    );
    const [highlightedVerse, setHighlightedVerse] = useState(null);

    const changeSelectedChapterRef = useRef();

    useEffect(() => {
        changeSelectedChapterRef.current = changeSelectedChapter;
    });

    useEffect(() => {
        const handlePopState = () => {
            const data = getDataFromCurrentPathname();
            setSelectedTranslation(data.translation);
            setSelectedBook(data.book);
            // Use changeSelectedChapter (not raw setter) so verses are actually fetched
            if (changeSelectedChapterRef.current) {
                changeSelectedChapterRef.current(data.chapter, data.book);
            }
        };

        globalThis.addEventListener("popstate", handlePopState);
        return () => globalThis.removeEventListener("popstate", handlePopState);
    }, []);

    useEffect(() => {
        if (!isWelcomePopupDisabled()) {
            setIsWelcomePopupOpen(true);
        }
    }, []);

    const keepChapterIfPossible = useRef(false);
    const startFromLastVerse = useRef(false);

    const chapters =
        structure && selectedBook && structure[selectedBook]
            ? structure[selectedBook]
            : [];

    const changeSelectedTranslation = useCallback(
        (newTranslation) => {
            setShowVerses(false);
            setIsStructureLoading(true);
            keepChapterIfPossible.current = true;
            versesCache.clearCache(); // Clear cache when translation changes
            setSelectedTranslation(newTranslation);
        },
        [versesCache]
    );

    const setLocaleAndUpdateHistory = (locale) => {
        const { chapter, book, translation } = getDataFromCurrentPathname();

        setLocale(locale);
        updateHistory(locale, translation, book, chapter);
    };

    const changeSelectedBook = (newSelectedBook) => {
        keepChapterIfPossible.current = newSelectedBook === selectedBook;
        setSelectedBook(newSelectedBook);
    };

    useEffect(() => {
        if (!structure || chapters.length === 0) {
            return;
        }
        changeSelectedChapter(
            getAppropriateChapter(
                keepChapterIfPossible.current,
                startFromLastVerse.current
            )
        );
        keepChapterIfPossible.current = false;
        startFromLastVerse.current = false;
    }, [selectedBook, structure]);

    const getAppropriateChapter = (
        keepChapterIfPossible,
        startFromLastVerse
    ) => {
        if (
            keepChapterIfPossible &&
            structure[selectedBook].some(
                (chapter) => chapter == selectedChapter
            )
        ) {
            return selectedChapter;
        }

        if (startFromLastVerse) {
            return structure[selectedBook][structure[selectedBook].length - 1];
        }

        return structure[selectedBook][0];
    };

    const changeSelectedChapter = async (newSelectedChapter, bookOverride) => {
        const { locale } = intl;
        const effectiveBook = bookOverride || selectedBook;

        updateHistory(
            locale,
            selectedTranslation,
            effectiveBook,
            newSelectedChapter
        );

        // Check if data is in cache - if yes, show immediately
        const isInCache = versesCache.isInCache(
            selectedTranslation,
            effectiveBook,
            newSelectedChapter
        );

        if (!isInCache) {
            setShowVerses(false);
        }

        try {
            const result = await versesCache.getVerses(
                selectedTranslation,
                effectiveBook,
                newSelectedChapter
            );

            setSelectedChapter(newSelectedChapter);
            setVerses(result.data);
            setShowVerses(true);

            // Prefetch next and previous chapters in the background
            versesCache.prefetchAdjacent(
                selectedTranslation,
                effectiveBook,
                newSelectedChapter,
                structure
            );
        } catch (error) {
            // Use toast for chapter loading errors (non-blocking)
            setToastError(
                error.message || intl.formatMessage({ id: "chapterLoadError" })
            );
            setShowVerses(true); // Keep showing previous content
        }
    };

    /**
     * Navigate to a specific book and chapter atomically.
     * This avoids the race condition where changeSelectedBook triggers
     * a useEffect that recalculates the chapter independently.
     */
    const navigateToBookAndChapter = useCallback(
        (book, chapter) => {
            // Set keepChapterIfPossible so the useEffect on [selectedBook, structure]
            // keeps the chapter we're explicitly navigating to.
            // We also set selectedChapter synchronously so that getAppropriateChapter
            // sees the correct chapter value when useEffect fires.
            keepChapterIfPossible.current = true;
            setSelectedChapter(chapter);
            setSelectedBook(book);
            changeSelectedChapter(chapter, book);
        },
        [changeSelectedChapter]
    );

    const loadTranslationsAndBooks = () => {
        const { locale } = intl;

        setIsTranslationsLoading(true);
        setIsBooksLoading(true);

        Promise.all([
            fetch(`/api/${locale}/translation`)
                .then((res) => safeJsonParse(res))
                .then(
                    (result) => {
                        setTranslations(result.data);
                    },
                    (error) => {
                        setError(error);
                    }
                )
                .finally(() => {
                    setIsTranslationsLoading(false);
                }),
            fetch(`/api/${locale}/book`)
                .then((res) => safeJsonParse(res))
                .then(
                    (result) => {
                        setBooks(result.data);
                    },
                    (error) => {
                        setError(error);
                    }
                )
                .finally(() => {
                    setIsBooksLoading(false);
                }),
        ]);
    };

    useEffect(() => {
        if (!isBooksLoading && !isTranslationsLoading) {
            changeSelectedTranslation(selectedTranslation);
        }
    }, [isBooksLoading, isTranslationsLoading]);

    useEffect(() => {
        loadTranslationsAndBooks();
    }, [intl.locale]); // Added dependencies based on variables used inside useEffect.
    // Other useEffect hooks as needed for componentDidUpdate logic

    // Memoize indices and availability checks to avoid recalculating on every render
    const chapterIndex = useMemo(
        () => chapters.indexOf(Number.parseInt(selectedChapter, 10)),
        [chapters, selectedChapter]
    );

    const isNextChapterAvailable = () =>
        !isStructureLoading && chapters[chapterIndex + 1] !== undefined;

    const isPrevChapterAvailable = () => {
        return !isStructureLoading && chapterIndex !== 0;
    };

    const bookKeys = useMemo(
        () => (structure ? Object.keys(structure) : []),
        [structure]
    );
    const bookIndex = useMemo(
        () => bookKeys.indexOf(selectedBook),
        [bookKeys, selectedBook]
    );

    const isNextBookAvailable = () => {
        return (
            !isStructureLoading &&
            structure[bookKeys[bookIndex + 1]] !== undefined
        );
    };

    const isPrevBookAvailable = () => {
        return !isStructureLoading && bookIndex !== 0;
    };

    const nextChapter = () => {
        if (isNextChapterAvailable()) {
            changeSelectedChapter(chapters[chapterIndex + 1]);
            return;
        }
        nextBook();
    };

    const prevChapter = () => {
        if (isPrevChapterAvailable()) {
            changeSelectedChapter(chapters[chapterIndex - 1]);
            return;
        }

        prevBook(true);
    };

    const nextBook = () => {
        if (isNextBookAvailable()) {
            changeSelectedBook(bookKeys[bookIndex + 1]);
        }
    };

    const prevBook = (_startFromLastVerse = false) => {
        if (!isPrevBookAvailable()) {
            return;
        }
        startFromLastVerse.current = _startFromLastVerse;

        setSelectedBook(bookKeys[bookIndex - 1]);
    };

    // Start critical fetches immediately on mount/change, independent of lists
    useEffect(() => {
        const fetchStructure = async () => {
            try {
                const response = await fetch(
                    `/api/${intl.locale}/translation/${selectedTranslation}`
                );
                if (!response.ok)
                    throw new Error("Network response was not ok.");
                const result = await safeJsonParse(response);
                setStructure(result.data);
                setSelectedBook((_selectedBook) =>
                    getAppropriateBook(result.data, _selectedBook)
                );
            } catch (error) {
                setError(error);
            } finally {
                setIsStructureLoading(false);
            }
        };
        // Fetch structure immediately when translation changes or locale changes
        fetchStructure();
    }, [selectedTranslation, intl.locale]);

    // Swipe navigation - disabled when overlays are open
    const overlaysOpen =
        isSelectionOpen ||
        !!comparedVerse ||
        isSideMenuOpen ||
        isNotesOpen ||
        isSearchOpen ||
        isChangelogOpen ||
        isWelcomePopupOpen ||
        !!editingNoteVerse;
    useSwipeNavigation(
        nextChapter, // Swipe left -> next chapter
        prevChapter, // Swipe right -> previous chapter
        {
            threshold: 80,
            enabled: !overlaysOpen && showVerses,
        }
    );

    // Keyboard navigation (Arrow Left/Right) - disabled when overlays are open
    useKeyboardNavigation(
        prevChapter, // ArrowLeft  → previous chapter
        nextChapter, // ArrowRight → next chapter
        { enabled: !overlaysOpen && showVerses }
    );

    // Load notes ONCE (not per-verse) — passed down to Reader → Verse
    const allNotes = useMemo(() => loadNotes(), [notesVersion]);
    const allTranslationNotes = useMemo(
        () => loadTranslationNotes(),
        [notesVersion]
    );

    // Stable callbacks for overlay openers (prevents BottomNavigation memo breakage)
    const handleOpenSelection = useCallback(
        () => setIsSelectionOpen(true),
        []
    );
    const handleOpenNotes = useCallback(() => setIsNotesOpen(true), []);
    const handleOpenChapterComp = useCallback(
        () => setIsChapterCompOpen(true),
        []
    );
    const handleOpenSearch = useCallback(() => setIsSearchOpen(true), []);
    const handleOpenSettings = useCallback(
        () => setIsSideMenuOpen(true),
        []
    );

    const handleOpenChangelog = useCallback(() => setIsChangelogOpen(true), []);

    const handleCloseSelection = useCallback(() => setIsSelectionOpen(false), []);
    const handleCloseNotes = useCallback(() => setIsNotesOpen(false), []);
    const handleCloseChapterComp = useCallback(() => setIsChapterCompOpen(false), []);
    const handleCloseSearch = useCallback(() => setIsSearchOpen(false), []);
    const handleCloseSideMenu = useCallback(() => setIsSideMenuOpen(false), []);
    const handleCloseChangelog = useCallback(() => setIsChangelogOpen(false), []);
    const handleCloseWelcomePopup = useCallback(() => setIsWelcomePopupOpen(false), []);
    const handleCloseComparison = useCallback(() => setComparedVerse(null), []);
    const handleCloseNoteEditor = useCallback(() => setEditingNoteVerse(null), []);
    const handleCloseErrorToast = useCallback(() => setToastError(null), []);

    const handleSaveNote = useCallback(() => setNotesVersion((v) => v + 1), []);

    const handleNavigateChapter = useCallback((book, chapter) => {
        navigateToBookAndChapter(book, chapter);
    }, [navigateToBookAndChapter]);

    const handleNavigateVerseComparison = useCallback((direction) => {
        setComparedVerse((prev) => {
            const currentVerse = Number.parseInt(prev, 10);
            const maxVerse = Object.keys(verses).length;
            if (direction === "prev" && currentVerse > 1) {
                return String(currentVerse - 1);
            } else if (direction === "next" && currentVerse < maxVerse) {
                return String(currentVerse + 1);
            }
            return prev;
        });
    }, [verses]);

    const handleSetZenMode = useCallback((value) => {
        setZenMode(value);
        try {
            localStorage.setItem("rbiblia-zen-mode", value ? "1" : "0");
        } catch {
            // ignore
        }
    }, []);

    // Memoize translationName to avoid inline computation in render
    const translationName = useMemo(
        () =>
            translations?.find?.((t) => t.id === selectedTranslation)?.name ||
            selectedTranslation,
        [translations, selectedTranslation]
    );

    // Memoize navigation availability for BottomNavigation
    const isPrevAvailable = isPrevChapterAvailable() || isPrevBookAvailable();
    const isNextAvailable = isNextChapterAvailable() || isNextBookAvailable();
    const currentBookSigla = useMemo(
        () => getSigla(selectedBook, intl.locale),
        [selectedBook, intl.locale]
    );

    // Stable callbacks for Reader → Verse (prevents memo breakage)
    const handleVerseClick = useCallback(
        (verseId) => setComparedVerse(verseId),
        []
    );
    const handleVerseLongPress = useCallback(
        (verseId) => setEditingNoteVerse(verseId),
        []
    );
    const handleVerseCompare = useCallback(
        (verseId) => setComparedVerse(verseId),
        []
    );

    const handleNavigateToVerse = useCallback(
        (book, chapter, verse) => {
            navigateToBookAndChapter(book, chapter);

            if (verse) {
                const verseId = String(verse);
                setHighlightedVerse(verseId);
                setTimeout(() => {
                    setHighlightedVerse(null);
                }, 3000);
            }
        },
        [navigateToBookAndChapter]
    );

    // Render content
    if (error) {
        return (
            <AppError
                message={
                    error.message ||
                    intl.formatMessage({ id: "unexpectedErrorOccurred" })
                }
                onRetry={() => {
                    setError(null);
                    loadTranslationsAndBooks();
                }}
            />
        );
    }
    // Note: removed full-App loading block to allow render while lists load
    // if (isTranslationsLoading || isBooksLoading) { ... }

    return (
        <>
            <Navigator
                books={books}
                translations={translations}
                selectedTranslation={selectedTranslation}
                selectedChapter={selectedChapter}
                selectedBook={selectedBook}
                structure={structure}
                chapters={chapters}
                isStructureLoading={isStructureLoading}
                listsLoading={isTranslationsLoading || isBooksLoading}
                changeSelectedTranslation={changeSelectedTranslation}
                changeSelectedBook={changeSelectedBook}
                changeSelectedChapter={changeSelectedChapter}
                prevChapter={prevChapter}
                nextChapter={nextChapter}
                prevBook={prevBook}
                nextBook={nextBook}
                isPrevBookAvailable={isPrevBookAvailable}
                isNextBookAvailable={isNextBookAvailable}
                isPrevChapterAvailable={isPrevChapterAvailable}
                isNextChapterAvailable={isNextChapterAvailable}
                onOpenSelection={handleOpenSelection}
                onOpenNotes={handleOpenNotes}
                onOpenSearch={handleOpenSearch}
                onOpenSettings={handleOpenSettings}
                onOpenChapterComparison={handleOpenChapterComp}
                className={isNavVisible ? "" : "nav-hidden-header"}
            />
            {isSelectionOpen && (
                <SelectionGrid
                    books={books}
                    structure={structure}
                    currentBook={selectedBook}
                    currentChapter={selectedChapter}
                    onSelectChapter={handleNavigateChapter}
                    onClose={handleCloseSelection}
                />
            )}
            {comparedVerse && (
                <ComparisonGrid
                    verseId={comparedVerse}
                    bookId={selectedBook}
                    bookName={books[selectedBook]?.name}
                    bookSigil={getSigla(selectedBook, intl.locale)}
                    chapterId={selectedChapter}
                    translations={translations}
                    currentTranslation={selectedTranslation}
                    totalVerses={Object.keys(verses).length}
                    onNavigateVerse={handleNavigateVerseComparison}
                    onClose={handleCloseComparison}
                />
            )}
            <Reader
                showVerses={showVerses}
                selectedBook={selectedBook}
                selectedChapter={selectedChapter}
                selectedTranslation={selectedTranslation}
                translationName={translationName}
                verses={verses}
                onVerseClick={handleVerseClick}
                onVerseLongPress={handleVerseLongPress}
                onVerseCompare={handleVerseCompare}
                notesVersion={notesVersion}
                highlightedVerse={highlightedVerse}
                allNotes={allNotes}
                allTranslationNotes={allTranslationNotes}
            />
            <BottomNavigation
                onPrevChapter={prevChapter}
                onNextChapter={nextChapter}
                onOpenSelection={handleOpenSelection}
                onOpenNotes={handleOpenNotes}
                onOpenChapterComparison={handleOpenChapterComp}
                isPrevAvailable={isPrevAvailable}
                isNextAvailable={isNextAvailable}
                currentBook={currentBookSigla}
                currentChapter={selectedChapter}
                className={isNavVisible ? "" : "nav-hidden-bottom"}
            />
            {/* Notes Panel */}
            <NotesPanel
                isOpen={isNotesOpen}
                onClose={handleCloseNotes}
                selectedBook={selectedBook}
                selectedChapter={selectedChapter}
                selectedTranslation={selectedTranslation}
                translations={translations}
                books={books}
                onNavigateToVerse={handleNavigateToVerse}
            />

            {/* Search Panel */}
            <SearchPanel
                isOpen={isSearchOpen}
                onClose={handleCloseSearch}
                selectedTranslation={selectedTranslation}
                books={books}
                onNavigateToVerse={handleNavigateToVerse}
            />

            {/* Chapter Comparison */}
            <ChapterComparison
                isOpen={isChapterCompOpen}
                onClose={handleCloseChapterComp}
                bookId={selectedBook}
                bookName={books[selectedBook]?.name}
                chapterId={selectedChapter}
                translations={translations}
                currentTranslation={selectedTranslation}
                structure={structure}
                books={books}
                onNavigateChapter={handleNavigateChapter}
            />

            {/* Side tab and menu */}
            <SideMenuTab
                onClick={handleOpenSettings}
                className={isNavVisible ? "" : "nav-hidden-fab"}
            />
            <SideMenu
                isOpen={isSideMenuOpen}
                onClose={handleCloseSideMenu}
            >
                <DisplaySettings
                    fontSize={fontSize}
                    setFontSize={setFontSize}
                    fontFamily={fontFamily}
                    setFontFamily={setFontFamily}
                    translations={translations}
                    setLocaleAndUpdateHistory={setLocaleAndUpdateHistory}
                    theme={theme}
                    setTheme={setTheme}
                    darkVariant={darkVariant}
                    setDarkVariant={setDarkVariant}
                    zenMode={zenMode}
                    setZenMode={handleSetZenMode}
                    onClose={handleCloseSideMenu}
                    onOpenChangelog={handleOpenChangelog}
                />
            </SideMenu>

            {/* Note Editor */}
            <NoteEditor
                isOpen={editingNoteVerse !== null}
                onClose={handleCloseNoteEditor}
                onSave={handleSaveNote}
                book={selectedBook}
                chapter={selectedChapter}
                verse={editingNoteVerse}
                bookName={books[selectedBook]?.name}
                translationId={selectedTranslation}
                translationName={
                    translations?.find?.((t) => t.id === selectedTranslation)
                        ?.name || selectedTranslation
                }
            />
            <ChangelogModal
                isOpen={isChangelogOpen}
                onClose={handleCloseChangelog}
            />
            <WelcomePopup
                isOpen={isWelcomePopupOpen}
                onClose={handleCloseWelcomePopup}
            />

            {/* Toast for non-blocking errors */}
            {toastError && (
                <ErrorToast
                    message={toastError}
                    onClose={handleCloseErrorToast}
                />
            )}
        </>
    );
};

Bible.propTypes = {
    intl: PropTypes.shape({
        locale: PropTypes.string.isRequired,
        formatMessage: PropTypes.func.isRequired,
    }).isRequired,
    setLocale: PropTypes.func.isRequired,
};

export default injectIntl(Bible);
