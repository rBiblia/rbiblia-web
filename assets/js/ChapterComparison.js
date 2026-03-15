import React, {
    useState,
    useCallback,
    useEffect,
    useMemo,
    useRef,
} from "react";
import { useIntl } from "react-intl";
import Icon from "./Icon";
import { safeJsonParse } from "./safeJsonParse";
import TranslationSelector from "./TranslationSelector";
import { safeLocalStorageGetItem } from "./safeStorage";

const FAVORITE_TRANSLATIONS_STORAGE_KEY = "rbiblia_favorite_translations";

const getFavoriteTranslations = () => {
    try {
        return JSON.parse(
            safeLocalStorageGetItem(FAVORITE_TRANSLATIONS_STORAGE_KEY) || "[]"
        );
    } catch {
        return [];
    }
};

/**
 * ChapterComparison — Full-screen side-by-side chapter comparison
 *   Desktop: two columns, verse-aligned
 *   Mobile:  interleaved verses (A normal, B italic)
 */
const ChapterComparison = ({
    isOpen,
    onClose,
    bookId,
    bookName,
    chapterId,
    translations,
    currentTranslation,
    structure, // { bookId: [1,2,3,...], ... }
    books,
    onNavigateChapter, // (bookId, chapter) => void
}) => {
    const { formatMessage, locale } = useIntl();
    const containerRef = useRef(null);

    // --- Translation selection ---
    const favorites = useMemo(() => getFavoriteTranslations(), [isOpen]);
    const availableFavorites = useMemo(() => {
        if (!translations) return [];
        return translations
            .filter((t) => favorites.includes(t.id))
            .map((t) => t.id);
    }, [translations, favorites]);
    const favoriteTranslations = useMemo(() => {
        if (!translations) return [];
        return translations.filter((t) => favorites.includes(t.id));
    }, [translations, favorites]);
    const nonFavoriteTranslations = useMemo(() => {
        if (!translations) return [];
        return translations.filter((t) => !favorites.includes(t.id));
    }, [translations, favorites]);

    const [translationA, setTranslationA] = useState("");
    const [translationB, setTranslationB] = useState("");

    // Initialize translations when opening
    useEffect(() => {
        if (!isOpen) return;
        if (availableFavorites.length >= 2) {
            setTranslationA(availableFavorites[0]);
            setTranslationB(availableFavorites[1]);
        } else if (availableFavorites.length === 1) {
            setTranslationA(availableFavorites[0]);
            setTranslationB("");
        } else {
            // Fallback: use current translation for A
            setTranslationA(currentTranslation || "");
            setTranslationB("");
        }
    }, [isOpen, availableFavorites, currentTranslation]);

    // --- Verse data ---
    const [versesA, setVersesA] = useState(null);
    const [versesB, setVersesB] = useState(null);
    const [loadingA, setLoadingA] = useState(false);
    const [loadingB, setLoadingB] = useState(false);
    const [errorA, setErrorA] = useState(null);
    const [errorB, setErrorB] = useState(null);

    const fetchChapter = useCallback(
        async (translationId, setVerses, setLoading, setError) => {
            if (!translationId || !bookId || !chapterId) {
                setVerses(null);
                return;
            }
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(
                    `/api/${locale}/translation/${translationId}/book/${bookId}/chapter/${chapterId}`
                );
                const data = await safeJsonParse(res);
                setVerses(data.data || {});
            } catch (err) {
                console.error("ChapterComparison fetch error:", err);
                setError(formatMessage({ id: "chapterCompError" }));
                setVerses(null);
            } finally {
                setLoading(false);
            }
        },
        [bookId, chapterId, locale, formatMessage]
    );

    // Fetch when translations or chapter change
    useEffect(() => {
        if (!isOpen) return;
        fetchChapter(translationA, setVersesA, setLoadingA, setErrorA);
    }, [isOpen, translationA, bookId, chapterId, fetchChapter]);

    useEffect(() => {
        if (!isOpen) return;
        fetchChapter(translationB, setVersesB, setLoadingB, setErrorB);
    }, [isOpen, translationB, bookId, chapterId, fetchChapter]);

    // --- Verse keys (union of both translations) ---
    const verseKeys = useMemo(() => {
        const keysA = versesA ? Object.keys(versesA).map(Number) : [];
        const keysB = versesB ? Object.keys(versesB).map(Number) : [];
        const allKeys = [...new Set([...keysA, ...keysB])];
        allKeys.sort((a, b) => a - b);
        return allKeys;
    }, [versesA, versesB]);

    // --- Chapter navigation ---
    const chapters = structure?.[bookId] || [];
    const currentChapterIndex = useMemo(() => {
        const chapterNum = Number.parseInt(String(chapterId), 10);
        if (!Number.isFinite(chapterNum)) return -1;
        return chapters
            .map((c) => Number.parseInt(String(c), 10))
            .indexOf(chapterNum);
    }, [chapters, chapterId]);
    const hasPrev = currentChapterIndex > 0;
    const hasNext = currentChapterIndex < chapters.length - 1;

    const goToPrevChapter = useCallback(() => {
        if (hasPrev) {
            onNavigateChapter(bookId, chapters[currentChapterIndex - 1]);
        }
    }, [hasPrev, bookId, chapters, currentChapterIndex, onNavigateChapter]);

    const goToNextChapter = useCallback(() => {
        if (hasNext) {
            onNavigateChapter(bookId, chapters[currentChapterIndex + 1]);
        }
    }, [hasNext, bookId, chapters, currentChapterIndex, onNavigateChapter]);

    // --- Keyboard navigation ---
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                onClose();
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                goToPrevChapter();
            } else if (e.key === "ArrowRight") {
                e.preventDefault();
                goToNextChapter();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose, goToPrevChapter, goToNextChapter]);

    // Scroll to top when chapter changes
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = 0;
        }
    }, [bookId, chapterId]);

    // --- Translation selector ---
    const TranslationSelect = ({ value, onChange, side }) => {
        const otherId = side === "A" ? translationB : translationA;
        return (
            <div
                className="chapter-comp-select-wrapper"
                style={{ flex: 1, minWidth: 0 }}
            >
                <TranslationSelector
                    translations={translations || []}
                    selectedTranslation={value}
                    changeSelectedTranslation={onChange}
                    disabledOptions={[otherId]}
                    placeholder={formatMessage({
                        id: "chapterCompSelectTranslation",
                    })}
                />
            </div>
        );
    };

    // --- Render helpers ---
    const renderVerseText = (text) => {
        if (!text) return <span className="chapter-comp-no-verse">—</span>;
        return text.replaceAll("//", "\n");
    };

    const isLoading = loadingA || loadingB;

    if (!isOpen) return null;

    return (
        <div className="chapter-comp-overlay">
            <div className="chapter-comp-panel">
                {/* Header */}
                <div className="chapter-comp-header">
                    <div className="chapter-comp-title-row">
                        <Icon
                            name="scale"
                            size={20}
                            className="chapter-comp-icon"
                        />
                        <h3 className="chapter-comp-title">
                            {bookName
                                ? `${bookName} ${chapterId}`
                                : formatMessage({ id: "chapterComparison" })}
                        </h3>
                    </div>
                    <button className="chapter-comp-close" onClick={onClose}>
                        <Icon name="x" size={20} />
                    </button>
                </div>

                {/* Translation selectors */}
                <div className="chapter-comp-selectors">
                    <TranslationSelect
                        value={translationA}
                        onChange={setTranslationA}
                        side="A"
                    />
                    <span className="chapter-comp-vs">vs</span>
                    <TranslationSelect
                        value={translationB}
                        onChange={setTranslationB}
                        side="B"
                    />
                </div>

                {/* Chapter navigation */}
                <div className="chapter-comp-nav">
                    <button
                        className="chapter-comp-nav-btn"
                        onClick={goToPrevChapter}
                        disabled={!hasPrev}
                        title={formatMessage({ id: "previousChapter" })}
                    >
                        <Icon name="chevron-left" size={18} />
                        <span>{formatMessage({ id: "previousChapter" })}</span>
                    </button>
                    <span className="chapter-comp-nav-current">
                        {bookName} {chapterId}
                    </span>
                    <button
                        className="chapter-comp-nav-btn"
                        onClick={goToNextChapter}
                        disabled={!hasNext}
                        title={formatMessage({ id: "nextChapter" })}
                    >
                        <span>{formatMessage({ id: "nextChapter" })}</span>
                        <Icon name="chevron-right" size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="chapter-comp-body" ref={containerRef}>
                    {/* Empty state: no translations selected */}
                    {!translationA && !translationB && (
                        <div className="chapter-comp-empty">
                            <Icon name="scale" size={48} />
                            <p>
                                {formatMessage({ id: "chapterCompSelectHint" })}
                            </p>
                        </div>
                    )}

                    {/* Loading */}
                    {isLoading && (
                        <div className="chapter-comp-loading">
                            <div className="search-spinner" />
                            <p>{formatMessage({ id: "loading" })}</p>
                        </div>
                    )}

                    {/* Error */}
                    {(errorA || errorB) && (
                        <div className="chapter-comp-error">
                            {errorA && <p>{errorA}</p>}
                            {errorB && <p>{errorB}</p>}
                        </div>
                    )}

                    {/* Desktop: side-by-side table */}
                    {!isLoading &&
                        (translationA || translationB) &&
                        verseKeys.length > 0 && (
                            <>
                                {/* Desktop view: side-by-side */}
                                <table className="chapter-comp-table d-none d-md-table">
                                    <thead>
                                        <tr>
                                            <th className="chapter-comp-th-num">
                                                #
                                            </th>
                                            <th className="chapter-comp-th-text">
                                                {translationA
                                                    ? translations.find(
                                                          (t) =>
                                                              t.id ===
                                                              translationA
                                                      )?.name || translationA
                                                    : "—"}
                                            </th>
                                            <th className="chapter-comp-th-text">
                                                {translationB
                                                    ? translations.find(
                                                          (t) =>
                                                              t.id ===
                                                              translationB
                                                      )?.name || translationB
                                                    : "—"}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {verseKeys.map((v) => (
                                            <tr
                                                key={v}
                                                className="chapter-comp-row"
                                            >
                                                <td className="chapter-comp-verse-num">
                                                    {chapterId}:{v}
                                                </td>
                                                <td className="chapter-comp-verse-text chapter-comp-side-a">
                                                    {renderVerseText(
                                                        versesA?.[v]
                                                    )}
                                                </td>
                                                <td className="chapter-comp-verse-text chapter-comp-side-b">
                                                    {renderVerseText(
                                                        versesB?.[v]
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Mobile view: interleaved */}
                                <div className="chapter-comp-mobile d-md-none">
                                    {verseKeys.map((v) => (
                                        <div
                                            key={v}
                                            className="chapter-comp-mobile-verse"
                                        >
                                            <div className="chapter-comp-mobile-num">
                                                {chapterId}:{v}
                                            </div>
                                            <div className="chapter-comp-mobile-texts">
                                                {translationA && (
                                                    <div className="chapter-comp-mobile-a">
                                                        {renderVerseText(
                                                            versesA?.[v]
                                                        )}
                                                    </div>
                                                )}
                                                {translationB && (
                                                    <div className="chapter-comp-mobile-b">
                                                        {renderVerseText(
                                                            versesB?.[v]
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                    {/* No verses found */}
                    {!isLoading &&
                        !errorA &&
                        !errorB &&
                        (translationA || translationB) &&
                        verseKeys.length === 0 && (
                            <div className="chapter-comp-empty">
                                <p>{formatMessage({ id: "noResults" })}</p>
                            </div>
                        )}
                </div>
            </div>
        </div>
    );
};

export default ChapterComparison;
