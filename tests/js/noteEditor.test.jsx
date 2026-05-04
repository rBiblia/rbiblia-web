import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { NoteEditor, saveNotes, saveTranslationNotes } from '../../assets/js/Notes';

vi.mock('../../assets/js/hooks/useFocusTrap', () => ({
    default: vi.fn().mockReturnValue({ current: null })
}));

const messages = {
    noteFor: 'Note for',
    close: 'Close',
    noteGlobal: 'Global note',
    translationNote: 'Translation note',
    writeNote: 'Write a note...',
    noteForTranslation: 'Note for {translation}',
    cancel: 'Cancel',
    save: 'Save'
};

const renderWithIntl = (ui) => {
    return render(
        <IntlProvider locale="en" messages={messages}>
            {ui}
        </IntlProvider>
    );
};

describe('NoteEditor', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        onSave: vi.fn(),
        book: 'gen',
        chapter: '1',
        verse: '1',
        bookName: 'Genesis',
        translationId: 'en_kjv',
        translationName: 'King James Version'
    };

    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders title with book name, chapter, and verse', () => {
        renderWithIntl(<NoteEditor {...defaultProps} />);
        expect(screen.getByText('Note for Genesis 1:1')).toBeTruthy();
    });

    it('loads existing global note from localStorage on mount', () => {
        saveNotes({ 'gen_1_1': 'Existing global note' });
        renderWithIntl(<NoteEditor {...defaultProps} />);
        
        const textarea = screen.getByPlaceholderText('Write a note...');
        expect(textarea.value).toBe('Existing global note');
    });

    it('loads existing translation note when switching to translation tab', () => {
        saveTranslationNotes({ 'en_kjv:gen_1_1': 'Existing translation note' });
        renderWithIntl(<NoteEditor {...defaultProps} />);
        
        // Switch to translation tab
        fireEvent.click(screen.getByText('Translation note'));
        
        const textarea = screen.getByPlaceholderText('Note for King James Version');
        expect(textarea.value).toBe('Existing translation note');
    });

    it('saves new global note and calls onSave + onClose', () => {
        renderWithIntl(<NoteEditor {...defaultProps} />);
        
        const textarea = screen.getByPlaceholderText('Write a note...');
        fireEvent.change(textarea, { target: { value: 'My new global note' } });
        
        fireEvent.click(screen.getByText('Save'));
        
        expect(defaultProps.onSave).toHaveBeenCalled();
        expect(defaultProps.onClose).toHaveBeenCalled();
        expect(JSON.parse(localStorage.getItem('rbiblia_notes'))['gen_1_1']).toBe('My new global note');
    });

    it('saves translation note to separate localStorage key', () => {
        renderWithIntl(<NoteEditor {...defaultProps} />);
        
        // Switch to translation tab
        fireEvent.click(screen.getByText('Translation note'));
        
        const textarea = screen.getByPlaceholderText('Note for King James Version');
        fireEvent.change(textarea, { target: { value: 'My new translation note' } });
        
        fireEvent.click(screen.getByText('Save'));
        
        expect(defaultProps.onSave).toHaveBeenCalled();
        expect(defaultProps.onClose).toHaveBeenCalled();
        expect(JSON.parse(localStorage.getItem('rbiblia_translation_notes'))['en_kjv:gen_1_1']).toBe('My new translation note');
    });

    it('deletes note when saved with empty text', () => {
        saveNotes({ 'gen_1_1': 'Existing global note' });
        renderWithIntl(<NoteEditor {...defaultProps} />);
        
        const textarea = screen.getByPlaceholderText('Write a note...');
        fireEvent.change(textarea, { target: { value: '   ' } }); // Empty after trim
        
        fireEvent.click(screen.getByText('Save'));
        
        const stored = JSON.parse(localStorage.getItem('rbiblia_notes'));
        expect(stored['gen_1_1']).toBeUndefined();
    });

    it('calls onClose without saving when clicking Cancel', () => {
        renderWithIntl(<NoteEditor {...defaultProps} />);
        
        const textarea = screen.getByPlaceholderText('Write a note...');
        fireEvent.change(textarea, { target: { value: 'Unsaved note' } });
        
        fireEvent.click(screen.getByText('Cancel'));
        
        expect(defaultProps.onClose).toHaveBeenCalled();
        expect(defaultProps.onSave).not.toHaveBeenCalled();
        expect(localStorage.getItem('rbiblia_notes')).toBeNull(); // Nothing saved
    });

    it('switching tabs changes the visible textarea placeholder', () => {
        renderWithIntl(<NoteEditor {...defaultProps} />);
        
        // Starts on global tab
        expect(screen.getByPlaceholderText('Write a note...')).toBeTruthy();
        expect(screen.queryByPlaceholderText('Note for King James Version')).toBeNull();
        
        // Switch to translation tab
        fireEvent.click(screen.getByText('Translation note'));
        
        expect(screen.queryByPlaceholderText('Write a note...')).toBeNull();
        expect(screen.getByPlaceholderText('Note for King James Version')).toBeTruthy();
    });
});
