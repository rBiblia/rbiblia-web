/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-element-to-interactive-role, jsx-a11y/click-events-have-key-events */
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useIntl } from "react-intl";
import useFocusTrap from "./hooks/useFocusTrap";
import {
    safeLocalStorageGetItem,
    safeLocalStorageSetItem,
} from "./safeStorage";

const NOTES_STORAGE_KEY = "rbiblia_notes";
const GENERAL_NOTES_KEY = "rbiblia_general_notes";
const TRANSLATION_NOTES_KEY = "rbiblia_translation_notes";
const GENERAL_NOTE_PREVIEW_LIMIT = 100;
const VERSE_NOTE_PREVIEW_LIMIT = 100;

/**
 * Get verse key for storage
 */
const getVerseKey = (book, chapter, verse) => `${book}_${chapter}_${verse}`;

/**
 * Get translation-specific verse key for storage
 */
const getTranslationVerseKey = (translationId, book, chapter, verse) =>
    `${translationId}:${book}_${chapter}_${verse}`;

/**
 * Parse a translation verse key back to its components
 */
const parseTranslationVerseKey = (key) => {
    const [translationId, rest] = key.split(":");
    const [book, chapter, verse] = rest.split("_");
    return { translationId, book, chapter, verse };
};

/**
 * Load all notes from localStorage
 */
const loadNotes = () => {
    try {
        const saved = safeLocalStorageGetItem(NOTES_STORAGE_KEY);
        return saved ? JSON.parse(saved) : {};
    } catch {
        return {};
    }
};

/**
 * Save all notes to localStorage
 */
const saveNotes = (notes) => {
    safeLocalStorageSetItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
};

/**
 * Load general notes (not bound to verses)
 */
const loadGeneralNotes = () => {
    try {
        const saved = safeLocalStorageGetItem(GENERAL_NOTES_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
};

/**
 * Save general notes
 */
const saveGeneralNotes = (notes) => {
    safeLocalStorageSetItem(GENERAL_NOTES_KEY, JSON.stringify(notes));
};

/**
 * Load translation-specific notes from localStorage
 */
const loadTranslationNotes = () => {
    try {
        const saved = safeLocalStorageGetItem(TRANSLATION_NOTES_KEY);
        return saved ? JSON.parse(saved) : {};
    } catch {
        return {};
    }
};

/**
 * Save translation-specific notes to localStorage
 */
const saveTranslationNotes = (notes) => {
    safeLocalStorageSetItem(TRANSLATION_NOTES_KEY, JSON.stringify(notes));
};

/**
 * Export all notes to rBiblia-compatible XML format
 */
const exportNotesXml = () => {
    const globalNotes = loadNotes();
    const translationNotes = loadTranslationNotes();

    // Group translation notes by translationId
    const byTranslation = {};
    for (const [key, text] of Object.entries(translationNotes)) {
        const { translationId, book, chapter, verse } =
            parseTranslationVerseKey(key);
        if (!byTranslation[translationId]) {
            byTranslation[translationId] = [];
        }
        byTranslation[translationId].push({ book, chapter, verse, text });
    }

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<notes app="rBiblia">\n';

    // Global notes (translation without id)
    const globalEntries = Object.entries(globalNotes);
    if (globalEntries.length > 0) {
        xml += "  <translation>\n";
        for (const [key, text] of globalEntries) {
            const [book, chapter, verse] = key.split("_");
            const escapedText = escapeXml(text);
            xml += `    <note book="${book}" chapter="${chapter}" verse="${verse}">${escapedText}</note>\n`;
        }
        xml += "  </translation>\n";
    }

    // Translation-specific notes
    for (const [translationId, notes] of Object.entries(byTranslation)) {
        xml += `  <translation id="${escapeXml(translationId)}">\n`;
        for (const { book, chapter, verse, text } of notes) {
            const escapedText = escapeXml(text);
            xml += `    <note book="${book}" chapter="${chapter}" verse="${verse}">${escapedText}</note>\n`;
        }
        xml += "  </translation>\n";
    }

    xml += "</notes>\n";
    return xml;
};

/**
 * Escape special XML characters
 */
const escapeXml = (str) =>
    str
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&apos;");

/**
 * Import notes from rBiblia-compatible XML format
 * Merges with existing notes (imported overwrite existing on conflict)
 */
const importNotesXml = (xmlString) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, "text/xml");

    const errorNode = doc.querySelector("parsererror");
    if (errorNode) {
        throw new Error("Invalid XML format");
    }

    const notesRoot = doc.querySelector("notes");
    if (!notesRoot) {
        throw new Error("Missing <notes> root element");
    }

    const globalNotes = loadNotes();
    const translationNotes = loadTranslationNotes();

    const translationElements = notesRoot.querySelectorAll("translation");

    for (const translationEl of translationElements) {
        const translationId = translationEl.getAttribute("id");
        const noteElements = translationEl.querySelectorAll("note");

        for (const noteEl of noteElements) {
            const book = noteEl.getAttribute("book");
            const chapter = noteEl.getAttribute("chapter");
            const verse = noteEl.getAttribute("verse");
            const text = noteEl.textContent.trim();

            if (!book || !chapter || !verse || !text) continue;

            if (translationId) {
                // Translation-specific note
                const key = getTranslationVerseKey(
                    translationId,
                    book,
                    chapter,
                    verse
                );
                translationNotes[key] = text;
            } else {
                // Global note
                const key = getVerseKey(book, chapter, verse);
                globalNotes[key] = text;
            }
        }
    }

    saveNotes(globalNotes);
    saveTranslationNotes(translationNotes);

    return {
        globalCount: Object.keys(globalNotes).length,
        translationCount: Object.keys(translationNotes).length,
    };
};

/**
 * Download a string as a file
 */
const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
};

/**
 * Notes Panel - displays all notes or notes for current chapter
 */
const NotesPanel = ({
    isOpen,
    onClose,
    selectedBook,
    selectedChapter,
    selectedTranslation,
    translations = [],
    books,
    onNavigateToVerse,
}) => {
    // Helper: resolve translationId to human-readable name
    const getTranslationName = (id) => {
        if (!id) return null;
        const found = translations.find((t) => t.id === id);
        return found ? found.name : id;
    };
    const { formatMessage } = useIntl();
    const [notes, setNotes] = useState({});
    const [translationNotes, setTranslationNotes] = useState({});
    const [generalNotes, setGeneralNotes] = useState([]);
    const [filter, setFilter] = useState("current"); // "current" | "all" | "general"
    const [isAddingGeneral, setIsAddingGeneral] = useState(false);
    const [newGeneralNote, setNewGeneralNote] = useState("");
    const [selectedGeneralNote, setSelectedGeneralNote] = useState(null);
    const [isEditingGeneralPreview, setIsEditingGeneralPreview] =
        useState(false);
    const [generalPreviewDraft, setGeneralPreviewDraft] = useState("");
    const [selectedVerseNote, setSelectedVerseNote] = useState(null);
    const [isEditingVersePreview, setIsEditingVersePreview] = useState(false);
    const [versePreviewDraft, setVersePreviewDraft] = useState("");
    const [importMessage, setImportMessage] = useState(null);

    // Focus trap for keyboard navigation
    const panelRef = useFocusTrap(isOpen, onClose);

    // Load notes on mount
    useEffect(() => {
        if (isOpen) {
            setNotes(loadNotes());
            setTranslationNotes(loadTranslationNotes());
            setGeneralNotes(loadGeneralNotes());
            setImportMessage(null);
            setSelectedGeneralNote(null);
            setIsEditingGeneralPreview(false);
            setGeneralPreviewDraft("");
            setSelectedVerseNote(null);
            setIsEditingVersePreview(false);
            setVersePreviewDraft("");
            return;
        }
        setSelectedGeneralNote(null);
        setIsEditingGeneralPreview(false);
        setGeneralPreviewDraft("");
        setSelectedVerseNote(null);
        setIsEditingVersePreview(false);
        setVersePreviewDraft("");
    }, [isOpen]);

    // Get filtered notes — returns array of [key, text, type] where type is "global" or "translation"
    const getFilteredNotes = () => {
        const allGlobal = Object.entries(notes).map(([key, text]) => [
            key,
            text,
            "global",
            null,
        ]);

        const allTranslation = Object.entries(translationNotes).map(
            ([key, text]) => {
                const { translationId } = parseTranslationVerseKey(key);
                return [key, text, "translation", translationId];
            }
        );

        const combined = [...allGlobal, ...allTranslation];

        if (filter === "current" && selectedBook && selectedChapter) {
            return combined.filter(([key, , type]) => {
                if (type === "global") {
                    const [book, chapter] = key.split("_");
                    return (
                        book === selectedBook &&
                        chapter === String(selectedChapter)
                    );
                } else {
                    const { book, chapter } = parseTranslationVerseKey(key);
                    return (
                        book === selectedBook &&
                        chapter === String(selectedChapter)
                    );
                }
            });
        }

        if (filter === "general") {
            return [];
        }

        return combined;
    };

    const filteredNotes = getFilteredNotes();

    // Parse verse key (handles both global and translation keys)
    const parseNoteKey = (key, type) => {
        if (type === "translation") {
            return parseTranslationVerseKey(key);
        }
        const [book, chapter, verse] = key.split("_");
        return { book, chapter, verse, translationId: null };
    };

    // Get book name
    const getBookName = (bookId) => {
        return books[bookId]?.name || bookId;
    };

    // Delete note
    const deleteNote = (key, type) => {
        if (type === "translation") {
            const updatedNotes = { ...translationNotes };
            delete updatedNotes[key];
            setTranslationNotes(updatedNotes);
            saveTranslationNotes(updatedNotes);
        } else {
            const updatedNotes = { ...notes };
            delete updatedNotes[key];
            setNotes(updatedNotes);
            saveNotes(updatedNotes);
        }

        if (selectedVerseNote?.key === key) {
            setSelectedVerseNote(null);
            setIsEditingVersePreview(false);
            setVersePreviewDraft("");
        }
    };

    // Add general note
    const addGeneralNote = () => {
        if (!newGeneralNote.trim()) return;

        const newNote = {
            id: Date.now(),
            text: newGeneralNote.trim(),
            createdAt: new Date().toISOString(),
        };

        const updated = [newNote, ...generalNotes];
        setGeneralNotes(updated);
        saveGeneralNotes(updated);
        setNewGeneralNote("");
        setIsAddingGeneral(false);
    };

    // Delete general note
    const deleteGeneralNote = (id) => {
        const updated = generalNotes.filter((n) => n.id !== id);
        setGeneralNotes(updated);
        saveGeneralNotes(updated);

        if (selectedGeneralNote?.id === id) {
            setSelectedGeneralNote(null);
            setIsEditingGeneralPreview(false);
            setGeneralPreviewDraft("");
        }
    };

    const getGeneralNotePreviewText = (text) => {
        const trimmed = (text || "").trim();
        if (trimmed.length <= GENERAL_NOTE_PREVIEW_LIMIT) {
            return trimmed;
        }
        return `${trimmed.slice(0, GENERAL_NOTE_PREVIEW_LIMIT)} ${formatMessage(
            {
                id: "showMore",
                defaultMessage: "więcej",
            }
        )}...`;
    };

    const getVerseNotePreviewText = (text) => {
        const trimmed = (text || "").trim();
        if (trimmed.length <= VERSE_NOTE_PREVIEW_LIMIT) {
            return trimmed;
        }
        return `${trimmed.slice(0, VERSE_NOTE_PREVIEW_LIMIT)} ${formatMessage({
            id: "showMore",
            defaultMessage: "więcej",
        })}...`;
    };

    const openGeneralNotePreview = (note) => {
        setSelectedVerseNote(null);
        setIsEditingVersePreview(false);
        setVersePreviewDraft("");
        setSelectedGeneralNote(note);
        setIsEditingGeneralPreview(false);
        setGeneralPreviewDraft(note.text || "");
    };

    const closeGeneralNotePreview = () => {
        setSelectedGeneralNote(null);
        setIsEditingGeneralPreview(false);
        setGeneralPreviewDraft("");
    };

    const openVerseNotePreview = (note, startEditing = false) => {
        setSelectedGeneralNote(null);
        setIsEditingGeneralPreview(false);
        setGeneralPreviewDraft("");
        setSelectedVerseNote(note);
        setVersePreviewDraft(note.text || "");
        setIsEditingVersePreview(startEditing);
    };

    const closeVerseNotePreview = () => {
        setSelectedVerseNote(null);
        setIsEditingVersePreview(false);
        setVersePreviewDraft("");
    };

    const startEditGeneralNotePreview = () => {
        if (!selectedGeneralNote) return;
        setGeneralPreviewDraft(selectedGeneralNote.text || "");
        setIsEditingGeneralPreview(true);
    };

    const saveGeneralNoteFromPreview = () => {
        if (!selectedGeneralNote) return;
        const updatedText = generalPreviewDraft.trim();
        if (!updatedText) return;

        const updated = generalNotes.map((note) =>
            note.id === selectedGeneralNote.id
                ? {
                      ...note,
                      text: updatedText,
                      updatedAt: new Date().toISOString(),
                  }
                : note
        );

        setGeneralNotes(updated);
        saveGeneralNotes(updated);

        const refreshedSelectedNote =
            updated.find((note) => note.id === selectedGeneralNote.id) || null;
        setSelectedGeneralNote(refreshedSelectedNote);
        setIsEditingGeneralPreview(false);
    };

    const saveVerseNoteFromPreview = () => {
        if (!selectedVerseNote) return;
        const updatedText = versePreviewDraft.trim();
        if (!updatedText) return;

        if (selectedVerseNote.type === "translation") {
            const updatedNotes = {
                ...translationNotes,
                [selectedVerseNote.key]: updatedText,
            };
            setTranslationNotes(updatedNotes);
            saveTranslationNotes(updatedNotes);
        } else {
            const updatedNotes = {
                ...notes,
                [selectedVerseNote.key]: updatedText,
            };
            setNotes(updatedNotes);
            saveNotes(updatedNotes);
        }

        setSelectedVerseNote({
            ...selectedVerseNote,
            text: updatedText,
        });
        setIsEditingVersePreview(false);
    };

    // Navigate to verse
    const handleNavigate = (key, type) => {
        const { book, chapter, verse, translationId } = parseNoteKey(key, type);
        onNavigateToVerse?.(
            book,
            Number.parseInt(chapter, 10),
            Number.parseInt(verse, 10),
            translationId
        );
        onClose();
    };

    // XML Export
    const handleExportXml = () => {
        const xml = exportNotesXml();
        const date = new Date().toISOString().slice(0, 10);
        downloadFile(xml, `rbiblia-notes-${date}.xml`, "application/xml");
    };

    // XML Import
    const handleImportXml = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".xml";
        input.onchange = (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            file.text().then((text) => {
                try {
                    importNotesXml(text);
                    // Reload notes
                    setNotes(loadNotes());
                    setTranslationNotes(loadTranslationNotes());
                    setImportMessage({
                        type: "success",
                        text: formatMessage({ id: "importXmlSuccess" }),
                    });
                } catch {
                    setImportMessage({
                        type: "error",
                        text: formatMessage({ id: "importXmlError" }),
                    });
                }
            });
        };
        input.click();
    };

    return (
        <>
            {/* Overlay */}
            <button
                type="button"
                className={`notes-overlay ${isOpen ? "active" : ""}`}
                onClick={onClose}
                aria-label={formatMessage({ id: "close" })}
                tabIndex={-1}
            />

            {/* Panel */}
            <div
                ref={panelRef}
                className={`notes-panel ${isOpen ? "open" : ""}`}
            >
                <div className="notes-header">
                    <h3 className="notes-title">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        {formatMessage({ id: "notes" })}
                    </h3>
                    <div className="notes-header-actions">
                        <button
                            className="notes-add-btn"
                            onClick={() => {
                                setFilter("general");
                                setIsAddingGeneral(true);
                            }}
                            title={formatMessage({ id: "addNote" })}
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </button>
                        <button className="notes-close" onClick={onClose}>
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
                </div>

                {/* Filter tabs */}
                <div className="notes-filter">
                    <button
                        className={`notes-filter-btn ${
                            filter === "current" ? "active" : ""
                        }`}
                        onClick={() => setFilter("current")}
                    >
                        {formatMessage({ id: "currentChapter" })}
                    </button>
                    <button
                        className={`notes-filter-btn ${
                            filter === "all" ? "active" : ""
                        }`}
                        onClick={() => setFilter("all")}
                    >
                        {formatMessage({ id: "allNotes" })}
                    </button>
                    <button
                        className={`notes-filter-btn ${
                            filter === "general" ? "active" : ""
                        }`}
                        onClick={() => setFilter("general")}
                    >
                        {formatMessage({ id: "generalNotes" })}
                    </button>
                </div>

                {/* XML Export/Import bar */}
                <div className="notes-xml-bar">
                    <button
                        className="notes-xml-btn"
                        onClick={handleExportXml}
                        title={formatMessage({ id: "exportXml" })}
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        {formatMessage({ id: "exportXml" })}
                    </button>
                    <button
                        className="notes-xml-btn"
                        onClick={handleImportXml}
                        title={formatMessage({ id: "importXml" })}
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        {formatMessage({ id: "importXml" })}
                    </button>
                </div>

                {/* Import status message */}
                {importMessage && (
                    <div
                        className={`notes-import-message notes-import-${importMessage.type}`}
                    >
                        {importMessage.text}
                    </div>
                )}

                {/* Notes content */}
                <div className="notes-content">
                    {/* General notes section */}
                    {filter === "general" && (
                        <>
                            {/* Add new general note form */}
                            {isAddingGeneral && (
                                <div className="note-item note-add-form">
                                    <textarea
                                        className="note-textarea"
                                        value={newGeneralNote}
                                        onChange={(e) =>
                                            setNewGeneralNote(e.target.value)
                                        }
                                        placeholder={formatMessage({
                                            id: "writeNote",
                                        })}
                                        autoFocus
                                        rows={3}
                                    />
                                    <div className="note-edit-actions">
                                        <button
                                            className="note-edit-btn note-edit-cancel"
                                            onClick={() => {
                                                setIsAddingGeneral(false);
                                                setNewGeneralNote("");
                                            }}
                                        >
                                            {formatMessage({ id: "cancel" })}
                                        </button>
                                        <button
                                            className="note-edit-btn note-edit-save"
                                            onClick={addGeneralNote}
                                        >
                                            {formatMessage({ id: "save" })}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {generalNotes.length === 0 && !isAddingGeneral ? (
                                <div className="notes-empty">
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                    >
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                        <polyline points="14 2 14 8 20 8"></polyline>
                                        <line
                                            x1="16"
                                            y1="13"
                                            x2="8"
                                            y2="13"
                                        ></line>
                                        <line
                                            x1="16"
                                            y1="17"
                                            x2="8"
                                            y2="17"
                                        ></line>
                                    </svg>
                                    <p>
                                        {formatMessage({
                                            id: "noGeneralNotes",
                                        })}
                                    </p>
                                    <button
                                        className="notes-empty-add-btn"
                                        onClick={() => setIsAddingGeneral(true)}
                                    >
                                        {formatMessage({ id: "addNote" })}
                                    </button>
                                </div>
                            ) : (
                                <ul className="notes-list">
                                    {generalNotes.map((note) => (
                                        <li // NOSONAR
                                            key={note.id}
                                            className="note-item general-note-item"
                                            onClick={() =>
                                                openGeneralNotePreview(note)
                                            }
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (
                                                    e.target !== e.currentTarget
                                                ) {
                                                    return;
                                                }
                                                if (
                                                    e.key === "Enter" ||
                                                    e.key === " "
                                                ) {
                                                    e.preventDefault();
                                                    openGeneralNotePreview(
                                                        note
                                                    );
                                                }
                                            }}
                                        >
                                            <div className="note-header">
                                                <span className="note-date">
                                                    {new Date(
                                                        note.createdAt
                                                    ).toLocaleDateString()}
                                                </span>
                                                <button
                                                    className="note-action-btn note-action-delete"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteGeneralNote(
                                                            note.id
                                                        );
                                                    }}
                                                    title={formatMessage({
                                                        id: "delete",
                                                    })}
                                                >
                                                    <svg
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                    >
                                                        <polyline points="3 6 5 6 21 6"></polyline>
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                    </svg>
                                                </button>
                                            </div>
                                            <p className="note-text">
                                                {getGeneralNotePreviewText(
                                                    note.text
                                                )}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </>
                    )}

                    {/* Verse notes (global + translation-specific) */}
                    {filter !== "general" && (
                        <>
                            {filteredNotes.length === 0 ? (
                                <div className="notes-empty">
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                    >
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                        <polyline points="14 2 14 8 20 8"></polyline>
                                        <line
                                            x1="16"
                                            y1="13"
                                            x2="8"
                                            y2="13"
                                        ></line>
                                        <line
                                            x1="16"
                                            y1="17"
                                            x2="8"
                                            y2="17"
                                        ></line>
                                        <polyline points="10 9 9 9 8 9"></polyline>
                                    </svg>
                                    <p>{formatMessage({ id: "noNotes" })}</p>
                                    <span className="notes-empty-hint">
                                        {formatMessage({ id: "noNotesHint" })}
                                    </span>
                                </div>
                            ) : (
                                <ul className="notes-list">
                                    {filteredNotes.map(
                                        ([key, text, type, translationId]) => {
                                            const { book, chapter, verse } =
                                                parseNoteKey(key, type);
                                            const verseNote = {
                                                key,
                                                text,
                                                type,
                                                translationId,
                                                book,
                                                chapter,
                                                verse,
                                            };

                                            return (
                                                <li // NOSONAR
                                                    key={key}
                                                    className="note-item verse-note-item"
                                                    onClick={() =>
                                                        openVerseNotePreview(
                                                            verseNote
                                                        )
                                                    }
                                                    role="button"
                                                    tabIndex={0}
                                                    onKeyDown={(e) => {
                                                        if (
                                                            e.target !==
                                                            e.currentTarget
                                                        ) {
                                                            return;
                                                        }
                                                        if (
                                                            e.key === "Enter" ||
                                                            e.key === " "
                                                        ) {
                                                            e.preventDefault();
                                                            openVerseNotePreview(
                                                                verseNote
                                                            );
                                                        }
                                                    }}
                                                >
                                                    <div className="note-header">
                                                        <div className="note-header-left">
                                                            <button
                                                                className="note-reference"
                                                                onClick={(
                                                                    e
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    handleNavigate(
                                                                        key,
                                                                        type
                                                                    );
                                                                }}
                                                            >
                                                                {getBookName(
                                                                    book
                                                                )}{" "}
                                                                {chapter}:
                                                                {verse}
                                                            </button>
                                                            <span
                                                                className={`note-type-badge ${
                                                                    type ===
                                                                    "translation"
                                                                        ? "note-type-translation"
                                                                        : "note-type-global"
                                                                }`}
                                                            >
                                                                {type ===
                                                                "translation"
                                                                    ? getTranslationName(
                                                                          translationId
                                                                      )
                                                                    : formatMessage(
                                                                          {
                                                                              id: "noteGlobal",
                                                                          }
                                                                      )}
                                                            </span>
                                                        </div>
                                                        <div className="note-actions">
                                                            <button
                                                                className="note-action-btn"
                                                                onClick={(
                                                                    e
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    openVerseNotePreview(
                                                                        verseNote,
                                                                        true
                                                                    );
                                                                }}
                                                                title={formatMessage(
                                                                    {
                                                                        id: "edit",
                                                                    }
                                                                )}
                                                            >
                                                                <svg
                                                                    viewBox="0 0 24 24"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    strokeWidth="2"
                                                                >
                                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                                </svg>
                                                            </button>
                                                            <button
                                                                className="note-action-btn note-action-delete"
                                                                onClick={(
                                                                    e
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    deleteNote(
                                                                        key,
                                                                        type
                                                                    );
                                                                }}
                                                                title={formatMessage(
                                                                    {
                                                                        id: "delete",
                                                                    }
                                                                )}
                                                            >
                                                                <svg
                                                                    viewBox="0 0 24 24"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    strokeWidth="2"
                                                                >
                                                                    <polyline points="3 6 5 6 21 6"></polyline>
                                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <p className="note-text">
                                                        {getVerseNotePreviewText(
                                                            text
                                                        )}
                                                    </p>
                                                </li>
                                            );
                                        }
                                    )}
                                </ul>
                            )}
                        </>
                    )}
                </div>
            </div>

            {isOpen && selectedGeneralNote && (
                <div
                    className="general-note-preview-overlay"
                    onClick={closeGeneralNotePreview}
                    aria-hidden="true"
                    onKeyDown={(e) => {
                        if (e.key === "Escape") closeGeneralNotePreview();
                    }}
                >
                    <div // NOSONAR
                        className="general-note-preview-modal"
                        role="dialog"
                        aria-modal="true"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                            if (e.key === "Escape") closeGeneralNotePreview();
                        }}
                    >
                        <div className="general-note-preview-header">
                            <h4 className="general-note-preview-title">
                                {formatMessage({ id: "generalNotes" })}
                            </h4>
                            <button
                                className="notes-close general-note-preview-close"
                                onClick={closeGeneralNotePreview}
                                title={formatMessage({ id: "close" })}
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
                        </div>
                        <div className="general-note-preview-body">
                            <span className="note-date">
                                {new Date(
                                    selectedGeneralNote.createdAt
                                ).toLocaleDateString()}
                            </span>
                            {isEditingGeneralPreview ? (
                                <textarea
                                    className="note-textarea general-note-preview-textarea"
                                    value={generalPreviewDraft}
                                    onChange={(e) =>
                                        setGeneralPreviewDraft(e.target.value)
                                    }
                                    autoFocus
                                    rows={6}
                                />
                            ) : (
                                <p className="note-text general-note-preview-text">
                                    {selectedGeneralNote.text}
                                </p>
                            )}
                        </div>
                        <div className="note-edit-actions general-note-preview-actions">
                            {isEditingGeneralPreview ? (
                                <>
                                    <button
                                        className="note-edit-btn note-edit-cancel"
                                        onClick={() => {
                                            setIsEditingGeneralPreview(false);
                                            setGeneralPreviewDraft(
                                                selectedGeneralNote.text || ""
                                            );
                                        }}
                                    >
                                        {formatMessage({ id: "cancel" })}
                                    </button>
                                    <button
                                        className="note-edit-btn note-edit-save"
                                        onClick={saveGeneralNoteFromPreview}
                                        disabled={!generalPreviewDraft.trim()}
                                    >
                                        {formatMessage({ id: "save" })}
                                    </button>
                                </>
                            ) : (
                                <button
                                    className="note-edit-btn note-edit-save"
                                    onClick={startEditGeneralNotePreview}
                                >
                                    {formatMessage({ id: "edit" })}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isOpen && selectedVerseNote && (
                <div
                    className="general-note-preview-overlay"
                    onClick={closeVerseNotePreview}
                    aria-hidden="true"
                    onKeyDown={(e) => {
                        if (e.key === "Escape") closeVerseNotePreview();
                    }}
                >
                    <div // NOSONAR
                        className="general-note-preview-modal"
                        role="dialog"
                        aria-modal="true"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                            if (e.key === "Escape") closeVerseNotePreview();
                        }}
                    >
                        <div className="general-note-preview-header">
                            <h4 className="general-note-preview-title">
                                {formatMessage({ id: "noteFor" })}{" "}
                                {getBookName(selectedVerseNote.book)}{" "}
                                {selectedVerseNote.chapter}:
                                {selectedVerseNote.verse}
                            </h4>
                            <button
                                className="notes-close general-note-preview-close"
                                onClick={closeVerseNotePreview}
                                title={formatMessage({ id: "close" })}
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
                        </div>
                        <div className="general-note-preview-body">
                            <span
                                className={`note-type-badge ${
                                    selectedVerseNote.type === "translation"
                                        ? "note-type-translation"
                                        : "note-type-global"
                                }`}
                            >
                                {selectedVerseNote.type === "translation"
                                    ? getTranslationName(
                                          selectedVerseNote.translationId
                                      )
                                    : formatMessage({
                                          id: "noteGlobal",
                                      })}
                            </span>
                            {isEditingVersePreview ? (
                                <textarea
                                    className="note-textarea general-note-preview-textarea"
                                    value={versePreviewDraft}
                                    onChange={(e) =>
                                        setVersePreviewDraft(e.target.value)
                                    }
                                    autoFocus
                                    rows={6}
                                />
                            ) : (
                                <p className="note-text general-note-preview-text">
                                    {selectedVerseNote.text}
                                </p>
                            )}
                        </div>
                        <div className="note-edit-actions general-note-preview-actions">
                            {isEditingVersePreview ? (
                                <>
                                    <button
                                        className="note-edit-btn note-edit-cancel"
                                        onClick={() => {
                                            setIsEditingVersePreview(false);
                                            setVersePreviewDraft(
                                                selectedVerseNote.text || ""
                                            );
                                        }}
                                    >
                                        {formatMessage({ id: "cancel" })}
                                    </button>
                                    <button
                                        className="note-edit-btn note-edit-save"
                                        onClick={saveVerseNoteFromPreview}
                                        disabled={!versePreviewDraft.trim()}
                                    >
                                        {formatMessage({ id: "save" })}
                                    </button>
                                </>
                            ) : (
                                <button
                                    className="note-edit-btn note-edit-save"
                                    onClick={() =>
                                        openVerseNotePreview(
                                            selectedVerseNote,
                                            true
                                        )
                                    }
                                >
                                    {formatMessage({ id: "edit" })}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

NotesPanel.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    selectedBook: PropTypes.string,
    selectedChapter: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    selectedTranslation: PropTypes.string,
    translations: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
        })
    ),
    books: PropTypes.objectOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
        })
    ).isRequired,
    onNavigateToVerse: PropTypes.func.isRequired,
};

/**
 * Note Editor Modal - for adding/editing a note on a specific verse
 * Now supports both global and translation-specific notes via tabs
 */
const NoteEditor = ({
    isOpen,
    onClose,
    onSave,
    book,
    chapter,
    verse,
    bookName,
    translationId,
    translationName,
}) => {
    const { formatMessage } = useIntl();
    const [globalText, setGlobalText] = useState("");
    const [translationText, setTranslationText] = useState("");
    const [activeTab, setActiveTab] = useState("global"); // "global" | "translation"
    const verseKey = getVerseKey(book, chapter, verse);
    const translationVerseKey = translationId
        ? getTranslationVerseKey(translationId, book, chapter, verse)
        : null;

    // Focus trap for keyboard navigation
    const modalRef = useFocusTrap(isOpen, onClose);

    // Load existing notes
    useEffect(() => {
        if (isOpen) {
            const notes = loadNotes();
            setGlobalText(notes[verseKey] || "");

            if (translationVerseKey) {
                const tNotes = loadTranslationNotes();
                setTranslationText(tNotes[translationVerseKey] || "");
            }
        }
    }, [isOpen, verseKey, translationVerseKey]);

    // Save note
    const handleSave = () => {
        // Save global note
        const notes = loadNotes();
        if (globalText.trim()) {
            notes[verseKey] = globalText.trim();
        } else {
            delete notes[verseKey];
        }
        saveNotes(notes);

        // Save translation-specific note
        if (translationVerseKey) {
            const tNotes = loadTranslationNotes();
            if (translationText.trim()) {
                tNotes[translationVerseKey] = translationText.trim();
            } else {
                delete tNotes[translationVerseKey];
            }
            saveTranslationNotes(tNotes);
        }

        onSave?.(); // Notify parent to refresh indicators
        onClose();
    };

    const displayTranslationName = translationName || translationId || "";

    return (
        <>
            <button
                type="button"
                className={`note-editor-overlay ${isOpen ? "active" : ""}`}
                onClick={onClose}
                aria-label={formatMessage({ id: "close" })}
                tabIndex={-1}
            />
            <div
                ref={modalRef}
                className={`note-editor-modal ${isOpen ? "open" : ""}`}
            >
                <div className="note-editor-header">
                    <h4 className="note-editor-title">
                        {formatMessage({ id: "noteFor" })} {bookName} {chapter}:
                        {verse}
                    </h4>
                    <button className="note-editor-close" onClick={onClose}>
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

                {/* Tabs for global vs translation note */}
                <div className="note-editor-tabs">
                    <button
                        className={`note-editor-tab ${
                            activeTab === "global" ? "active" : ""
                        }`}
                        onClick={() => setActiveTab("global")}
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="2" y1="12" x2="22" y2="12"></line>
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                        </svg>
                        {formatMessage({ id: "noteGlobal" })}
                        {globalText.trim() && (
                            <span className="note-editor-tab-dot" />
                        )}
                    </button>
                    {translationId && (
                        <button
                            className={`note-editor-tab ${
                                activeTab === "translation" ? "active" : ""
                            }`}
                            onClick={() => setActiveTab("translation")}
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                            </svg>
                            {formatMessage({ id: "translationNote" })}
                            {translationText.trim() && (
                                <span className="note-editor-tab-dot" />
                            )}
                        </button>
                    )}
                </div>

                {/* Tab content */}
                {activeTab === "global" ? (
                    <textarea
                        className="note-editor-textarea"
                        value={globalText}
                        onChange={(e) => setGlobalText(e.target.value)}
                        placeholder={formatMessage({ id: "writeNote" })}
                        autoFocus
                        rows={5}
                    />
                ) : (
                    <textarea
                        className="note-editor-textarea"
                        value={translationText}
                        onChange={(e) => setTranslationText(e.target.value)}
                        placeholder={formatMessage(
                            { id: "noteForTranslation" },
                            { translation: displayTranslationName }
                        )}
                        autoFocus
                        rows={5}
                    />
                )}

                <div className="note-editor-actions">
                    <button
                        className="note-editor-btn note-editor-cancel"
                        onClick={onClose}
                    >
                        {formatMessage({ id: "cancel" })}
                    </button>
                    <button
                        className="note-editor-btn note-editor-save"
                        onClick={handleSave}
                    >
                        {formatMessage({ id: "save" })}
                    </button>
                </div>
            </div>
        </>
    );
};

NoteEditor.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    book: PropTypes.string,
    chapter: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    verse: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    bookName: PropTypes.string,
    translationId: PropTypes.string,
    translationName: PropTypes.string,
};

/**
 * Hook to check if a verse has a note
 */
const useHasNote = (book, chapter, verse) => {
    const [hasNote, setHasNote] = useState(false);

    useEffect(() => {
        const notes = loadNotes();
        const key = getVerseKey(book, chapter, verse);
        setHasNote(!!notes[key]);
    }, [book, chapter, verse]);

    return hasNote;
};

export {
    NotesPanel,
    NoteEditor,
    useHasNote,
    loadNotes,
    saveNotes,
    getVerseKey,
    loadTranslationNotes,
    saveTranslationNotes,
    getTranslationVerseKey,
    parseTranslationVerseKey,
    exportNotesXml,
    importNotesXml,
};
