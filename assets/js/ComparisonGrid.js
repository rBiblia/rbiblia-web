/* global globalThis */
import React, {
    useEffect,
    useState,
    useCallback,
    useMemo,
    useRef,
} from "react";
import PropTypes from "prop-types";
import { useIntl } from "react-intl";
import {
    getComparisonLimit,
    getFavoriteTranslations,
    isDiffModeStrict,
} from "./SideMenu";
import { safeJsonParse } from "./safeJsonParse";
import TranslationSelector from "./TranslationSelector";
import useSwipeNavigation from "./useSwipeNavigation";
import {
    safeLocalStorageGetItem,
    safeLocalStorageSetItem,
} from "./safeStorage";

const COMPARISON_DIFF_MODE_KEY = "rbiblia-comparison-diff-mode";
const WORD_SPLIT_PATTERN =
    /([A-Za-z0-9\u00C0-\u024F\u1E00-\u1EFF]+(?:'[A-Za-z0-9\u00C0-\u024F\u1E00-\u1EFF]+)*)/g;
const WORD_PATTERN =
    /^[A-Za-z0-9\u00C0-\u024F\u1E00-\u1EFF]+(?:'[A-Za-z0-9\u00C0-\u024F\u1E00-\u1EFF]+)*$/;

const normalizeComparisonWord = (word, locale) =>
    word.toLocaleLowerCase(locale);

const normalizeText = (text) =>
    text.replaceAll("//", " ").replaceAll("\u2019", "'");

const getWordSet = (text, locale) => {
    const words = normalizeText(text)
        .split(WORD_SPLIT_PATTERN)
        .filter((part) => WORD_PATTERN.test(part))
        .map((word) => normalizeComparisonWord(word, locale));

    return new Set(words);
};

/**
 * Tokenize text into an array of parts (words and separators).
 * Words match WORD_PATTERN, everything else is a separator.
 */
const tokenize = (text) =>
    normalizeText(text)
        .split(WORD_SPLIT_PATTERN)
        .filter((part) => part !== "");

/**
 * Compute LCS-based word diff between a base text and a compare text.
 * Returns a Set of token indices in the compare text that are NOT in the LCS
 * (i.e., they are unique/different compared to the base).
 */
const computeLcsDiffIndices = (baseText, compareText, locale) => {
    const baseTokens = tokenize(baseText);
    const compareTokens = tokenize(compareText);

    // Extract word tokens with their original indices in the token array
    const baseWords = [];
    const compareWords = [];

    baseTokens.forEach((token, idx) => {
        if (WORD_PATTERN.test(token)) {
            baseWords.push({
                word: normalizeComparisonWord(token, locale),
                idx,
            });
        }
    });

    compareTokens.forEach((token, idx) => {
        if (WORD_PATTERN.test(token)) {
            compareWords.push({
                word: normalizeComparisonWord(token, locale),
                idx,
            });
        }
    });

    const m = baseWords.length;
    const n = compareWords.length;

    // Safety limit to guarantee smooth frame rendering down to old devices
    // (O(m*n) complexity). Reduced from 4000 to 1200 points.
    if (m * n > 1200) {
        return new Set();
    }

    // Build LCS DP table
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (baseWords[i - 1].word === compareWords[j - 1].word) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    // Backtrack to identify which compare-word indices are in LCS
    const lcsCompareIndices = new Set();
    let i = m;
    let j = n;
    while (i > 0 && j > 0) {
        if (baseWords[i - 1].word === compareWords[j - 1].word) {
            lcsCompareIndices.add(compareWords[j - 1].idx);
            i--;
            j--;
        } else if (dp[i - 1][j] > dp[i][j - 1]) {
            i--;
        } else {
            j--;
        }
    }

    // Diff indices = all word token indices NOT in LCS
    const diffIndices = new Set();
    compareWords.forEach(({ idx: tokenIdx }) => {
        if (!lcsCompareIndices.has(tokenIdx)) {
            diffIndices.add(tokenIdx);
        }
    });

    return diffIndices;
};

const ComparisonGrid = ({
    verseId,
    bookId,
    bookName,
    bookSigil,
    chapterId,
    currentTranslation,
    translations,
    onClose,
    onNavigateVerse, // callback(direction) - 'prev' or 'next'
    totalVerses = 0, // total verses in chapter for navigation limits
}) => {
    const { formatMessage, locale } = useIntl();
    const comparisonLimit = getComparisonLimit();
    const favoriteTranslations = getFavoriteTranslations();

    // Get favorites that exist in translations (excluding current)
    const getAvailableFavorites = () => {
        return translations
            .filter(
                (t) =>
                    t.id !== currentTranslation &&
                    favoriteTranslations.includes(t.id)
            )
            .slice(0, comparisonLimit)
            .map((t) => t.id);
    };

    // Initialize selected translations with favorites
    const [selectedTranslations, setSelectedTranslations] = useState(() => {
        const favorites = getAvailableFavorites();
        return [
            ...favorites,
            ...new Array(Math.max(0, comparisonLimit - favorites.length)).fill(
                ""
            ),
        ].slice(0, comparisonLimit);
    });

    const [isDiffHighlightEnabled, setIsDiffHighlightEnabled] = useState(
        () => safeLocalStorageGetItem(COMPARISON_DIFF_MODE_KEY) === "1"
    );

    const [diffStrictMode, setDiffStrictMode] = useState(isDiffModeStrict);

    // Re-read strict mode when the overlay opens or verse changes
    useEffect(() => {
        setDiffStrictMode(isDiffModeStrict());
    }, [verseId]);

    const [comparedVerses, setComparedVerses] = useState({});
    const [loading, setLoading] = useState({});

    // Use ref to track current verse for async operations
    const currentVerseIdRef = useRef(verseId);

    // Fetch verse for a translation
    const fetchTranslationVerse = useCallback(
        (translationId, forVerseId) => {
            setLoading((prev) => ({ ...prev, [translationId]: true }));

            fetch(
                `/api/${locale}/translation/${translationId}/book/${bookId}/chapter/${chapterId}`
            )
                .then((res) => safeJsonParse(res))
                .then((result) => {
                    // Only update if we're still on the same verse
                    if (currentVerseIdRef.current === forVerseId) {
                        if (result?.data?.[forVerseId]) {
                            setComparedVerses((prev) => ({
                                ...prev,
                                [translationId]: result.data[forVerseId],
                            }));
                        } else {
                            setComparedVerses((prev) => ({
                                ...prev,
                                [translationId]: null,
                            }));
                        }
                    }
                })
                .catch(() => {
                    if (currentVerseIdRef.current === forVerseId) {
                        setComparedVerses((prev) => ({
                            ...prev,
                            [translationId]: null,
                        }));
                    }
                })
                .finally(() => {
                    setLoading((prev) => ({ ...prev, [translationId]: false }));
                });
        },
        [locale, bookId, chapterId]
    );

    // Load verses when verseId changes
    useEffect(() => {
        // Update ref
        currentVerseIdRef.current = verseId;

        // Clear previous verses and loading states
        setComparedVerses({});
        setLoading({});

        // We use timeouts to stagger the fetches. This ensures that the massive JSON
        // objects (entire chapters) are parsed in separate frames, yielding to the
        // browser's main thread and preventing UI freezes during overlay open.
        const timeouts = [];

        // Fetch current translation immediately
        fetchTranslationVerse(currentTranslation, verseId);

        // Stagger fetching all selected translations
        let delayCount = 1;
        selectedTranslations.forEach((id) => {
            if (id) {
                const timer = setTimeout(() => {
                    fetchTranslationVerse(id, verseId);
                }, delayCount * 120); // 120ms stagger
                timeouts.push(timer);
                delayCount++;
            }
        });

        // Cleanup function
        return () => {
            timeouts.forEach((t) => clearTimeout(t));
        };
    }, [verseId, bookId, chapterId, currentTranslation, fetchTranslationVerse]);

    // Update selections when favorites change
    useEffect(() => {
        const favorites = getAvailableFavorites();
        const newSelections = [
            ...favorites,
            ...new Array(Math.max(0, comparisonLimit - favorites.length)).fill(
                ""
            ),
        ].slice(0, comparisonLimit);
        setSelectedTranslations(newSelections);
    }, [comparisonLimit]);

    // Convert to integers for comparison
    const currentVerseNum = Number.parseInt(verseId, 10);
    const totalVersesNum = Number.parseInt(totalVerses, 10);

    // Navigation handlers
    const handlePrevVerse = useCallback(() => {
        if (currentVerseNum > 1 && onNavigateVerse) {
            onNavigateVerse("prev");
        }
    }, [currentVerseNum, onNavigateVerse]);

    const handleNextVerse = useCallback(() => {
        if (currentVerseNum < totalVersesNum && onNavigateVerse) {
            onNavigateVerse("next");
        }
    }, [currentVerseNum, totalVersesNum, onNavigateVerse]);

    const canGoPrev = currentVerseNum > 1;
    const canGoNext = currentVerseNum < totalVersesNum;

    const toggleDiffHighlight = useCallback(() => {
        setIsDiffHighlightEnabled((previousValue) => !previousValue);
    }, []);

    useEffect(() => {
        safeLocalStorageSetItem(
            COMPARISON_DIFF_MODE_KEY,
            isDiffHighlightEnabled ? "1" : "0"
        );
    }, [isDiffHighlightEnabled]);

    const primaryText = comparedVerses[currentTranslation];

    const availableComparisonTexts = useMemo(() => {
        const selectedTexts = selectedTranslations
            .map((id) => comparedVerses[id])
            .filter(Boolean);

        return primaryText ? [primaryText, ...selectedTexts] : selectedTexts;
    }, [comparedVerses, primaryText, selectedTranslations]);

    const canHighlightDifferences = availableComparisonTexts.length >= 2;

    // --- LOOSE MODE: global bag-of-words intersection ---
    const commonWords = useMemo(() => {
        if (!canHighlightDifferences || diffStrictMode) {
            return new Set();
        }

        const wordSets = availableComparisonTexts
            .map((text) => getWordSet(text, locale))
            .filter((wordSet) => wordSet.size > 0);

        if (wordSets.length < 2) {
            return new Set();
        }

        const [firstSet, ...otherSets] = wordSets;
        return new Set(
            [...firstSet].filter((word) =>
                otherSets.every((set) => set.has(word))
            )
        );
    }, [
        availableComparisonTexts,
        canHighlightDifferences,
        diffStrictMode,
        locale,
    ]);

    // --- STRICT MODE: pairwise LCS diff indices per translation ---
    const strictDiffMap = useMemo(() => {
        if (!canHighlightDifferences || !diffStrictMode || !primaryText) {
            return new Map();
        }

        const map = new Map();

        // Diff for the primary text itself against the first selected translation
        // (primary gets its own diff — words not in LCS vs first selected)
        const firstSelectedText = selectedTranslations
            .map((id) => comparedVerses[id])
            .find(Boolean);

        if (firstSelectedText) {
            map.set(
                currentTranslation,
                computeLcsDiffIndices(firstSelectedText, primaryText, locale)
            );
        }

        // Diff for each selected translation against the primary
        selectedTranslations.forEach((id) => {
            const text = comparedVerses[id];
            if (id && text) {
                map.set(id, computeLcsDiffIndices(primaryText, text, locale));
            }
        });

        return map;
    }, [
        canHighlightDifferences,
        comparedVerses,
        currentTranslation,
        diffStrictMode,
        locale,
        primaryText,
        selectedTranslations,
    ]);

    const renderComparisonText = useCallback(
        (text, translationId) => {
            const displayText = text
                .replaceAll("//", "\n")
                .replaceAll("\u2019", "'");
            if (!isDiffHighlightEnabled || !canHighlightDifferences) {
                return displayText;
            }

            const tokens = displayText
                .split(WORD_SPLIT_PATTERN)
                .filter((part) => part !== "");

            if (diffStrictMode) {
                // STRICT: use pairwise LCS diff indices
                const diffIndices = strictDiffMap.get(translationId);
                if (!diffIndices) {
                    return displayText;
                }

                return tokens.map((part, index) => {
                    if (!WORD_PATTERN.test(part)) {
                        return part;
                    }

                    if (!diffIndices.has(index)) {
                        return part;
                    }

                    return (
                        <mark
                            key={`${translationId}_${index}`}
                            className="comparison-diff-word"
                        >
                            {part}
                        </mark>
                    );
                });
            }

            // LOOSE: global bag-of-words
            return tokens.map((part, index) => {
                if (!WORD_PATTERN.test(part)) {
                    return part;
                }

                const normalizedWord = normalizeComparisonWord(part, locale);
                if (commonWords.has(normalizedWord)) {
                    return part;
                }

                return (
                    <mark
                        key={`${translationId}_${index}`}
                        className="comparison-diff-word"
                    >
                        {part}
                    </mark>
                );
            });
        },
        [
            canHighlightDifferences,
            commonWords,
            diffStrictMode,
            isDiffHighlightEnabled,
            locale,
            strictDiffMap,
        ]
    );

    const isEditableFieldFocused = useCallback(() => {
        const activeTag = document.activeElement?.tagName?.toLowerCase();
        return (
            activeTag === "input" ||
            activeTag === "textarea" ||
            activeTag === "select" ||
            document.activeElement?.isContentEditable
        );
    }, []);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                onClose();
                return;
            }

            if (isEditableFieldFocused()) {
                return;
            }

            if (e.key.toLowerCase() === "d") {
                if (!e.repeat) {
                    e.preventDefault();
                    toggleDiffHighlight();
                }
                return;
            }

            if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault();
                handlePrevVerse();
            } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault();
                handleNextVerse();
            }
        };

        globalThis.addEventListener("keydown", handleKeyDown);
        return () => globalThis.removeEventListener("keydown", handleKeyDown);
    }, [
        handlePrevVerse,
        handleNextVerse,
        isEditableFieldFocused,
        onClose,
        toggleDiffHighlight,
    ]);

    // Swipe navigation for touch devices
    useSwipeNavigation(
        handleNextVerse, // Swipe left  → next verse
        handlePrevVerse, // Swipe right → previous verse
        {
            threshold: 60,
            enabled: true,
        }
    );

    // Handle translation selection change for a specific slot
    const handleTranslationChange = (index, translationId) => {
        const newSelections = [...selectedTranslations];
        newSelections[index] = translationId;
        setSelectedTranslations(newSelections);

        if (translationId && !comparedVerses[translationId]) {
            fetchTranslationVerse(translationId, verseId);
        }
    };

    // Render translation selector
    const renderTranslationSelector = (index) => {
        const selectedId = selectedTranslations[index];
        const usedTranslations = selectedTranslations.filter(
            (t, i) => t && i !== index
        );
        const disabledIds = [currentTranslation, ...usedTranslations];

        return (
            <div key={index} className="comparison-slot mb-4">
                <div className="comparison-slot-header">
                    <span className="comparison-slot-number">{index + 1}</span>
                    <TranslationSelector
                        translations={translations}
                        selectedTranslation={selectedId}
                        changeSelectedTranslation={(id) =>
                            handleTranslationChange(index, id)
                        }
                        isLoading={false}
                        disabledOptions={disabledIds}
                        placeholder={formatMessage({ id: "chooseTranslation" })}
                    />
                </div>

                {selectedId &&
                    (() => {
                        let content = null;
                        if (loading[selectedId]) {
                            content = (
                                <div className="comparison-loading">
                                    <output className="spinner-border spinner-border-sm"></output>
                                </div>
                            );
                        } else if (comparedVerses[selectedId]) {
                            content = (
                                <p className="comparison-text">
                                    {renderComparisonText(
                                        comparedVerses[selectedId],
                                        selectedId
                                    )}
                                </p>
                            );
                        } else if (comparedVerses[selectedId] === null) {
                            content = (
                                <p className="comparison-not-found">
                                    {formatMessage({
                                        id: "verseNotFoundInTranslation",
                                    })}
                                </p>
                            );
                        }

                        return (
                            <div className="comparison-box comparison-box-secondary mt-2">
                                <div className="comparison-box-title">
                                    {
                                        translations.find(
                                            (t) => t.id === selectedId
                                        )?.name
                                    }
                                </div>
                                {content}
                            </div>
                        );
                    })()}
            </div>
        );
    };

    return (
        <div className="selection-overlay comparison-overlay">
            <button
                type="button"
                onClick={onClose}
                aria-label={formatMessage({ id: "close" })}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    margin: 0,
                    cursor: "default",
                    zIndex: 0,
                }}
                tabIndex={-1}
            />
            <div
                className="selection-content container"
                style={{ position: "relative", zIndex: 1 }}
            >
                {/* Base verse area (scrolls with the page) */}
                <div className="comparison-pinned-area">
                    <div className="selection-header d-flex justify-content-between align-items-center mb-3 pt-4">
                        {/* Navigation and title */}
                        <div className="comparison-nav-header">
                            <button
                                className="comparison-nav-btn"
                                onClick={handlePrevVerse}
                                disabled={!canGoPrev}
                                title={formatMessage({ id: "previousVerse" })}
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <polyline points="15 18 9 12 15 6"></polyline>
                                </svg>
                            </button>

                            <h2 className="comparison-title">
                                <span className="comparison-title-full">
                                    {bookName}
                                </span>
                                <span className="comparison-title-sigil">
                                    {bookSigil}
                                </span>{" "}
                                {chapterId}:{verseId}
                            </h2>

                            <button
                                className="comparison-nav-btn"
                                onClick={handleNextVerse}
                                disabled={!canGoNext}
                                title={formatMessage({ id: "nextVerse" })}
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </button>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                            <span className="comparison-keyboard-hint d-none d-lg-block">
                                ← → {formatMessage({ id: "navigateVerses" })} •
                                D {formatMessage({ id: "toggleDifferences" })}
                            </span>
                            <button
                                className="btn btn-close"
                                onClick={onClose}
                            ></button>
                        </div>
                    </div>

                    {/* Original verse */}
                    <div className="comparison-original">
                        <div className="comparison-box comparison-box-primary">
                            <div className="comparison-box-header">
                                <div className="comparison-box-title comparison-box-title-primary">
                                    {translations.find(
                                        (t) => t.id === currentTranslation
                                    )?.name || currentTranslation}
                                    <span className="comparison-current-badge">
                                        {formatMessage({
                                            id: "currentTranslation",
                                        })}
                                    </span>
                                </div>
                                <label
                                    className="rb-switch"
                                    title={formatMessage({
                                        id: "toggleDifferencesKeyboardHint",
                                    })}
                                >
                                    <span className="visually-hidden">
                                        {formatMessage({
                                            id: "toggleDifferences",
                                        })}
                                    </span>
                                    <input
                                        type="checkbox"
                                        checked={isDiffHighlightEnabled}
                                        onChange={toggleDiffHighlight}
                                    />
                                    <span className="rb-switch-slider">
                                        <span
                                            className="rb-switch-text"
                                            aria-hidden="true"
                                        >
                                            {formatMessage({
                                                id: "toggleDifferences",
                                            })}
                                        </span>
                                    </span>
                                </label>
                            </div>
                            {comparedVerses[currentTranslation] ? (
                                <p className="comparison-text comparison-text-primary">
                                    {renderComparisonText(
                                        comparedVerses[currentTranslation],
                                        currentTranslation
                                    )}
                                </p>
                            ) : (
                                <div className="comparison-loading">
                                    <output className="spinner-border spinner-border-sm"></output>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="selection-body pb-5">
                    <div className="comparison-divider">
                        <span>{formatMessage({ id: "compareWith" })}</span>
                    </div>

                    {/* Translation selectors */}
                    <div className="comparison-selectors">
                        {Array.from({ length: comparisonLimit }, (_, i) =>
                            renderTranslationSelector(i)
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

ComparisonGrid.propTypes = {
    verseId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
    bookId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
    bookName: PropTypes.string.isRequired,
    bookSigil: PropTypes.string.isRequired,
    chapterId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
    currentTranslation: PropTypes.string.isRequired,
    translations: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
        })
    ).isRequired,
    onClose: PropTypes.func.isRequired,
    onNavigateVerse: PropTypes.func.isRequired,
    totalVerses: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default ComparisonGrid;
