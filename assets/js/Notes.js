import React, { useState, useEffect } from "react";
import { useIntl } from "react-intl";
import useFocusTrap from "./hooks/useFocusTrap";

const NOTES_STORAGE_KEY = "rbiblia_notes";
const GENERAL_NOTES_KEY = "rbiblia_general_notes";

/**
 * Get verse key for storage
 */
const getVerseKey = (book, chapter, verse) => `${book}_${chapter}_${verse}`;

/**
 * Load all notes from localStorage
 */
const loadNotes = () => {
    try {
        const saved = localStorage.getItem(NOTES_STORAGE_KEY);
        return saved ? JSON.parse(saved) : {};
    } catch {
        return {};
    }
};

/**
 * Save all notes to localStorage
 */
const saveNotes = (notes) => {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
};

/**
 * Load general notes (not bound to verses)
 */
const loadGeneralNotes = () => {
    try {
        const saved = localStorage.getItem(GENERAL_NOTES_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
};

/**
 * Save general notes
 */
const saveGeneralNotes = (notes) => {
    localStorage.setItem(GENERAL_NOTES_KEY, JSON.stringify(notes));
};

/**
 * Notes Panel - displays all notes or notes for current chapter
 */
const NotesPanel = ({
    isOpen,
    onClose,
    selectedBook,
    selectedChapter,
    books,
    onNavigateToVerse,
}) => {
    const { formatMessage } = useIntl();
    const [notes, setNotes] = useState({});
    const [generalNotes, setGeneralNotes] = useState([]);
    const [filter, setFilter] = useState("current"); // "current" | "all" | "general"
    const [editingNote, setEditingNote] = useState(null);
    const [editText, setEditText] = useState("");
    const [isAddingGeneral, setIsAddingGeneral] = useState(false);
    const [newGeneralNote, setNewGeneralNote] = useState("");

    // Focus trap for keyboard navigation
    const panelRef = useFocusTrap(isOpen, onClose);

    // Load notes on mount
    useEffect(() => {
        if (isOpen) {
            setNotes(loadNotes());
            setGeneralNotes(loadGeneralNotes());
        }
    }, [isOpen]);

    // Get filtered notes
    const getFilteredNotes = () => {
        const allNotes = Object.entries(notes);

        if (filter === "current" && selectedBook && selectedChapter) {
            return allNotes.filter(([key]) => {
                const [book, chapter] = key.split("_");
                return (
                    book === selectedBook && chapter === String(selectedChapter)
                );
            });
        }

        if (filter === "general") {
            return [];
        }

        return allNotes;
    };

    const filteredNotes = getFilteredNotes();

    // Parse verse key
    const parseVerseKey = (key) => {
        const [book, chapter, verse] = key.split("_");
        return { book, chapter, verse };
    };

    // Get book name
    const getBookName = (bookId) => {
        return books[bookId]?.name || bookId;
    };

    // Start editing
    const startEdit = (key, text) => {
        setEditingNote(key);
        setEditText(text);
    };

    // Save edit
    const saveEdit = () => {
        if (!editingNote) return;

        const updatedNotes = { ...notes };
        if (editText.trim()) {
            updatedNotes[editingNote] = editText.trim();
        } else {
            delete updatedNotes[editingNote];
        }

        setNotes(updatedNotes);
        saveNotes(updatedNotes);
        setEditingNote(null);
        setEditText("");
    };

    // Delete note
    const deleteNote = (key) => {
        const updatedNotes = { ...notes };
        delete updatedNotes[key];
        setNotes(updatedNotes);
        saveNotes(updatedNotes);
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
    };

    // Navigate to verse
    const handleNavigate = (key) => {
        const { book, chapter, verse } = parseVerseKey(key);
        onNavigateToVerse?.(book, parseInt(chapter), parseInt(verse));
        onClose();
    };

    return (
        <>
            {/* Overlay */}
            <div
                className={`notes-overlay ${isOpen ? "active" : ""}`}
                onClick={onClose}
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
                                        <li key={note.id} className="note-item">
                                            <div className="note-header">
                                                <span className="note-date">
                                                    {new Date(
                                                        note.createdAt
                                                    ).toLocaleDateString()}
                                                </span>
                                                <button
                                                    className="note-action-btn note-action-delete"
                                                    onClick={() =>
                                                        deleteGeneralNote(
                                                            note.id
                                                        )
                                                    }
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
                                                {note.text}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </>
                    )}

                    {/* Verse notes */}
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
                                    {filteredNotes.map(([key, text]) => {
                                        const { book, chapter, verse } =
                                            parseVerseKey(key);
                                        const isEditing = editingNote === key;

                                        return (
                                            <li key={key} className="note-item">
                                                <div className="note-header">
                                                    <button
                                                        className="note-reference"
                                                        onClick={() =>
                                                            handleNavigate(key)
                                                        }
                                                    >
                                                        {getBookName(book)}{" "}
                                                        {chapter}:{verse}
                                                    </button>
                                                    <div className="note-actions">
                                                        {!isEditing && (
                                                            <>
                                                                <button
                                                                    className="note-action-btn"
                                                                    onClick={() =>
                                                                        startEdit(
                                                                            key,
                                                                            text
                                                                        )
                                                                    }
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
                                                                    onClick={() =>
                                                                        deleteNote(
                                                                            key
                                                                        )
                                                                    }
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
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {isEditing ? (
                                                    <div className="note-edit">
                                                        <textarea
                                                            className="note-textarea"
                                                            value={editText}
                                                            onChange={(e) =>
                                                                setEditText(
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            autoFocus
                                                            rows={3}
                                                        />
                                                        <div className="note-edit-actions">
                                                            <button
                                                                className="note-edit-btn note-edit-cancel"
                                                                onClick={() =>
                                                                    setEditingNote(
                                                                        null
                                                                    )
                                                                }
                                                            >
                                                                {formatMessage({
                                                                    id: "cancel",
                                                                })}
                                                            </button>
                                                            <button
                                                                className="note-edit-btn note-edit-save"
                                                                onClick={
                                                                    saveEdit
                                                                }
                                                            >
                                                                {formatMessage({
                                                                    id: "save",
                                                                })}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="note-text">
                                                        {text}
                                                    </p>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

/**
 * Note Editor Modal - for adding/editing a note on a specific verse
 */
const NoteEditor = ({
    isOpen,
    onClose,
    onSave,
    book,
    chapter,
    verse,
    bookName,
}) => {
    const { formatMessage } = useIntl();
    const [text, setText] = useState("");
    const verseKey = getVerseKey(book, chapter, verse);

    // Focus trap for keyboard navigation
    const modalRef = useFocusTrap(isOpen, onClose);

    // Load existing note
    useEffect(() => {
        if (isOpen) {
            const notes = loadNotes();
            setText(notes[verseKey] || "");
        }
    }, [isOpen, verseKey]);

    // Save note
    const handleSave = () => {
        const notes = loadNotes();

        if (text.trim()) {
            notes[verseKey] = text.trim();
        } else {
            delete notes[verseKey];
        }

        saveNotes(notes);
        onSave?.(); // Notify parent to refresh indicators
        onClose();
    };

    return (
        <>
            <div
                className={`note-editor-overlay ${isOpen ? "active" : ""}`}
                onClick={onClose}
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
                <textarea
                    className="note-editor-textarea"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={formatMessage({ id: "writeNote" })}
                    autoFocus
                    rows={5}
                />
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
};
