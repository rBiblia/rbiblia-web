import React, { useState, useRef, useEffect, memo } from "react";
import PropTypes from "prop-types";
import { useIntl } from "react-intl";
import {
    FAVORITE_TRANSLATIONS_UPDATED_EVENT,
    getFavoriteTranslations,
    saveFavoriteTranslations,
} from "./SideMenu";
import Icon from "./Icon";

const TranslationSelector = memo(
    ({
        translations,
        selectedTranslation,
        changeSelectedTranslation,
        isLoading,
        disabledOptions = [],
        placeholder = "",
    }) => {
        const { locale, formatMessage } = useIntl();
        const [isOpen, setIsOpen] = useState(false);
        const [favorites, setFavorites] = useState(getFavoriteTranslations());
        const [hoveredId, setHoveredId] = useState(null);
        const [collapsedGroups, setCollapsedGroups] = useState({});
        const dropdownRef = useRef(null);

        const languageNames = new Intl.DisplayNames([locale], {
            type: "language",
        });

        // Close dropdown on outside click
        useEffect(() => {
            const handleClickOutside = (e) => {
                if (
                    dropdownRef.current &&
                    !dropdownRef.current.contains(e.target)
                ) {
                    setIsOpen(false);
                }
            };
            document.addEventListener("mousedown", handleClickOutside);
            return () =>
                document.removeEventListener("mousedown", handleClickOutside);
        }, []);

        // Reload favorites when dropdown opens
        useEffect(() => {
            if (isOpen) {
                setFavorites(getFavoriteTranslations());
            }
        }, [isOpen]);

        useEffect(() => {
            const handleFavoritesUpdated = (event) => {
                if (Array.isArray(event.detail)) {
                    setFavorites(event.detail);
                    return;
                }
                setFavorites(getFavoriteTranslations());
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

        const toggleGroup = (e, groupName, defaultCollapsed = true) => {
            e.preventDefault();
            e.stopPropagation();
            setCollapsedGroups((prev) => ({
                ...prev,
                [groupName]: !(prev[groupName] ?? defaultCollapsed),
            }));
        };

        const handleSelect = (id) => {
            changeSelectedTranslation(id);
            setIsOpen(false);
        };

        const toggleFavorite = (e, id) => {
            e.stopPropagation();
            const newFavorites = favorites.includes(id)
                ? favorites.filter((fid) => fid !== id)
                : [...favorites, id];
            setFavorites(newFavorites);
            saveFavoriteTranslations(newFavorites);
        };

        // Separate favorites and rest
        const favoriteTranslations = translations.filter((t) =>
            favorites.includes(t.id)
        );
        const otherTranslations = translations.filter(
            (t) => !favorites.includes(t.id)
        );

        // Group other translations by language
        const translationList = [];
        const map = {};

        otherTranslations.forEach((trans) => {
            if (!map[trans.language]) {
                const languageGroup = {
                    languageName: languageNames.of(trans.language),
                    children: [],
                };
                map[trans.language] = languageGroup.children;
                translationList.push(languageGroup);
            }
            map[trans.language].push(trans);
        });

        const currentTranslation = translations.find(
            (t) => t.id === selectedTranslation
        );

        // Resolve display value for the trigger button
        const getDisplayValue = () => {
            if (currentTranslation) return currentTranslation.name;
            return selectedTranslation || placeholder;
        };

        const renderTranslationItem = (t, showStar = true) => {
            const isDisabled = disabledOptions.includes(t.id);

            return (
                // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-static-element-interactions, jsx-a11y/mouse-events-have-key-events
                <div
                    key={t.id}
                    className={`translation-item ${
                        t.id === selectedTranslation ? "selected" : ""
                    } ${isDisabled ? "disabled" : ""}`}
                    onMouseEnter={() => !isDisabled && setHoveredId(t.id)}
                    onMouseLeave={() => !isDisabled && setHoveredId(null)}
                >
                    <button
                        type="button"
                        onClick={() => !isDisabled && handleSelect(t.id)}
                        disabled={isDisabled}
                        className="translation-name"
                        style={{
                            background: "transparent",
                            border: "none",
                            textAlign: "left",
                            padding: 0,
                            font: "inherit",
                            outline: "none",
                            cursor: isDisabled ? "not-allowed" : "pointer",
                        }}
                    >
                        {t.name} {t.date ? `[${t.date}]` : ""}
                    </button>
                    {showStar && (
                        <button
                            type="button"
                            className={`translation-star ${
                                favorites.includes(t.id) ? "is-favorite" : ""
                            } ${
                                hoveredId === t.id || favorites.includes(t.id)
                                    ? "visible"
                                    : ""
                            }`}
                            onClick={(e) => toggleFavorite(e, t.id)}
                            title={
                                favorites.includes(t.id)
                                    ? formatMessage({
                                          id: "removeFromFavorites",
                                      })
                                    : formatMessage({ id: "addToFavorites" })
                            }
                        >
                            <Icon
                                name="star"
                                size={16}
                                fill={
                                    favorites.includes(t.id)
                                        ? "currentColor"
                                        : "none"
                                }
                            />
                        </button>
                    )}
                </div>
            );
        };

        return (
            <div className="translation-selector" ref={dropdownRef}>
                <button
                    className={`translation-selector-trigger form-control ${
                        isLoading ? "disabled" : ""
                    }`}
                    onClick={() => !isLoading && setIsOpen(!isOpen)}
                    type="button"
                    disabled={isLoading}
                >
                    <span className="translation-selector-value">
                        {isLoading ? (
                            <span className="d-flex align-items-center gap-2">
                                <output className="spinner-border spinner-border-sm text-secondary"></output>
                                <span>
                                    {selectedTranslation || placeholder}...
                                </span>
                            </span>
                        ) : (
                            getDisplayValue()
                        )}
                    </span>
                    <span className="translation-selector-arrow">
                        <Icon name="chevron-down" size={20} />
                    </span>
                </button>

                {isOpen && (
                    <div className="translation-dropdown">
                        {/* Favorites group */}
                        {favoriteTranslations.length > 0 &&
                            (() => {
                                const favLabel = formatMessage({
                                    id: "favorites",
                                });
                                const isFavCollapsed =
                                    collapsedGroups[favLabel] ?? false;
                                return (
                                    <div className="translation-group">
                                        <button
                                            type="button"
                                            className="translation-group-label"
                                            onClick={(e) =>
                                                toggleGroup(e, favLabel, false)
                                            }
                                        >
                                            <div>
                                                <Icon
                                                    name="star"
                                                    size={14}
                                                    fill="currentColor"
                                                    className="me-2"
                                                    style={{
                                                        display: "inline-block",
                                                        verticalAlign:
                                                            "text-bottom",
                                                    }}
                                                />
                                                {favLabel}
                                            </div>
                                            <Icon
                                                name={
                                                    isFavCollapsed
                                                        ? "chevron-right"
                                                        : "chevron-down"
                                                }
                                                size={14}
                                                className="translation-group-chevron"
                                            />
                                        </button>
                                        {!isFavCollapsed &&
                                            favoriteTranslations
                                                .sort((a, b) =>
                                                    a.name.localeCompare(b.name)
                                                )
                                                .map((t) =>
                                                    renderTranslationItem(t)
                                                )}
                                    </div>
                                );
                            })()}

                        {/* Other translations grouped by language */}
                        {translationList.map(({ languageName, children }) => {
                            const isCollapsed =
                                collapsedGroups[languageName] ?? true;
                            return (
                                <div
                                    className="translation-group"
                                    key={languageName}
                                >
                                    <button
                                        type="button"
                                        className="translation-group-label"
                                        onClick={(e) =>
                                            toggleGroup(e, languageName, true)
                                        }
                                    >
                                        {languageName}
                                        <Icon
                                            name={
                                                isCollapsed
                                                    ? "chevron-right"
                                                    : "chevron-down"
                                            }
                                            size={14}
                                            className="translation-group-chevron"
                                        />
                                    </button>
                                    {!isCollapsed &&
                                        children
                                            .sort((a, b) =>
                                                a.name.localeCompare(b.name)
                                            )
                                            .map((t) =>
                                                renderTranslationItem(t)
                                            )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }
);

TranslationSelector.propTypes = {
    translations: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
            language: PropTypes.string,
            date: PropTypes.string,
        })
    ).isRequired,
    selectedTranslation: PropTypes.string,
    changeSelectedTranslation: PropTypes.func.isRequired,
    isLoading: PropTypes.bool,
    disabledOptions: PropTypes.arrayOf(PropTypes.string),
    placeholder: PropTypes.string,
};

TranslationSelector.displayName = "TranslationSelector";

export default TranslationSelector;
