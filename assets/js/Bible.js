import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    Suspense,
} from "react";
import Navigator from "./Navigator";
import Reader from "./Reader";
import { injectIntl } from "react-intl";
import getDataFromCurrentPathname from "./getDataFromCurrentPathname";
import PropTypes from "prop-types";
import { AppError, ErrorToast } from "./AppError";
import updateHistory from "./updateHistory";
import getAppropriateBook from "./getAppropriateBook";
import BottomNavigation from "./BottomNavigation";
import useSwipeNavigation from "./useSwipeNavigation";
import { SideMenu, SideMenuTab, DisplaySettings } from "./SideMenu";
import {
    NotesPanel,
    NoteEditor,
    loadNotes,
    loadTranslationNotes,
} from "./Notes";
import WelcomePopup, { isWelcomePopupDisabled } from "./WelcomePopup";
import useVersesCache from "./useVersesCache";
import { useKeyboardNavigation } from "./hooks";
import { safeJsonParse } from "./safeJsonParse";
import {
    safeLocalStorageGetItem,
    safeLocalStorageSetItem,
} from "./safeStorage";

// Lazy-loaded heavy components (Code Splitting)
const SelectionGrid = React.lazy(() => import("./SelectionGrid"));
const ComparisonGrid = React.lazy(() => import("./ComparisonGrid"));
const SearchPanel = React.lazy(() => import("./SearchPanel"));
const ChapterComparison = React.lazy(() => import("./ChapterComparison"));
const ChangelogModal = React.lazy(() => import("./ChangelogModal"));
const AboutModal = React.lazy(() => import("./AboutModal"));

const FullscreenOverlayFallback = () => (
    <div className="selection-overlay" aria-hidden="true" />
);

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
    const [isAboutOpen, setIsAboutOpen] = useState(false);
    const [isWelcomePopupOpen, setIsWelcomePopupOpen] = useState(false);
    const [isChapterCompOpen, setIsChapterCompOpen] = useState(false);

    // Note editor state
    const [editingNoteVerse, setEditingNoteVerse] = useState(null);
    const [notesVersion, setNotesVersion] = useState(0); // Increment to refresh note indicators

    // Font size (saved to localStorage)
    const [fontSize, setFontSize] = useState(() => {
        return safeLocalStorageGetItem("rbiblia-font-size") || "medium";
    });

    // Zen Mode — hides navigation on scroll (immersive reading)
    // zenMode=true  → immersiveDisabled=false → nav hides while scrolling down
    // zenMode=false → immersiveDisabled=true  → nav always visible
    const [zenMode, setZenMode] = useState(() => {
        return safeLocalStorageGetItem("rbiblia-zen-mode") === "1";
    });

    const immersiveDisabled = !zenMode || isWelcomePopupOpen;

    // Font family (saved to localStorage)
    const [fontFamily, setFontFamily] = useState(() => {
        return safeLocalStorageGetItem("rbiblia-font-family") || "serif";
    });

    // Save font size to localStorage and apply to CSS variable
    useEffect(() => {
        safeLocalStorageSetItem("rbiblia-font-size", fontSize);
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
        return safeLocalStorageGetItem("rbiblia-theme") || "system";
    });

    // Dark mode variant: 'gold' (warm neutral) or 'blue' (slate-blue)
    const [darkVariant, setDarkVariant] = useState(() => {
        return safeLocalStorageGetItem("rbiblia-dark-variant") || "gold";
    });

    // Apply Theme Side Effect
    useEffect(() => {
        safeLocalStorageSetItem("rbiblia-theme", theme);

        const root = document.documentElement;
        if (theme === "system") {
            delete root.dataset.theme;
        } else {
            root.dataset.theme = theme;
        }
    }, [theme]);

    // Apply Dark Variant Side Effect
    useEffect(() => {
        safeLocalStorageSetItem("rbiblia-dark-variant", darkVariant);
        document.documentElement.dataset.darkVariant = darkVariant;
    }, [darkVariant]);

    // Save font family to localStorage and apply to CSS variable
    useEffect(() => {
        safeLocalStorageSetItem("rbiblia-font-family", fontFamily);
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

    const keepChapterIfPossible = useRef(true);
    const startFromLastVerse = useRef(false);
    const skipNextBookEffect = useRef(false);
    // Initialize pending highlight with verse ID from URL hash if present
    const pendingHighlightRef = useRef(
        typeof globalThis !== "undefined" && globalThis.location?.hash
            ? globalThis.location.hash.replace("#", "")
            : null
    ); // verseId to highlight after chapter loads

    // Ref to track current translation — used by changeSelectedTranslation
    // guard without adding selectedTranslation to the callback's deps.
    const selectedTranslationRef = useRef(selectedTranslation);
    selectedTranslationRef.current = selectedTranslation;

    const chapters =
        structure && selectedBook && structure[selectedBook]
            ? structure[selectedBook]
            : [];

    const changeSelectedTranslation = useCallback(
        (newTranslation) => {
            // Skip if translation hasn't actually changed — prevents resetting
            // isStructureLoading when the structure fetch is already in progress
            // or completed (avoids race condition on initial load / locale change).
            if (newTranslation === selectedTranslationRef.current) {
                return;
            }
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
        updateHistory(
            locale,
            translation,
            book,
            chapter,
            pendingHighlightRef.current
        );
    };

    const changeSelectedBook = (newSelectedBook) => {
        keepChapterIfPossible.current = newSelectedBook === selectedBook;
        setSelectedBook(newSelectedBook);
    };

    useEffect(() => {
        if (!structure || chapters.length === 0) {
            return;
        }
        if (skipNextBookEffect.current) {
            skipNextBookEffect.current = false;
            keepChapterIfPossible.current = false;
            startFromLastVerse.current = false;
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

    const applyPendingHighlight = (verseId) => {
        const clearHighlight = () => setHighlightedVerse(null);

        const setHighlight = () => {
            setHighlightedVerse(verseId);
            setTimeout(clearHighlight, 8000);
        };

        const scheduleHighlight = () => requestAnimationFrame(setHighlight);

        // Use double rAF to ensure React has committed the DOM update
        requestAnimationFrame(scheduleHighlight);
    };

    const changeSelectedChapter = async (newSelectedChapter, bookOverride) => {
        const { locale } = intl;
        const effectiveBook = bookOverride || selectedBook;

        updateHistory(
            locale,
            selectedTranslation,
            effectiveBook,
            newSelectedChapter,
            pendingHighlightRef.current
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

            // If a specific verse is pending highlight, skip scroll-to-top
            // and apply the highlight after the DOM has rendered.
            if (pendingHighlightRef.current) {
                const verseId = pendingHighlightRef.current;
                pendingHighlightRef.current = null;
                applyPendingHighlight(verseId);
            } else {
                // Always scroll to top when a new chapter loads.
                // 'instant' prevents a visible scroll animation fighting the
                // content swap (especially when data comes from cache and the
                // chapter appears without a loading state).
                globalThis.scrollTo({ top: 0, behavior: "instant" });
            }

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

            if (book !== selectedBook) {
                skipNextBookEffect.current = true;
                setSelectedBook(book);
            }

            changeSelectedChapter(chapter, book);
        },
        [changeSelectedChapter, selectedBook]
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
        isAboutOpen ||
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
    const handleOpenSelection = useCallback(() => setIsSelectionOpen(true), []);
    const handleOpenNotes = useCallback(() => setIsNotesOpen(true), []);
    const handleOpenChapterComp = useCallback(
        () => setIsChapterCompOpen(true),
        []
    );
    const handleOpenSearch = useCallback(() => setIsSearchOpen(true), []);
    const handleOpenSettings = useCallback(() => setIsSideMenuOpen(true), []);

    const handleOpenChangelog = useCallback(() => setIsChangelogOpen(true), []);
    const handleOpenAbout = useCallback(() => setIsAboutOpen(true), []);

    const handleCloseSelection = useCallback(
        () => setIsSelectionOpen(false),
        []
    );
    const handleCloseNotes = useCallback(() => setIsNotesOpen(false), []);
    const handleCloseChapterComp = useCallback(
        () => setIsChapterCompOpen(false),
        []
    );
    const handleCloseSearch = useCallback(() => setIsSearchOpen(false), []);
    const handleCloseSideMenu = useCallback(() => setIsSideMenuOpen(false), []);
    const handleCloseChangelog = useCallback(
        () => setIsChangelogOpen(false),
        []
    );
    const handleCloseAbout = useCallback(() => setIsAboutOpen(false), []);
    const handleCloseWelcomePopup = useCallback(
        () => setIsWelcomePopupOpen(false),
        []
    );
    const handleCloseComparison = useCallback(() => setComparedVerse(null), []);
    const handleCloseNoteEditor = useCallback(
        () => setEditingNoteVerse(null),
        []
    );
    const handleCloseErrorToast = useCallback(() => setToastError(null), []);

    const handleSaveNote = useCallback(() => setNotesVersion((v) => v + 1), []);

    const handleNavigateChapter = useCallback(
        (book, chapter) => {
            navigateToBookAndChapter(book, chapter);
        },
        [navigateToBookAndChapter]
    );

    const handleNavigateVerseComparison = useCallback(
        (direction) => {
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
        },
        [verses]
    );

    const handleSetZenMode = useCallback((value) => {
        setZenMode(value);
        safeLocalStorageSetItem("rbiblia-zen-mode", value ? "1" : "0");
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
        () => books[selectedBook]?.sigla || selectedBook?.toUpperCase() || "",
        [selectedBook, books]
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
        (book, chapter, verse, translationId) => {
            // If a translation-specific note was clicked, switch translation first
            if (
                translationId &&
                translationId !== selectedTranslationRef.current
            ) {
                changeSelectedTranslation(translationId);
            }

            if (verse) {
                // Store the pending verse BEFORE navigation so changeSelectedChapter
                // knows not to scroll to top and can apply the highlight after render.
                pendingHighlightRef.current = String(verse);
            }

            navigateToBookAndChapter(book, chapter);
        },
        [navigateToBookAndChapter, changeSelectedTranslation]
    );

    // Toggle body class when fullscreen overlays are open to hide background content and improve performance
    useEffect(() => {
        if (isSelectionOpen || comparedVerse || isChapterCompOpen) {
            document.body.classList.add("has-fullscreen-overlay");
        } else {
            document.body.classList.remove("has-fullscreen-overlay");
        }
    }, [isSelectionOpen, comparedVerse, isChapterCompOpen]);

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
                isPrevBookAvailable={isPrevBookAvailable()}
                isNextBookAvailable={isNextBookAvailable()}
                isPrevChapterAvailable={isPrevChapterAvailable()}
                isNextChapterAvailable={isNextChapterAvailable()}
                onOpenSelection={handleOpenSelection}
                onOpenNotes={handleOpenNotes}
                onOpenSearch={handleOpenSearch}
                onOpenSettings={handleOpenSettings}
                onOpenChapterComparison={handleOpenChapterComp}
                immersiveDisabled={immersiveDisabled}
            />
            <Suspense fallback={<FullscreenOverlayFallback />}>
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
                        bookSigil={
                            books[selectedBook]?.sigla ||
                            selectedBook?.toUpperCase()
                        }
                        chapterId={selectedChapter}
                        translations={translations}
                        currentTranslation={selectedTranslation}
                        totalVerses={Object.keys(verses).length}
                        onNavigateVerse={handleNavigateVerseComparison}
                        onClose={handleCloseComparison}
                    />
                )}
            </Suspense>
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
                immersiveDisabled={immersiveDisabled}
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
            {/* Lazy Loaded Panels */}
            <Suspense
                fallback={
                    isChapterCompOpen ? <FullscreenOverlayFallback /> : null
                }
            >
                <SearchPanel
                    isOpen={isSearchOpen}
                    onClose={handleCloseSearch}
                    selectedTranslation={selectedTranslation}
                    books={books}
                    onNavigateToVerse={handleNavigateToVerse}
                />
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
            </Suspense>

            {/* Side tab and menu */}
            <SideMenuTab
                onClick={handleOpenSettings}
                immersiveDisabled={immersiveDisabled}
            />
            <SideMenu isOpen={isSideMenuOpen} onClose={handleCloseSideMenu}>
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
                    onOpenAbout={handleOpenAbout}
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
            <Suspense fallback={null}>
                <ChangelogModal
                    isOpen={isChangelogOpen}
                    onClose={handleCloseChangelog}
                />
            </Suspense>
            <Suspense fallback={null}>
                <AboutModal isOpen={isAboutOpen} onClose={handleCloseAbout} />
            </Suspense>
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
