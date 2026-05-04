import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { NotesPanel, NoteEditor, useHasNote, saveNotes, saveTranslationNotes, saveGeneralNotes, exportNotesXml, importNotesXml } from '../../assets/js/Notes';

vi.mock('../../assets/js/hooks/useFocusTrap', () => ({
    default: vi.fn().mockReturnValue({ current: null })
}));

const messages = {
    notes: 'Notes',
    close: 'Close',
    addNote: 'Add Note',
    currentChapter: 'Current Chapter',
    allNotes: 'All Notes',
    generalNotes: 'General Notes',
    noNotes: 'No notes here',
    noNotesHint: 'Add a note to see it here',
    noGeneralNotes: 'No general notes',
    writeNote: 'Write a note...',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    noteGlobal: 'Global',
    noteFor: 'Note for',
    exportXml: 'Export XML',
    importXml: 'Import XML',
    translationNote: 'Translation Note',
    noteForTranslation: 'Write a translation note...'
};

const renderWithIntl = (ui) => {
    return render(
        <IntlProvider locale="en" messages={messages}>
            {ui}
        </IntlProvider>
    );
};

describe('NotesPanel', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        selectedBook: 'gen',
        selectedChapter: '1',
        selectedTranslation: 'en_kjv',
        translations: [
            { id: 'en_kjv', name: 'King James Version' },
            { id: 'pl_bb', name: 'Biblia Brzeska' }
        ],
        books: {
            'gen': { name: 'Genesis' },
            'exo': { name: 'Exodus' }
        },
        onNavigateToVerse: vi.fn()
    };

    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders panel with Notes header when isOpen is true', () => {
        renderWithIntl(<NotesPanel {...defaultProps} />);
        expect(screen.getByText('Notes')).toBeTruthy();
        expect(screen.getByText('Current Chapter')).toBeTruthy();
        expect(screen.getByText('All Notes')).toBeTruthy();
        expect(screen.getByText('General Notes')).toBeTruthy();
    });

    it('displays noNotes message when there are no notes for current chapter', () => {
        renderWithIntl(<NotesPanel {...defaultProps} />);
        expect(screen.getByText('No notes here')).toBeTruthy();
        expect(screen.getByText('Add a note to see it here')).toBeTruthy();
    });

    it('displays notes filtered by current chapter', () => {
        saveNotes({
            'gen_1_1': 'Genesis 1:1 global note',
            'gen_2_1': 'Genesis 2:1 global note' // Different chapter
        });
        saveTranslationNotes({
            'en_kjv:gen_1_2': 'Genesis 1:2 translation note'
        });

        renderWithIntl(<NotesPanel {...defaultProps} />);
        
        expect(screen.getByText('Genesis 1:1 global note')).toBeTruthy();
        expect(screen.getByText('Genesis 1:2 translation note')).toBeTruthy();
        expect(screen.queryByText('Genesis 2:1 global note')).toBeNull();
    });

    it('switching to filter=all shows all notes across chapters and books', () => {
        saveNotes({
            'gen_1_1': 'Genesis 1:1 global note',
            'exo_5_1': 'Exodus 5:1 global note' // Different book
        });

        renderWithIntl(<NotesPanel {...defaultProps} />);
        
        // Initially 'exo' note is hidden
        expect(screen.queryByText('Exodus 5:1 global note')).toBeNull();

        // Switch to all notes
        fireEvent.click(screen.getByText('All Notes'));
        
        expect(screen.getByText('Genesis 1:1 global note')).toBeTruthy();
        expect(screen.getByText('Exodus 5:1 global note')).toBeTruthy();
    });

    it('switching to filter=general shows general notes', () => {
        saveGeneralNotes([
            { id: 1, text: 'This is a general note', createdAt: new Date().toISOString() }
        ]);

        renderWithIntl(<NotesPanel {...defaultProps} />);
        
        // Switch to general notes
        fireEvent.click(screen.getByText('General Notes'));
        
        expect(screen.getByText('This is a general note')).toBeTruthy();
    });

    it('clicking on a verse reference calls onNavigateToVerse', () => {
        saveNotes({ 'gen_1_1': 'Genesis 1:1 note' });
        renderWithIntl(<NotesPanel {...defaultProps} />);
        
        // Click the reference button (Genesis 1:1)
        fireEvent.click(screen.getByText('Genesis 1:1'));
        
        expect(defaultProps.onNavigateToVerse).toHaveBeenCalledWith('gen', 1, 1, null);
        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('clicking delete button removes note from localStorage', () => {
        saveNotes({ 'gen_1_1': 'Note to be deleted' });
        renderWithIntl(<NotesPanel {...defaultProps} />);
        
        expect(screen.getByText('Note to be deleted')).toBeTruthy();
        
        // Click delete button
        const deleteBtn = screen.getByTitle('Delete');
        fireEvent.click(deleteBtn);
        
        expect(screen.queryByText('Note to be deleted')).toBeNull();
        expect(JSON.parse(localStorage.getItem('rbiblia_notes'))['gen_1_1']).toBeUndefined();
    });

    it('allows adding a new general note', () => {
        renderWithIntl(<NotesPanel {...defaultProps} />);
        
        // Switch to general
        fireEvent.click(screen.getByText('General Notes'));
        expect(screen.getByText('No general notes')).toBeTruthy();
        
        // Click Add Note
        fireEvent.click(screen.getByTitle('Add Note'));
        
        // Fill form
        const textarea = screen.getByPlaceholderText('Write a note...');
        fireEvent.change(textarea, { target: { value: 'My new general note text' } });
        
        // Save
        fireEvent.click(screen.getByText('Save'));
        
        expect(screen.getByText('My new general note text')).toBeTruthy();
        
        const stored = JSON.parse(localStorage.getItem('rbiblia_general_notes'));
        expect(stored.length).toBe(1);
        expect(stored[0].text).toBe('My new general note text');
    });

    it('clicking close calls onClose', () => {
        renderWithIntl(<NotesPanel {...defaultProps} />);
        // The overlay or the header close button
        const closeBtns = screen.getAllByRole('button', { name: 'Close' });
        fireEvent.click(closeBtns[0]);
        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('displays correct note type badges (Global vs Translation name)', () => {
        saveNotes({ 'gen_1_1': 'Global Note Content' });
        saveTranslationNotes({ 'pl_bb:gen_1_2': 'Translation Note Content' });
        
        renderWithIntl(<NotesPanel {...defaultProps} />);
        
        expect(screen.getAllByText('Global').length).toBeGreaterThan(0);
        expect(screen.getByText('Biblia Brzeska')).toBeTruthy(); // Because translation name is mapped from id 'pl_bb'
    });

    it('shows export and import buttons', () => {
        renderWithIntl(<NotesPanel {...defaultProps} />);
        expect(screen.getByText('Export XML')).toBeTruthy();
        expect(screen.getByText('Import XML')).toBeTruthy();
    });

    it('exports and imports XML correctly', () => {
        saveNotes({ 'gen_1_1': 'Global note test' });
        saveTranslationNotes({ 'en_kjv:gen_1_2': 'Translation note test <>&"' });

        const xml = exportNotesXml();
        expect(xml).toContain('<notes app="rBiblia">');
        expect(xml).toContain('Global note test');
        expect(xml).toContain('Translation note test &lt;&gt;&amp;&quot;');

        // Clear notes
        saveNotes({});
        saveTranslationNotes({});

        const result = importNotesXml(xml);
        expect(result.globalCount).toBe(1);
        expect(result.translationCount).toBe(1);

        const globalNotes = JSON.parse(localStorage.getItem('rbiblia_notes'));
        const translationNotes = JSON.parse(localStorage.getItem('rbiblia_translation_notes'));

        expect(globalNotes['gen_1_1']).toBe('Global note test');
        expect(translationNotes['en_kjv:gen_1_2']).toBe('Translation note test <>&"');
    });

    it('previews and edits a general note', () => {
        saveGeneralNotes([
            { id: 1, text: 'This is a general note', createdAt: new Date().toISOString() }
        ]);

        renderWithIntl(<NotesPanel {...defaultProps} />);
        
        fireEvent.click(screen.getByText('General Notes'));
        
        // Open preview
        fireEvent.click(screen.getByText('This is a general note'));
        expect(screen.getAllByText('General Notes').length).toBeGreaterThan(0); // The title
        
        // Start edit
        fireEvent.click(screen.getByText('Edit'));
        
        // Change text
        const textareas = document.querySelectorAll('textarea');
        const textarea = textareas[textareas.length - 1]; // The one in the modal
        fireEvent.change(textarea, { target: { value: 'Updated general note' } });
        
        // Cancel first
        fireEvent.click(screen.getByText('Cancel'));
        expect(screen.getAllByText('This is a general note').length).toBeGreaterThan(0);
        
        // Edit and save
        fireEvent.click(screen.getByText('Edit'));
        const textareas2 = document.querySelectorAll('textarea');
        fireEvent.change(textareas2[textareas2.length - 1], { target: { value: 'Updated general note' } });
        fireEvent.click(screen.getByText('Save'));
        
        const stored = JSON.parse(localStorage.getItem('rbiblia_general_notes'));
        expect(stored[0].text).toBe('Updated general note');
    });

    it('previews and edits a verse note', () => {
        saveNotes({ 'gen_1_1': 'Verse note to edit' });

        renderWithIntl(<NotesPanel {...defaultProps} />);
        
        // Open preview
        fireEvent.click(screen.getByText('Verse note to edit'));
        expect(screen.getByText('Note for Genesis 1:1')).toBeTruthy();
        
        // Start edit
        fireEvent.click(screen.getByText('Edit'));
        
        // Change text
        const textareas = document.querySelectorAll('textarea');
        const textarea = textareas[textareas.length - 1];
        fireEvent.change(textarea, { target: { value: 'Updated verse note' } });
        
        // Save
        fireEvent.click(screen.getByText('Save'));
        
        const stored = JSON.parse(localStorage.getItem('rbiblia_notes'));
        expect(stored['gen_1_1']).toBe('Updated verse note');
    });

    it('throws error on invalid XML import', () => {
        expect(() => importNotesXml('invalid xml')).toThrow('Invalid XML format');
        expect(() => importNotesXml('<foo></foo>')).toThrow('Missing <notes> root element');
    });
});

describe('NoteEditor Component', () => {
    const defaultEditorProps = {
        isOpen: true,
        onClose: vi.fn(),
        onSave: vi.fn(),
        book: 'gen',
        chapter: '1',
        verse: '1',
        bookName: 'Genesis',
        translationId: 'pl_bg',
        translationName: 'Biblia Gdańska'
    };

    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('renders and saves global note', () => {
        renderWithIntl(<NoteEditor {...defaultEditorProps} />);
        
        expect(screen.getByText('Note for Genesis 1:1')).toBeTruthy();
        
        const textarea = screen.getByPlaceholderText('Write a note...');
        fireEvent.change(textarea, { target: { value: 'My global note' } });
        
        fireEvent.click(screen.getByText('Global'));
        fireEvent.click(screen.getByText('Save'));
        
        const notes = JSON.parse(localStorage.getItem('rbiblia_notes') || '{}');
        expect(notes['gen_1_1']).toBe('My global note');
        expect(defaultEditorProps.onSave).toHaveBeenCalled();
        expect(defaultEditorProps.onClose).toHaveBeenCalled();
    });

    it('renders and saves translation note', () => {
        renderWithIntl(<NoteEditor {...defaultEditorProps} />);
        
        // Select translation specific FIRST
        fireEvent.click(screen.getByText('Translation Note'));
        
        const textarea = screen.getByPlaceholderText('Write a translation note...');
        fireEvent.change(textarea, { target: { value: 'My translation note' } });
        
        fireEvent.click(screen.getByText('Save'));
        
        const transNotes = JSON.parse(localStorage.getItem('rbiblia_translation_notes') || '{}');
        expect(transNotes['pl_bg:gen_1_1']).toBe('My translation note');
        expect(defaultEditorProps.onSave).toHaveBeenCalled();
    });

    it('loads existing note if present', () => {
        saveNotes({ 'gen_1_1': 'Existing note content' });
        
        renderWithIntl(<NoteEditor {...defaultEditorProps} />);
        const textarea = screen.getByPlaceholderText('Write a note...');
        expect(textarea.value).toBe('Existing note content');
    });
});

describe('useHasNote Hook', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('returns true if a note exists for the verse', () => {
        saveNotes({ 'gen_1_1': 'Test note' });
        
        const TestComponent = () => {
            const hasNote = useHasNote('gen', 1, 1);
            return <div data-testid="result">{hasNote ? 'yes' : 'no'}</div>;
        };
        
        render(<TestComponent />);
        expect(screen.getByTestId('result').textContent).toBe('yes');
    });

    it('returns false if no note exists for the verse', () => {
        const TestComponent = () => {
            const hasNote = useHasNote('gen', 1, 1);
            return <div data-testid="result">{hasNote ? 'yes' : 'no'}</div>;
        };
        
        render(<TestComponent />);
        expect(screen.getByTestId('result').textContent).toBe('no');
    });
});

