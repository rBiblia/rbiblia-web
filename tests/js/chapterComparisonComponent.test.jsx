import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChapterComparison from '../../assets/js/ChapterComparison';
import { IntlProvider } from 'react-intl';

vi.mock('../../assets/js/TranslationSelector', () => ({
    default: ({ selectedTranslation, changeSelectedTranslation, placeholder }) => (
        <div data-testid="translation-selector">
            <span>{placeholder}</span>
            <select 
                value={selectedTranslation || ''} 
                onChange={(e) => changeSelectedTranslation(e.target.value)}
                data-testid={`select-${placeholder}`}
            >
                <option value="">None</option>
                <option value="pl-bg">BG</option>
                <option value="pl-ubg">UBG</option>
            </select>
        </div>
    )
}));

vi.mock('../../assets/js/safeStorage', () => ({
    safeLocalStorageGetItem: vi.fn(() => JSON.stringify(['pl-bg', 'pl-ubg']))
}));

vi.mock('../../assets/js/Icon', () => ({
    default: ({ name }) => <span data-testid={`icon-${name}`}>{name}</span>
}));

vi.mock('../../assets/js/blurOnTouchInteraction', () => ({
    default: vi.fn()
}));

const mockTranslations = [
    { id: 'pl-bg', name: 'BG' },
    { id: 'pl-ubg', name: 'UBG' }
];

const mockStructure = {
    'Gen': [1, 2, 3]
};

const mockBooks = []; // Not directly used except in some places potentially

const renderWithIntl = (component) => {
    return render(
        <IntlProvider locale="pl" messages={{
            chapterComparison: 'Porównanie',
            chapterCompSelectTranslation: 'Wybierz przekład',
            chapterCompSelectHint: 'Wybierz dwa przekłady',
            loading: 'Ładowanie',
            chapterCompError: 'Błąd ładowania',
            previousChapter: 'Poprzedni',
            nextChapter: 'Następny',
            noResults: 'Brak wyników'
        }}>
            {component}
        </IntlProvider>
    );
};

describe('ChapterComparison', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        bookId: 'Gen',
        bookName: 'Genesis',
        chapterId: 2,
        translations: mockTranslations,
        currentTranslation: 'pl-bg',
        structure: mockStructure,
        books: mockBooks,
        onNavigateChapter: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
        globalThis.fetch = vi.fn().mockImplementation((url) => {
            if (url.includes('pl-bg')) {
                return Promise.resolve({
                    ok: true,
                    text: () => Promise.resolve(JSON.stringify({ data: { 1: 'Verse 1 BG', 2: 'Verse 2 BG' } }))
                });
            }
            if (url.includes('pl-ubg')) {
                return Promise.resolve({
                    ok: true,
                    text: () => Promise.resolve(JSON.stringify({ data: { 1: 'Verse 1 UBG', 3: 'Verse 3 UBG' } }))
                });
            }
            return Promise.reject(new Error('not found'));
        });
    });

    it('returns null if not open', () => {
        const { container } = renderWithIntl(<ChapterComparison {...defaultProps} isOpen={false} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders basic structure and fetches initial favorite translations', async () => {
        renderWithIntl(<ChapterComparison {...defaultProps} />);
        
        expect(screen.getAllByText('Genesis 2')[0]).toBeTruthy();
        expect(screen.getAllByText('Wybierz przekład').length).toBe(2);
        
        await waitFor(() => {
            // Wait for both to be loaded
            expect(screen.getAllByText('Verse 1 BG')[0]).toBeTruthy();
            expect(screen.getAllByText('Verse 1 UBG')[0]).toBeTruthy();
        });
        
        // Ensure union of keys are shown: 1, 2, 3
        const tableRows = document.querySelectorAll('.chapter-comp-row');
        expect(tableRows.length).toBe(3); // Keys 1, 2, 3
        expect(tableRows[0].textContent).toContain('2:1');
        expect(tableRows[1].textContent).toContain('2:2');
        expect(tableRows[2].textContent).toContain('2:3');
    });

    it('handles navigation buttons and keyboard events', async () => {
        const onNavigateChapter = vi.fn();
        const onClose = vi.fn();
        renderWithIntl(<ChapterComparison {...defaultProps} onNavigateChapter={onNavigateChapter} onClose={onClose} />);
        
        await waitFor(() => expect(screen.getAllByText('Verse 1 BG')[0]).toBeTruthy());

        const prevBtn = screen.getByRole('button', { name: /Poprzedni/i });
        const nextBtn = screen.getByRole('button', { name: /Następny/i });

        fireEvent.click(prevBtn);
        expect(onNavigateChapter).toHaveBeenCalledWith('Gen', 1);

        fireEvent.click(nextBtn);
        expect(onNavigateChapter).toHaveBeenCalledWith('Gen', 3);

        // Keyboard left arrow
        fireEvent.keyDown(globalThis.window, { key: 'ArrowLeft' });
        expect(onNavigateChapter).toHaveBeenCalledWith('Gen', 1);

        // Keyboard right arrow
        fireEvent.keyDown(globalThis.window, { key: 'ArrowRight' });
        expect(onNavigateChapter).toHaveBeenCalledWith('Gen', 3);

        // Keyboard escape
        fireEvent.keyDown(globalThis.window, { key: 'Escape' });
        expect(onClose).toHaveBeenCalled();
    });

    it('shows empty state when no translations selected', async () => {
        const { safeLocalStorageGetItem } = await import('../../assets/js/safeStorage');
        safeLocalStorageGetItem.mockReturnValueOnce('[]'); // No favorites
        
        renderWithIntl(<ChapterComparison {...defaultProps} currentTranslation={null} />);
        
        expect(screen.getByText('Wybierz dwa przekłady')).toBeTruthy();
    });

    it('shows error state when fetch fails', async () => {
        globalThis.fetch.mockRejectedValueOnce(new Error('Network error'));
        
        renderWithIntl(<ChapterComparison {...defaultProps} />);
        
        await waitFor(() => {
            expect(screen.getByText('Błąd ładowania')).toBeTruthy();
        });
    });

    it('calls onClose when close button is clicked', async () => {
        const onClose = vi.fn();
        renderWithIntl(<ChapterComparison {...defaultProps} onClose={onClose} />);

        // Wait for initial async fetch to settle before interacting
        await waitFor(() => {
            expect(document.querySelector('.chapter-comp-close')).toBeTruthy();
        });

        await act(async () => {
            fireEvent.click(document.querySelector('.chapter-comp-close'));
        });
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
