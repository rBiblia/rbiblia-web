import React, {
    useState,
    useCallback,
    useRef,
    useMemo,
    useEffect,
} from "react";
import { useIntl } from "react-intl";
import PropTypes from "prop-types";
import { OT_BOOKS, NT_BOOKS, SEARCH_SCOPE } from "./constants";
import useFocusTrap from "./hooks/useFocusTrap";
import useScrollWithVirtualization from "./hooks/useScrollWithVirtualization";
import { safeJsonParse } from "./safeJsonParse";
import {
    safeLocalStorageGetItem,
    safeLocalStorageRemoveItem,
    safeLocalStorageSetItem,
} from "./safeStorage";

const SEARCH_HISTORY_KEY = "rbiblia-search-history";
const SEARCH_HISTORY_LIMIT = 5;
const MAX_SUGGESTIONS = 8;

/**
 * Popular biblical search phrases by locale.
 * Ordered roughly by frequency / usefulness.
 */
const POPULAR_PHRASES = {
    pl: [
        "miłość",
        "wiara",
        "nadzieja",
        "zbawienie",
        "modlitwa",
        "grzech",
        "łaska",
        "pokój",
        "mądrość",
        "sprawiedliwość",
        "miłosierdzie",
        "przebaczenie",
        "zmartwychwstanie",
        "światłość",
        "prawda",
        "wolność",
        "błogosławieństwo",
        "pocieszenie",
        "wierność",
        "Jezus",
        "Bóg",
        "Duch Święty",
        "królestwo",
        "życie wieczne",
        "krzyż",
        "chrzest",
        "przymierze",
        "prorok",
        "anioł",
        "stworzenie",
    ],
    en: [
        "love",
        "faith",
        "hope",
        "salvation",
        "prayer",
        "sin",
        "grace",
        "peace",
        "wisdom",
        "righteousness",
        "mercy",
        "forgiveness",
        "resurrection",
        "light",
        "truth",
        "freedom",
        "blessing",
        "comfort",
        "faithfulness",
        "Jesus",
        "God",
        "Holy Spirit",
        "kingdom",
        "eternal life",
        "cross",
        "baptism",
        "covenant",
        "prophet",
        "angel",
        "creation",
    ],
    de: [
        "Liebe",
        "Glaube",
        "Hoffnung",
        "Erlösung",
        "Gebet",
        "Sünde",
        "Gnade",
        "Frieden",
        "Weisheit",
        "Gerechtigkeit",
        "Barmherzigkeit",
        "Vergebung",
        "Auferstehung",
        "Licht",
        "Wahrheit",
        "Freiheit",
        "Segen",
        "Trost",
        "Treue",
        "Jesus",
        "Gott",
        "Heiliger Geist",
        "Königreich",
        "ewiges Leben",
        "Kreuz",
        "Taufe",
        "Bund",
        "Prophet",
        "Engel",
        "Schöpfung",
    ],
};

/** Inline SVG icon for suggestion type indicators */
const SuggestionIcon = ({ type }) => {
    if (type === "history") {
        return (
            <svg
                className="suggestion-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
            </svg>
        );
    }
    if (type === "book") {
        return (
            <svg
                className="suggestion-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
        );
    }
    // phrase
    return (
        <svg
            className="suggestion-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
    );
};

SuggestionIcon.propTypes = {
    type: PropTypes.string.isRequired,
};

const normalizeQuery = (value) => value.trim().replaceAll(/\s+/g, " ");

const getSavedSearchHistory = () => {
    try {
        const rawHistory = safeLocalStorageGetItem(SEARCH_HISTORY_KEY);
        if (!rawHistory) {
            return [];
        }

        const parsedHistory = JSON.parse(rawHistory);
        if (!Array.isArray(parsedHistory)) {
            return [];
        }

        return parsedHistory
            .filter((item) => typeof item === "string")
            .map((item) => normalizeQuery(item))
            .filter((item) => item.length >= 3)
            .slice(0, SEARCH_HISTORY_LIMIT);
    } catch {
        return [];
    }
};

/**
 * Search Panel - Full-text search across Bible verses
 */
const SearchPanel = ({
    isOpen,
    onClose,
    selectedTranslation,
    books,
    onNavigateToVerse,
}) => {
    const { formatMessage, locale } = useIntl();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [error, setError] = useState(null);
    const [searchScope, setSearchScope] = useState(SEARCH_SCOPE.ALL);
    const [searchHistory, setSearchHistory] = useState(getSavedSearchHistory);
    const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
    const abortControllerRef = useRef(null);
    const suggestionsRef = useRef(null);

    // Debounced search
    const searchTimeoutRef = useRef(null);

    // Guard against ghost clicks on touch devices — prevents the synthetic click
    // fired ~300ms after touchend from falling through to the Reader underneath
    const touchHandledRef = useRef(false);
    const touchStartPosRef = useRef(null);

    // Focus trap for keyboard navigation
    const panelRef = useFocusTrap(isOpen, onClose);

    // Get book name
    const getBookName = (bookId) => {
        return books[bookId]?.name || bookId;
    };

    const saveSearchToHistory = useCallback((searchQuery) => {
        const normalizedQuery = normalizeQuery(searchQuery);
        if (normalizedQuery.length < 3) {
            return;
        }

        setSearchHistory((previousHistory) => {
            const nextHistory = [
                normalizedQuery,
                ...previousHistory.filter((item) => item !== normalizedQuery),
            ].slice(0, SEARCH_HISTORY_LIMIT);

            try {
                safeLocalStorageSetItem(
                    SEARCH_HISTORY_KEY,
                    JSON.stringify(nextHistory)
                );
            } catch {
                // Ignore storage write failures (private mode/quota)
            }
            return nextHistory;
        });
    }, []);

    const clearSearchHistory = useCallback(() => {
        try {
            safeLocalStorageRemoveItem(SEARCH_HISTORY_KEY);
        } catch {
            // Ignore storage write failures (private mode/quota)
        }
        setSearchHistory([]);
    }, []);

    // Perform search via API
    const performSearch = useCallback(
        async (searchQuery) => {
            const normalizedQuery = normalizeQuery(searchQuery);
            if (!normalizedQuery || normalizedQuery.length < 3) {
                setResults([]);
                setHasSearched(false);
                return;
            }

            // Cancel previous request
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            abortControllerRef.current = new AbortController();
            setIsSearching(true);
            setError(null);

            try {
                // API endpoint: POST /api/{language}/search
                // Body: { query: string, translation: string }
                const response = await fetch(`/api/${locale}/search`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        query: normalizedQuery,
                        translation: selectedTranslation,
                    }),
                    signal: abortControllerRef.current.signal,
                });

                const data = await safeJsonParse(response);

                // API returns { code, data: { translation, query, results } }
                // Handle both nested and flat response structures
                const resultsData = data.data?.results || data.results || [];

                const mappedResults = resultsData.map((item) => ({
                    book: item.book,
                    chapter: Number.parseInt(item.chapter),
                    verse: Number.parseInt(item.verse),
                    text: item.content || item.text || "",
                }));

                setResults(mappedResults);
                setHasSearched(true);
            } catch (err) {
                if (err.name !== "AbortError") {
                    console.error("Search error:", err);
                    // Show user-friendly message
                    const errorMsg =
                        err.message || formatMessage({ id: "searchError" });
                    setError(errorMsg);
                    setResults([]);
                    setHasSearched(true);
                }
            } finally {
                setIsSearching(false);
            }
        },
        [selectedTranslation, locale, formatMessage]
    );

    // ─── Autocomplete suggestions ───────────────────────────────
    const suggestions = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        if (normalizedQuery.length < 1) return [];

        const results = [];
        const seen = new Set();

        const addIfMatches = (text, type, extra) => {
            if (results.length >= MAX_SUGGESTIONS) return;
            const lower = text.toLowerCase();
            if (lower === normalizedQuery) return; // exact match — no need to suggest
            if (!lower.includes(normalizedQuery)) return;
            if (seen.has(lower)) return;
            seen.add(lower);
            results.push({ type, text, ...extra });
        };

        // 1. History (highest priority)
        searchHistory.forEach((item) => addIfMatches(item, "history"));

        // 2. Book names (include bookId for direct navigation)
        if (books) {
            Object.entries(books).forEach(([bookId, book]) => {
                if (book?.name) addIfMatches(book.name, "book", { bookId });
            });
        }

        // 3. Popular phrases
        const phrases = POPULAR_PHRASES[locale] || POPULAR_PHRASES.en;
        phrases.forEach((phrase) => addIfMatches(phrase, "phrase"));

        return results;
    }, [query, searchHistory, books, locale]);

    // Reset suggestion index when suggestions change
    useEffect(() => {
        setSelectedSuggestionIndex(-1);
    }, [suggestions]);

    // Scroll active suggestion into view
    useEffect(() => {
        if (selectedSuggestionIndex >= 0 && suggestionsRef.current) {
            const active =
                suggestionsRef.current.children[selectedSuggestionIndex];
            active?.scrollIntoView?.({ block: "nearest" });
        }
    }, [selectedSuggestionIndex]);

    const selectSuggestion = useCallback(
        (suggestion) => {
            setIsSuggestionsOpen(false);
            setSelectedSuggestionIndex(-1);
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }

            // Book suggestion → navigate directly to the book
            if (suggestion.type === "book" && suggestion.bookId) {
                onNavigateToVerse?.(suggestion.bookId, 1, 1);
                onClose();
                return;
            }

            // History / phrase → perform text search
            setQuery(suggestion.text);
            saveSearchToHistory(suggestion.text);
            performSearch(suggestion.text);
        },
        [onClose, onNavigateToVerse, performSearch, saveSearchToHistory]
    );

    // Handle input change with debounce
    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);
        setIsSuggestionsOpen(true);
        setSelectedSuggestionIndex(-1);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            performSearch(value);
        }, 500); // 500ms debounce
    };

    // Keyboard navigation for suggestions
    const handleInputKeyDown = (e) => {
        if (!isSuggestionsOpen || suggestions.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedSuggestionIndex((prev) =>
                prev < suggestions.length - 1 ? prev + 1 : 0
            );
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedSuggestionIndex((prev) =>
                prev > 0 ? prev - 1 : suggestions.length - 1
            );
        } else if (e.key === "Enter" && selectedSuggestionIndex >= 0) {
            e.preventDefault();
            selectSuggestion(suggestions[selectedSuggestionIndex]);
        } else if (e.key === "Escape") {
            setIsSuggestionsOpen(false);
            setSelectedSuggestionIndex(-1);
        }
    };

    const handleInputFocus = () => {
        if (query.trim().length >= 1) {
            setIsSuggestionsOpen(true);
        }
    };

    const handleInputBlur = () => {
        // Small delay so clicks on suggestions can register before closing
        setTimeout(() => setIsSuggestionsOpen(false), 180);
    };

    // Handle form submit
    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSuggestionsOpen(false);
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        saveSearchToHistory(query);
        performSearch(query);
    };

    // Navigate to result
    const handleResultClick = (result) => {
        saveSearchToHistory(query);
        onNavigateToVerse?.(result.book, result.chapter, result.verse);
        onClose();
    };

    // Clear search
    const clearSearch = () => {
        setQuery("");
        setResults([]);
        setHasSearched(false);
        setError(null);
        setIsSuggestionsOpen(false);
    };

    const handleHistoryItemClick = (historyQuery) => {
        setQuery(historyQuery);
        setIsSuggestionsOpen(false);
        saveSearchToHistory(historyQuery);
        performSearch(historyQuery);
    };

    // Highlight matching text
    const highlightMatch = (text, searchTerm) => {
        if (!searchTerm.trim() || !text) return text;

        try {
            const escapedTerm = searchTerm.replaceAll(
                /[.*+?^${}()|[\]\\]/g,
                String.raw`\$&`
            );
            const regex = new RegExp(`(${escapedTerm})`, "gi");
            const parts = text.split(regex);

            return parts.map((part, i) =>
                regex.test(part) ? (
                    <mark key={`${i}-${part}`} className="search-highlight">
                        {part}
                    </mark>
                ) : (
                    part
                )
            );
        } catch {
            return text;
        }
    };

    // Truncate text around match
    const getTruncatedText = (text, searchTerm, maxLength = 150) => {
        if (!text) return "";
        if (text.length <= maxLength) return text;

        const lowerText = text.toLowerCase();
        const lowerSearch = searchTerm.toLowerCase();
        const matchIndex = lowerText.indexOf(lowerSearch);

        if (matchIndex === -1) {
            return text.substring(0, maxLength) + "...";
        }

        const start = Math.max(0, matchIndex - 50);
        const end = Math.min(text.length, matchIndex + searchTerm.length + 100);

        let result = text.substring(start, end);
        if (start > 0) result = "..." + result;
        if (end < text.length) result = result + "...";

        return result;
    };

    // Filter results locally based on selected scope
    const filteredResults = useMemo(() => {
        if (searchScope === SEARCH_SCOPE.ALL) return results;
        if (searchScope === SEARCH_SCOPE.OT) {
            return results.filter((r) => OT_BOOKS.includes(r.book));
        }
        if (searchScope === SEARCH_SCOPE.NT) {
            return results.filter((r) => NT_BOOKS.includes(r.book));
        }
        return results;
    }, [results, searchScope]);

    // Virtual scrolling for results list
    const {
        visibleItems: visibleResults,
        hasMore,
        handleScroll,
        reset: resetVirtualization,
    } = useScrollWithVirtualization(filteredResults, {
        initialCount: 20,
        batchSize: 15,
    });

    // Reset virtualization when filtered results change
    useEffect(() => {
        resetVirtualization();
    }, [filteredResults, resetVirtualization]);

    return (
        <>
            {/* Overlay */}
            <div
                className={`search-overlay ${isOpen ? "active" : ""}`}
                aria-hidden="true"
                onClick={onClose}
            />

            {/* Panel */}
            <div
                ref={panelRef}
                className={`search-panel ${isOpen ? "open" : ""}`}
            >
                <div className="search-header">
                    <h3 className="search-title">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        {formatMessage({ id: "search" })}
                    </h3>
                    <button className="search-close" onClick={onClose}>
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {/* Search input */}
                <form className="search-form" onSubmit={handleSubmit}>
                    <div className="search-input-wrapper">
                        <svg
                            className="search-input-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input
                            type="text"
                            className="search-input"
                            value={query}
                            onChange={handleInputChange}
                            onKeyDown={handleInputKeyDown}
                            onFocus={handleInputFocus}
                            onBlur={handleInputBlur}
                            placeholder={formatMessage({
                                id: "searchPlaceholder",
                            })}
                            autoFocus
                        />
                        {query && (
                            <button
                                type="button"
                                className="search-clear-btn"
                                onClick={clearSearch}
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        )}

                        {/* Autocomplete suggestions dropdown */}
                        {isSuggestionsOpen && suggestions.length > 0 && (
                            <ul
                                ref={suggestionsRef}
                                className="search-suggestions"
                            >
                                {suggestions.map((suggestion, index) => {
                                    const getTypeLabel = (type) => {
                                        if (type === "history")
                                            return formatMessage({
                                                id: "suggestionHistory",
                                            });
                                        if (type === "book")
                                            return formatMessage({
                                                id: "suggestionBook",
                                            });
                                        return formatMessage({
                                            id: "suggestionPhrase",
                                        });
                                    };

                                    return (
                                        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
                                        <li
                                            key={`${suggestion.type}-${suggestion.text}`}
                                            className={`search-suggestion-item ${
                                                index ===
                                                selectedSuggestionIndex
                                                    ? "active"
                                                    : ""
                                            }`}
                                            tabIndex={-1}
                                            onMouseDown={(e) => {
                                                e.preventDefault(); // Prevent input blur on desktop
                                            }}
                                            onClick={() => {
                                                selectSuggestion(suggestion);
                                            }}
                                            onKeyDown={(e) => {
                                                if (
                                                    e.key === "Enter" ||
                                                    e.key === " "
                                                ) {
                                                    e.preventDefault();
                                                    selectSuggestion(
                                                        suggestion
                                                    );
                                                }
                                            }}
                                            onMouseEnter={() =>
                                                setSelectedSuggestionIndex(
                                                    index
                                                )
                                            }
                                        >
                                            <SuggestionIcon
                                                type={suggestion.type}
                                            />
                                            <span className="suggestion-text">
                                                {suggestion.text}
                                            </span>
                                            <span className="suggestion-type-label">
                                                {getTypeLabel(suggestion.type)}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                    {query.length > 0 &&
                        query.length < 3 &&
                        !isSuggestionsOpen && (
                            <p className="search-hint">
                                {formatMessage({ id: "searchMinChars" })}
                            </p>
                        )}
                </form>

                {/* Search scope toggle */}
                <div className="search-scope-container">
                    <div className="search-scope-toggle">
                        {Object.values(SEARCH_SCOPE).map((scope) => (
                            <button
                                key={scope}
                                className={`scope-toggle-btn ${
                                    searchScope === scope ? "active" : ""
                                }`}
                                onClick={() => setSearchScope(scope)}
                            >
                                {formatMessage({ id: `scope${scope}` })}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results */}
                <div className="search-content" onScroll={handleScroll}>
                    {isSearching && (
                        <div className="search-loading">
                            <div className="search-spinner"></div>
                            <p>{formatMessage({ id: "searching" })}</p>
                        </div>
                    )}

                    {error && (
                        <div className="search-error">
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            <p>{error}</p>
                        </div>
                    )}

                    {!isSearching &&
                        !error &&
                        hasSearched &&
                        results.length === 0 && (
                            <div className="search-empty">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                >
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line
                                        x1="21"
                                        y1="21"
                                        x2="16.65"
                                        y2="16.65"
                                    ></line>
                                </svg>
                                <p>{formatMessage({ id: "noResults" })}</p>
                                <span className="search-empty-hint">
                                    {formatMessage({ id: "noResultsHint" })}
                                </span>
                            </div>
                        )}

                    {!isSearching &&
                        !error &&
                        hasSearched &&
                        results.length > 0 &&
                        filteredResults.length === 0 && (
                            <div className="search-empty">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                >
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line
                                        x1="21"
                                        y1="21"
                                        x2="16.65"
                                        y2="16.65"
                                    ></line>
                                </svg>
                                <p>
                                    {formatMessage({ id: "noResultsInScope" })}
                                </p>
                                <span className="search-empty-hint">
                                    {formatMessage(
                                        { id: "noResultsInScopeHint" },
                                        {
                                            scope: formatMessage({
                                                id: `scope${searchScope}`,
                                            }),
                                        }
                                    )}
                                </span>
                            </div>
                        )}

                    {!isSearching && filteredResults.length > 0 && (
                        <>
                            <div className="search-results-header">
                                <span className="search-results-count">
                                    {formatMessage(
                                        { id: "resultsCount" },
                                        { count: filteredResults.length }
                                    )}
                                </span>
                            </div>
                            <ul className="search-results">
                                {visibleResults.map((result, index) => (
                                    <li
                                        key={`${result.book}_${result.chapter}_${result.verse}_${index}`}
                                        className="search-result-item"
                                    >
                                        <button
                                            type="button"
                                            className="search-result-button"
                                            onTouchStart={(e) => {
                                                const t = e.touches[0];
                                                touchStartPosRef.current = {
                                                    x: t.clientX,
                                                    y: t.clientY,
                                                };
                                            }}
                                            onTouchEnd={(e) => {
                                                const start =
                                                    touchStartPosRef.current;
                                                if (start) {
                                                    const t =
                                                        e.changedTouches[0];
                                                    const dx = Math.abs(
                                                        t.clientX - start.x
                                                    );
                                                    const dy = Math.abs(
                                                        t.clientY - start.y
                                                    );
                                                    // Only treat as tap if finger barely moved
                                                    if (dx < 10 && dy < 10) {
                                                        e.preventDefault();
                                                        touchHandledRef.current = true;
                                                        handleResultClick(
                                                            result
                                                        );
                                                    }
                                                }
                                                touchStartPosRef.current = null;
                                            }}
                                            onClick={() => {
                                                if (touchHandledRef.current) {
                                                    touchHandledRef.current = false;
                                                    return;
                                                }
                                                handleResultClick(result);
                                            }}
                                            style={{
                                                all: "unset",
                                                display: "block",
                                                width: "100%",
                                                cursor: "pointer",
                                                textAlign: "left",
                                            }}
                                        >
                                            <div className="search-result-header">
                                                <span className="search-result-reference">
                                                    {getBookName(result.book)}{" "}
                                                    {result.chapter}:
                                                    {result.verse}
                                                </span>
                                            </div>
                                            <p className="search-result-text">
                                                {highlightMatch(
                                                    getTruncatedText(
                                                        result.text,
                                                        query
                                                    ),
                                                    query
                                                )}
                                            </p>
                                        </button>
                                    </li>
                                ))}
                                {hasMore && (
                                    <li className="load-more-indicator">
                                        <span className="load-more-spinner"></span>
                                        {formatMessage(
                                            { id: "loadingMore" },
                                            {
                                                defaultMessage:
                                                    "Loading more...",
                                            }
                                        )}
                                    </li>
                                )}
                            </ul>
                        </>
                    )}

                    {!isSearching && !hasSearched && !error && (
                        <div className="search-initial">
                            {searchHistory.length > 0 && (
                                <div className="search-history">
                                    <div className="search-history-header">
                                        <h4 className="search-history-title">
                                            {formatMessage({
                                                id: "recentSearches",
                                            })}
                                        </h4>
                                        <button
                                            type="button"
                                            className="search-history-clear"
                                            onClick={clearSearchHistory}
                                        >
                                            {formatMessage(
                                                { id: "clear" },
                                                { defaultMessage: "Clear" }
                                            )}
                                        </button>
                                    </div>
                                    <div className="search-history-list">
                                        {searchHistory.map((item) => (
                                            <button
                                                key={item}
                                                type="button"
                                                className="search-history-chip"
                                                onClick={() =>
                                                    handleHistoryItemClick(item)
                                                }
                                            >
                                                {item}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                            >
                                <circle cx="11" cy="11" r="8"></circle>
                                <line
                                    x1="21"
                                    y1="21"
                                    x2="16.65"
                                    y2="16.65"
                                ></line>
                            </svg>
                            <p className="search-initial-title">
                                {formatMessage({ id: "searchInitialHint" })}
                            </p>
                            <div className="search-help">
                                <p className="search-help-text">
                                    {formatMessage({ id: "searchHelpText" })}
                                </p>
                                <ul className="search-help-list">
                                    <li>
                                        {formatMessage({
                                            id: "searchHelpTip1",
                                        })}
                                    </li>
                                    <li>
                                        {formatMessage({
                                            id: "searchHelpTip2",
                                        })}
                                    </li>
                                    <li>
                                        {formatMessage({
                                            id: "searchHelpTip3",
                                        })}
                                    </li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

SearchPanel.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    selectedTranslation: PropTypes.string,
    books: PropTypes.objectOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
        })
    ),
    onNavigateToVerse: PropTypes.func.isRequired,
};

export default SearchPanel;
export { normalizeQuery };
