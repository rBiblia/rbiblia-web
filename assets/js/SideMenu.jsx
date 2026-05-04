import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useIntl } from "react-intl";

import useFocusTrap from "./hooks/useFocusTrap";
import useScrollDirection from "./useScrollDirection";
import Icon from "./Icon";
import blurOnTouchInteraction from "./blurOnTouchInteraction";
import {
    safeLocalStorageGetItem,
    safeLocalStorageSetItem,
} from "./safeStorage";

const FAVORITE_TRANSLATIONS_STORAGE_KEY = "rbiblia_favorite_translations";
const FAVORITE_TRANSLATIONS_UPDATED_EVENT =
    "rbiblia:favorite-translations-updated";
const COMPARISON_DIFF_STRICT_KEY = "rbiblia_comparison_diff_strict";

const SideMenu = ({ isOpen, onClose, children }) => {
    // Focus trap for keyboard navigation
    const panelRef = useFocusTrap(isOpen, onClose);

    return (
        <>
            {/* Overlay */}
            <button
                type="button"
                className={`side-menu-overlay ${isOpen ? "active" : ""}`}
                onClick={onClose}
                aria-label="Close menu"
            />

            {/* Panel */}
            <div
                ref={panelRef}
                className={`side-menu-panel ${isOpen ? "open" : ""}`}
            >
                {children}
            </div>
        </>
    );
};

SideMenu.propTypes = {
    isOpen: PropTypes.bool,
    onClose: PropTypes.func,
    children: PropTypes.node,
};

// Sticky tab button on the right edge - lower on the screen
const SideMenuTab = ({
    onClick,
    className = "",
    immersiveDisabled = false,
}) => {
    const { formatMessage } = useIntl();
    const isNavVisible = useScrollDirection({ disabled: immersiveDisabled });

    return (
        <button
            className={`side-menu-tab ${className} ${
                isNavVisible ? "" : "nav-hidden-fab"
            }`}
            onClick={(e) => {
                onClick?.(e);
                blurOnTouchInteraction(e);
            }}
            onPointerUp={blurOnTouchInteraction}
            onTouchEnd={blurOnTouchInteraction}
            aria-label={formatMessage({ id: "openMenu" })}
        >
            <Icon name="settings" />
        </button>
    );
};

SideMenuTab.propTypes = {
    onClick: PropTypes.func,
    className: PropTypes.string,
    immersiveDisabled: PropTypes.bool,
};

// Helper functions for settings
const getComparisonLimit = () => {
    return Number.parseInt(
        safeLocalStorageGetItem("rbiblia_comparison_limit") || "4",
        10
    );
};

const setComparisonLimitValue = (limit) => {
    safeLocalStorageSetItem("rbiblia_comparison_limit", limit.toString());
};

const getFavoriteTranslations = () => {
    try {
        return JSON.parse(
            safeLocalStorageGetItem(FAVORITE_TRANSLATIONS_STORAGE_KEY) || "[]"
        );
    } catch {
        return [];
    }
};

const saveFavoriteTranslations = (favorites) => {
    safeLocalStorageSetItem(
        FAVORITE_TRANSLATIONS_STORAGE_KEY,
        JSON.stringify(favorites)
    );
    if (globalThis.window !== undefined) {
        globalThis.window.dispatchEvent(
            new CustomEvent(FAVORITE_TRANSLATIONS_UPDATED_EVENT, {
                detail: favorites,
            })
        );
    }
};

const isDiffModeStrict = () => {
    return safeLocalStorageGetItem(COMPARISON_DIFF_STRICT_KEY) === "1";
};

const setDiffModeStrict = (strict) => {
    safeLocalStorageSetItem(COMPARISON_DIFF_STRICT_KEY, strict ? "1" : "0");
};

// Settings section with tabs
const DisplaySettings = ({
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
    translations = [],
    setLocaleAndUpdateHistory,
    theme,
    setTheme,
    darkVariant,
    setDarkVariant,
    zenMode,
    setZenMode,
    onClose,
    onOpenChangelog,
    onOpenAbout,
}) => {
    const { formatMessage, locale } = useIntl();

    const [comparisonLimit, setComparisonLimit] = useState(getComparisonLimit);
    const [favoriteTranslations, setFavoriteTranslations] = useState(
        getFavoriteTranslations
    );
    const [diffStrict, setDiffStrict] = useState(isDiffModeStrict);
    const [activeTab, setActiveTab] = useState("text");

    useEffect(() => {
        const handleFavoritesUpdated = (event) => {
            if (Array.isArray(event.detail)) {
                setFavoriteTranslations(event.detail);
                return;
            }
            setFavoriteTranslations(getFavoriteTranslations());
        };

        globalThis.addEventListener(
            FAVORITE_TRANSLATIONS_UPDATED_EVENT,
            handleFavoritesUpdated
        );
        return () => {
            globalThis.removeEventListener(
                FAVORITE_TRANSLATIONS_UPDATED_EVENT,
                handleFavoritesUpdated
            );
        };
    }, []);

    const fontSizes = [
        { value: "small", label: "A", size: "0.9rem" },
        { value: "medium", label: "A", size: "1.15rem" },
        { value: "large", label: "A", size: "1.4rem" },
        { value: "xlarge", label: "A", size: "1.7rem" },
    ];

    const fontFamilies = [
        { value: "serif", label: "Serif", preview: "Georgia, serif" },
        { value: "sans", label: "Sans", preview: "Inter, sans-serif" },
        { value: "mono", label: "Mono", preview: "monospace" },
    ];

    const themes = [
        {
            value: "system",
            label: formatMessage({
                id: "themeSystem",
                defaultMessage: "System",
            }),
            icon: "⚙️",
        },
        {
            value: "light",
            label: formatMessage({ id: "themeLight", defaultMessage: "Light" }),
            icon: "☀️",
        },
        {
            value: "dark",
            label: formatMessage({ id: "themeDark", defaultMessage: "Dark" }),
            icon: "🌙",
        },
    ];

    const comparisonOptions = [2, 3, 4, 5, 6];

    // Tabs configuration
    const tabs = [
        {
            id: "text",
            icon: <Icon name="type" />,
            label: formatMessage({ id: "textSettings" }),
        },
        {
            id: "appearance",
            icon: <Icon name="sun" />,
            label: formatMessage({ id: "appearance" }),
        },
        {
            id: "language",
            icon: <Icon name="globe" />,
            label: formatMessage({ id: "language" }),
        },
        {
            id: "favorites",
            icon: <Icon name="star" />,
            label: formatMessage({ id: "favoriteTranslations" }),
        },

        {
            id: "info",
            icon: (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                </svg>
            ),
            label: formatMessage({ id: "info", defaultMessage: "Info" }),
        },
    ];

    // Handle comparison limit change
    const handleComparisonLimitChange = (limit) => {
        setComparisonLimit(limit);
        setComparisonLimitValue(limit);
    };

    // Toggle favorite translation
    const toggleFavorite = (translationId) => {
        const newFavorites = favoriteTranslations.includes(translationId)
            ? favoriteTranslations.filter((id) => id !== translationId)
            : [...favoriteTranslations, translationId];
        setFavoriteTranslations(newFavorites);
        saveFavoriteTranslations(newFavorites);
    };

    // Filter only favorite translations
    const favoriteTranslationsList = translations.filter((t) =>
        favoriteTranslations.includes(t.id)
    );

    return (
        <>
            {/* Side Menu Dock */}
            <div className="side-menu-dock">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`side-menu-dock-item ${
                            activeTab === tab.id ? "active" : ""
                        }`}
                        onClick={(e) => {
                            setActiveTab(tab.id);
                            blurOnTouchInteraction(e);
                        }}
                        onPointerUp={blurOnTouchInteraction}
                        onTouchEnd={blurOnTouchInteraction}
                        title={tab.label}
                    >
                        {tab.icon}
                    </button>
                ))}
            </div>
            {/* Main Content Area */}
            <div className="side-menu-main">
                <div className="side-menu-header">
                    <h3 className="side-menu-title">
                        {tabs.find((t) => t.id === activeTab)?.label}
                    </h3>
                    {onClose && (
                        <button
                            className="side-menu-close"
                            onClick={(e) => {
                                onClose(e);
                                blurOnTouchInteraction(e);
                            }}
                            onPointerUp={blurOnTouchInteraction}
                            onTouchEnd={blurOnTouchInteraction}
                            aria-label={formatMessage({ id: "close" })}
                        >
                            <Icon name="x" />
                        </button>
                    )}
                </div>
                <div className="side-menu-content">
                    {/* Text settings tab */}
                    {activeTab === "text" && (
                        <div className="side-menu-section animate-slide-up">
                            <h4 className="side-menu-section-title">
                                {formatMessage({ id: "textSettings" })}
                            </h4>

                            {/* Font size setting */}
                            <div className="setting-group stagger-1">
                                <label className="setting-label">
                                    {formatMessage({ id: "fontSize" })}
                                </label>
                                <div className="font-size-buttons">
                                    {fontSizes.map((fs) => (
                                        <button
                                            key={fs.value}
                                            className={`font-size-btn ${
                                                fontSize === fs.value
                                                    ? "active"
                                                    : ""
                                            }`}
                                            onClick={() =>
                                                setFontSize(fs.value)
                                            }
                                            style={{ fontSize: fs.size }}
                                        >
                                            {fs.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Font family setting */}
                            {setFontFamily && (
                                <div className="setting-group stagger-2">
                                    <label className="setting-label">
                                        {formatMessage({ id: "fontFamily" })}
                                    </label>
                                    <div className="font-family-buttons">
                                        {fontFamilies.map((ff) => (
                                            <button
                                                key={ff.value}
                                                className={`font-family-btn ${
                                                    fontFamily === ff.value
                                                        ? "active"
                                                        : ""
                                                }`}
                                                onClick={() =>
                                                    setFontFamily(ff.value)
                                                }
                                                style={{
                                                    fontFamily: ff.preview,
                                                }}
                                            >
                                                {ff.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Appearance settings tab */}
                    {activeTab === "appearance" && (
                        <div className="side-menu-section animate-slide-up">
                            <h4 className="side-menu-section-title">
                                {formatMessage({ id: "appearance" })}
                            </h4>

                            {/* Theme (Light/Dark/System) */}
                            {setTheme && (
                                <div className="setting-group stagger-1">
                                    <label className="setting-label">
                                        {formatMessage({ id: "theme" })}
                                    </label>
                                    <div className="setting-tiles-grid">
                                        {themes.map((t) => (
                                            <button
                                                key={t.value}
                                                className={`setting-tile ${
                                                    theme === t.value
                                                        ? "active"
                                                        : ""
                                                }`}
                                                onClick={() =>
                                                    setTheme(t.value)
                                                }
                                                title={t.label}
                                            >
                                                <span className="tile-icon">
                                                    {t.icon}
                                                </span>
                                                <span className="tile-label">
                                                    {t.label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Dark mode variant */}
                            {setDarkVariant &&
                                (theme === "dark" || theme === "system") && (
                                    <div className="setting-group stagger-2">
                                        <label className="setting-label">
                                            {formatMessage({
                                                id: "darkModeVariant",
                                                defaultMessage:
                                                    "Wariant ciemnego motywu",
                                            })}
                                        </label>
                                        <div className="setting-tiles-grid grid-2">
                                            <button
                                                className={`setting-tile ${
                                                    darkVariant === "gold"
                                                        ? "active"
                                                        : ""
                                                }`}
                                                onClick={() =>
                                                    setDarkVariant("gold")
                                                }
                                                title={formatMessage({
                                                    id: "darkVariantGold",
                                                    defaultMessage:
                                                        "Złoty mrok",
                                                })}
                                            >
                                                <span className="tile-icon">
                                                    🌑
                                                </span>
                                                <span className="tile-label">
                                                    {formatMessage({
                                                        id: "darkVariantGold",
                                                        defaultMessage:
                                                            "Złoty mrok",
                                                    })}
                                                </span>
                                            </button>
                                            <button
                                                className={`setting-tile ${
                                                    darkVariant === "blue"
                                                        ? "active"
                                                        : ""
                                                }`}
                                                onClick={() =>
                                                    setDarkVariant("blue")
                                                }
                                                title={formatMessage({
                                                    id: "darkVariantBlue",
                                                    defaultMessage:
                                                        "Nocny błękit",
                                                })}
                                            >
                                                <span className="tile-icon">
                                                    🌌
                                                </span>
                                                <span className="tile-label">
                                                    {formatMessage({
                                                        id: "darkVariantBlue",
                                                        defaultMessage:
                                                            "Nocny błękit",
                                                    })}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                            {/* Zen Mode toggle */}
                            {setZenMode && (
                                <div className="setting-group stagger-3">
                                    <label className="setting-label">
                                        {formatMessage({
                                            id: "zenMode",
                                            defaultMessage: "Tryb Zen",
                                        })}
                                    </label>
                                    <p className="setting-hint mb-2">
                                        {formatMessage({
                                            id: "zenModeHint",
                                            defaultMessage:
                                                "Blokuje ukrywanie nawigacji podczas przewijania",
                                        })}
                                    </p>
                                    <div className="diff-mode-toggle">
                                        <button
                                            className={`diff-mode-btn ${
                                                zenMode ? "" : "active"
                                            }`}
                                            onClick={() => setZenMode(false)}
                                        >
                                            {formatMessage({
                                                id: "zenModeOff",
                                                defaultMessage: "Wyłączony",
                                            })}
                                        </button>
                                        <button
                                            className={`diff-mode-btn ${
                                                zenMode ? "active" : ""
                                            }`}
                                            onClick={() => setZenMode(true)}
                                        >
                                            {formatMessage({
                                                id: "zenModeOn",
                                                defaultMessage: "Włączony",
                                            })}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Language settings tab */}
                    {activeTab === "language" && setLocaleAndUpdateHistory && (
                        <div className="side-menu-section animate-slide-up">
                            <h4 className="side-menu-section-title">
                                {formatMessage({ id: "appLanguage" })}
                            </h4>

                            <div className="setting-group stagger-1">
                                <label className="setting-label">
                                    {formatMessage({ id: "selectLanguage" })}
                                </label>
                                <div className="setting-tiles-grid grid-2">
                                    {["pl", "en", "de"].map((lang) => (
                                        <button
                                            key={lang}
                                            className={`setting-tile ${
                                                locale === lang ? "active" : ""
                                            }`}
                                            onClick={() =>
                                                setLocaleAndUpdateHistory(lang)
                                            }
                                        >
                                            <span className="tile-icon">
                                                {lang === "pl" && "🇵🇱"}
                                                {lang === "en" && "🇬🇧"}
                                                {lang === "de" && "🇩🇪"}
                                            </span>
                                            <span className="tile-label">
                                                {lang === "pl" && "Polski"}
                                                {lang === "en" && "English"}
                                                {lang === "de" && "Deutsch"}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Favorites tab */}
                    {activeTab === "favorites" && (
                        <div className="animate-slide-up">
                            {/* Translation comparison section */}
                            <div className="side-menu-section stagger-1">
                                <h4 className="side-menu-section-title">
                                    {formatMessage({
                                        id: "comparisonSettings",
                                    })}
                                </h4>

                                <div className="setting-group">
                                    <label className="setting-label">
                                        {formatMessage({
                                            id: "comparisonLimit",
                                        })}
                                    </label>
                                    <div className="comparison-limit-buttons">
                                        {comparisonOptions.map((num) => (
                                            <button
                                                key={num}
                                                className={`comparison-limit-btn ${
                                                    comparisonLimit === num
                                                        ? "active"
                                                        : ""
                                                }`}
                                                onClick={() =>
                                                    handleComparisonLimitChange(
                                                        num
                                                    )
                                                }
                                            >
                                                {num}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="setting-group">
                                    <label className="setting-label">
                                        {formatMessage({ id: "diffMode" })}
                                    </label>
                                    <p className="setting-hint mb-2">
                                        {formatMessage({ id: "diffModeHint" })}
                                    </p>
                                    <div className="diff-mode-toggle">
                                        <button
                                            className={`diff-mode-btn ${
                                                diffStrict ? "" : "active"
                                            }`}
                                            onClick={() => {
                                                setDiffStrict(false);
                                                setDiffModeStrict(false);
                                            }}
                                        >
                                            {formatMessage({
                                                id: "diffModeLoose",
                                            })}
                                        </button>
                                        <button
                                            className={`diff-mode-btn ${
                                                diffStrict ? "active" : ""
                                            }`}
                                            onClick={() => {
                                                setDiffStrict(true);
                                                setDiffModeStrict(true);
                                            }}
                                        >
                                            {formatMessage({
                                                id: "diffModeStrict",
                                            })}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Favorite translations list */}
                            <div className="side-menu-section stagger-2">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <h4 className="side-menu-section-title mb-0">
                                        {formatMessage({
                                            id: "favoriteTranslations",
                                        })}
                                    </h4>
                                </div>

                                <p className="setting-hint">
                                    {formatMessage({
                                        id: "favoriteTranslationsComparisonHint",
                                    })}
                                </p>

                                {favoriteTranslationsList.length > 0 ? (
                                    <div className="favorite-translations-list">
                                        {favoriteTranslationsList.map((t) => (
                                            <div
                                                key={t.id}
                                                className="favorite-translation-item is-favorite"
                                            >
                                                <span className="favorite-star">
                                                    ★
                                                </span>
                                                <span className="favorite-name">
                                                    {t.name}
                                                </span>
                                                <button
                                                    className="favorite-remove"
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleFavorite(t.id);
                                                    }}
                                                    title={formatMessage({
                                                        id: "removeFromFavorites",
                                                    })}
                                                >
                                                    <Icon name="x" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="no-favorites-hint">
                                        <Icon name="star" />
                                        <p>
                                            {formatMessage({
                                                id: "noFavorites",
                                            })}
                                        </p>
                                        <span>
                                            {formatMessage({
                                                id: "noFavoritesHint",
                                            })}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Info tab */}
                    {activeTab === "info" && (
                        <div className="side-menu-section animate-slide-up">
                            <h4 className="side-menu-section-title">
                                {formatMessage({
                                    id: "info",
                                    defaultMessage: "Info",
                                })}
                            </h4>

                            <div className="setting-group stagger-1">
                                <span className="badge bg-light text-dark mb-4 d-inline-block">
                                    {formatMessage({
                                        id: "availableTranslationsCounter",
                                    })}{" "}
                                    {translations.length}
                                </span>

                                {onOpenAbout && (
                                    <button
                                        className="backup-btn backup-changelog mt-2"
                                        onClick={onOpenAbout}
                                        style={{ width: "100%" }}
                                    >
                                        <Icon name="help-circle" />
                                        {formatMessage({
                                            id: "aboutLink",
                                            defaultMessage: "O programie",
                                        })}
                                    </button>
                                )}
                                {onOpenChangelog && (
                                    <button
                                        className="backup-btn backup-changelog mt-2"
                                        onClick={onOpenChangelog}
                                        style={{ width: "100%" }}
                                    >
                                        <Icon name="file-text" />
                                        {formatMessage({ id: "changelogLink" })}
                                    </button>
                                )}
                            </div>

                            <div className="setting-group stagger-2">
                                <h5 className="setting-label mb-3">
                                    {formatMessage({
                                        id: "usefulLinks",
                                        defaultMessage: "Przydatne linki",
                                    })}
                                </h5>
                                <div className="d-flex flex-column gap-2 mb-4">
                                    <a
                                        href="https://rbiblia.toborek.info/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="info-link stagger-3"
                                    >
                                        <Icon name="globe" size={18} />
                                        {formatMessage({
                                            id: "websiteLink",
                                            defaultMessage:
                                                "Strona domowa programu",
                                        })}
                                    </a>
                                    <a
                                        href="https://rbiblia.toborek.info/download"
                                        className="info-link stagger-4"
                                    >
                                        <Icon name="download" size={18} />
                                        {formatMessage({
                                            id: "downloadWindowsLink",
                                            defaultMessage:
                                                "Pobierz rBiblia na Windows",
                                        })}
                                    </a>
                                    <a
                                        href="https://rbiblia.toborek.info/faq/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="info-link stagger-5"
                                    >
                                        <Icon name="help-circle" size={18} />
                                        {formatMessage({
                                            id: "faqLink",
                                            defaultMessage:
                                                "Najczęściej zadawane pytania (FAQ)",
                                        })}
                                    </a>
                                    <a
                                        href="https://kontakt.toborek.info"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="info-link stagger-6"
                                    >
                                        <Icon name="mail" size={18} />
                                        {formatMessage({
                                            id: "contactLink",
                                            defaultMessage:
                                                "Kontakt / Zgłoś błąd",
                                        })}
                                    </a>
                                    <a
                                        href="https://radio.toborek.info"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="info-link stagger-7"
                                    >
                                        <Icon name="radio" size={18} />
                                        {formatMessage({
                                            id: "radioLink",
                                            defaultMessage: "Radio Ewangelią",
                                        })}
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}
                </div>{" "}
                {/* end side-menu-content */}
            </div>{" "}
            {/* end side-menu-main */}
        </>
    );
};

DisplaySettings.propTypes = {
    fontSize: PropTypes.string,
    setFontSize: PropTypes.func,
    fontFamily: PropTypes.string,
    setFontFamily: PropTypes.func,
    translations: PropTypes.array,
    setLocaleAndUpdateHistory: PropTypes.func,
    theme: PropTypes.string,
    setTheme: PropTypes.func,
    darkVariant: PropTypes.string,
    setDarkVariant: PropTypes.func,
    zenMode: PropTypes.bool,
    setZenMode: PropTypes.func,
    onClose: PropTypes.func,
    onOpenChangelog: PropTypes.func,
    onOpenAbout: PropTypes.func,
};

export {
    SideMenu,
    SideMenuTab,
    DisplaySettings,
    getComparisonLimit,
    setComparisonLimitValue,
    getFavoriteTranslations,
    saveFavoriteTranslations,
    isDiffModeStrict,
    setDiffModeStrict,
    FAVORITE_TRANSLATIONS_UPDATED_EVENT,
};
