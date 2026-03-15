/**
 * One-time migration of notes from the legacy NotesSidePanel format
 * to the unified Notes.js format.
 *
 * Legacy format:
 *   - `note_chapter_{bookId}_{chapterId}` → chapter-level note (string)
 *   - `note_verse_{bookId}_{chapterId}_{verseId}` → individual verse note (string)
 *
 * Unified format (Notes.js):
 *   - `rbiblia_notes` → { "bookId_chapterId_verseId": "text", ... }
 *   - `rbiblia_general_notes` → [ { id, text, createdAt }, ... ]
 *
 * Chapter-level notes become general notes with a reference in the text.
 * Verse-level notes are merged into `rbiblia_notes`.
 *
 * This migration runs once and sets a flag so it doesn't run again.
 */

import {
    safeLocalStorageGetItem,
    safeLocalStorageKey,
    safeLocalStorageLength,
    safeLocalStorageRemoveItem,
    safeLocalStorageSetItem,
} from "./safeStorage";

const MIGRATION_FLAG = "rbiblia_notes_migrated";

const migrateOldNotes = () => {
    // Already migrated
    if (safeLocalStorageGetItem(MIGRATION_FLAG)) {
        return;
    }

    let hasLegacy = false;

    // Collect all legacy keys
    const legacyChapterNotes = [];
    const legacyVerseNotes = [];

    const storageLength = safeLocalStorageLength();
    for (let i = 0; i < storageLength; i++) {
        const key = safeLocalStorageKey(i);
        if (key && key.startsWith("note_chapter_")) {
            legacyChapterNotes.push(key);
            hasLegacy = true;
        } else if (key && key.startsWith("note_verse_")) {
            legacyVerseNotes.push(key);
            hasLegacy = true;
        }
    }

    if (!hasLegacy) {
        safeLocalStorageSetItem(MIGRATION_FLAG, "1");
        return;
    }

    try {
        // Load existing unified notes
        const existingNotes = JSON.parse(
            safeLocalStorageGetItem("rbiblia_notes") || "{}"
        );
        const existingGeneral = JSON.parse(
            safeLocalStorageGetItem("rbiblia_general_notes") || "[]"
        );

        // Migrate verse notes → rbiblia_notes
        for (const key of legacyVerseNotes) {
            const text = safeLocalStorageGetItem(key);
            if (!text || !text.trim()) continue;

            // Parse key: "note_verse_{bookId}_{chapterId}_{verseId}"
            const match = key.match(/^note_verse_([a-z0-9]+)_(\d+)_(\d+)$/);
            if (!match) continue;

            const [, bookId, chapterId, verseId] = match;
            const unifiedKey = `${bookId}_${chapterId}_${verseId}`;

            // Only migrate if not already overwritten in the unified system
            if (!existingNotes[unifiedKey]) {
                existingNotes[unifiedKey] = text.trim();
            }
        }

        // Migrate chapter notes → general notes (with reference in text)
        for (const key of legacyChapterNotes) {
            const text = safeLocalStorageGetItem(key);
            if (!text || !text.trim()) continue;

            // Parse key: "note_chapter_{bookId}_{chapterId}"
            const match = key.match(/^note_chapter_([a-z0-9]+)_(\d+)$/);
            if (!match) continue;

            const [, bookId, chapterId] = match;

            // Create a general note with a reference
            const generalNote = {
                id: Date.now() + Math.random(),
                text: `[${bookId} ${chapterId}] ${text.trim()}`,
                createdAt: new Date().toISOString(),
            };
            existingGeneral.unshift(generalNote);
        }

        // Save migrated data
        safeLocalStorageSetItem("rbiblia_notes", JSON.stringify(existingNotes));
        safeLocalStorageSetItem(
            "rbiblia_general_notes",
            JSON.stringify(existingGeneral)
        );

        // Clean up legacy keys
        for (const key of [...legacyChapterNotes, ...legacyVerseNotes]) {
            safeLocalStorageRemoveItem(key);
        }

        // Set migration flag
        safeLocalStorageSetItem(MIGRATION_FLAG, "1");

        console.log(
            `[rBiblia] Migrated ${legacyVerseNotes.length} verse notes and ${legacyChapterNotes.length} chapter notes to unified format.`
        );
    } catch (err) {
        console.error("[rBiblia] Notes migration failed:", err);
        // Set flag anyway to avoid repeated failures
        safeLocalStorageSetItem(MIGRATION_FLAG, "1");
    }
};

export default migrateOldNotes;
