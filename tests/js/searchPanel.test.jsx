import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IntlProvider } from 'react-intl';
import SearchPanel, { normalizeQuery } from '../../assets/js/SearchPanel';
import * as safeStorage from '../../assets/js/safeStorage';

vi.mock('../../assets/js/hooks/useFocusTrap', () => ({
    default: vi.fn().mockReturnValue({ current: null })
}));
vi.mock('../../assets/js/hooks/useScrollWithVirtualization', () => ({
    default: (items) => ({
        visibleItems: items,
        hasMore: false,
        handleScroll: vi.fn(),
        reset: vi.fn()
    })
}));

const messages = {
    search: 'Search',
    searchPlaceholder: 'Type to search...',
    suggestionHistory: 'History',
    suggestionBook: 'Book',
    suggestionPhrase: 'Phrase',
    searchMinChars: 'Min 3 chars',
    scopeALL: 'All',
    scopeOT: 'OT',
    scopeNT: 'NT',
    searching: 'Searching...',
    noResults: 'No results',
    noResultsHint: 'Try different words',
    searchError: 'Search error',
    recentSearches: 'Recent Searches',
    clear: 'Clear',
    resultsCount: '{count} results',
    searchInitialHint: 'Start typing...',
    searchHelpText: 'Help',
    searchHelpTip1: 'Tip1',
    searchHelpTip2: 'Tip2',
    searchHelpTip3: 'Tip3',
};

const mockBooks = {
    'gen': { name: 'Genesis' },
    'exo': { name: 'Exodus' },
    'mat': { name: 'Matthew' }
};

describe('SearchPanel', () => {
    beforeEach(() => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        vi.spyOn(safeStorage, 'safeLocalStorageGetItem').mockReturnValue(null);
        vi.spyOn(safeStorage, 'safeLocalStorageSetItem').mockReturnValue(true);
        globalThis.fetch = vi.fn();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    const renderPanel = (props = {}) => {
        return render(
            <IntlProvider locale="en" messages={messages}>
                <SearchPanel 
                    isOpen={true} 
                    onClose={vi.fn()}
                    selectedTranslation="kjv"
                    books={mockBooks}
                    onNavigateToVerse={vi.fn()}
                    {...props}
                />
            </IntlProvider>
        );
    };

    it('renders search panel', () => {
        renderPanel();
        expect(screen.getByPlaceholderText('Type to search...')).toBeInTheDocument();
    });

    it('shows history suggestions on focus if query length >= 1', () => {
        safeStorage.safeLocalStorageGetItem.mockReturnValue(JSON.stringify(['god', 'love']));
        renderPanel();
        
        const input = screen.getByPlaceholderText('Type to search...');
        fireEvent.change(input, { target: { value: 'g' } });
        fireEvent.focus(input);
        
        expect(screen.getAllByText('god').length).toBeGreaterThan(0);
        expect(screen.getAllByText('History').length).toBeGreaterThan(0);
    });

    it('performs search on submit', async () => {
        globalThis.fetch.mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(JSON.stringify({
                data: {
                    results: [{ book: 'gen', chapter: 1, verse: 1, content: 'In the beginning God' }]
                }
            }))
        });

        renderPanel();
        
        const input = screen.getByPlaceholderText('Type to search...');
        fireEvent.change(input, { target: { value: 'God' } });
        
        fireEvent.submit(input);

        expect(screen.getByText('Searching...')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getAllByRole('button').some(btn => btn.textContent.includes('In the beginning God'))).toBe(true);
        });
        
        expect(globalThis.fetch).toHaveBeenCalledWith('/api/en/search', expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ query: 'God', translation: 'kjv' })
        }));
    });

    it('performs debounced search on input change', async () => {
        globalThis.fetch.mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(JSON.stringify({
                data: {
                    results: [{ book: 'gen', chapter: 1, verse: 1, content: 'In the beginning God' }]
                }
            }))
        });

        renderPanel();
        
        const input = screen.getByPlaceholderText('Type to search...');
        fireEvent.change(input, { target: { value: 'God' } });
        
        await act(async () => {
            vi.advanceTimersByTime(500);
        });
        await vi.runAllTimersAsync();

        await waitFor(() => {
            expect(screen.getAllByRole('button').some(btn => btn.textContent.includes('In the beginning God'))).toBe(true);
        });
        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it('handles search errors', async () => {
        globalThis.fetch.mockRejectedValueOnce(new Error('Network failure'));

        renderPanel();
        
        const input = screen.getByPlaceholderText('Type to search...');
        fireEvent.change(input, { target: { value: 'God' } });
        
        await act(async () => {
            vi.advanceTimersByTime(500);
        });
        await vi.runAllTimersAsync();

        await waitFor(() => {
            expect(screen.getByText('Network failure')).toBeInTheDocument();
        });
    });

    it('navigates to verse when result is clicked', async () => {
        const onNavigate = vi.fn();
        const onClose = vi.fn();
        globalThis.fetch.mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(JSON.stringify({
                data: {
                    results: [{ book: 'gen', chapter: 1, verse: 1, content: 'In the beginning God' }]
                }
            }))
        });

        renderPanel({ onNavigateToVerse: onNavigate, onClose });
        
        const input = screen.getByPlaceholderText('Type to search...');
        fireEvent.change(input, { target: { value: 'God' } });
        
        await act(async () => {
            vi.advanceTimersByTime(500);
        });
        await vi.runAllTimersAsync();

        await waitFor(() => {
            expect(screen.getAllByRole('button').some(btn => btn.textContent.includes('In the beginning God'))).toBe(true);
        });

        const resultButton = screen.getAllByRole('button').find(btn => btn.textContent.includes('In the beginning God'));
        fireEvent.click(resultButton);

        expect(onNavigate).toHaveBeenCalledWith('gen', 1, 1);
        expect(onClose).toHaveBeenCalled();
    });

    it('filters results by scope (OT/NT)', async () => {
        globalThis.fetch.mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(JSON.stringify({
                data: {
                    results: [
                        { book: 'gen', chapter: 1, verse: 1, content: 'Old Testament Genesis' },
                        { book: 'mat', chapter: 1, verse: 1, content: 'New Testament Matthew' }
                    ]
                }
            }))
        });

        renderPanel();
        
        const input = screen.getByPlaceholderText('Type to search...');
        fireEvent.change(input, { target: { value: 'Testament' } });
        fireEvent.submit(input);

        await waitFor(() => {
            const hasText = (text) => screen.getAllByRole('button').some(btn => btn.textContent.includes(text));
            expect(hasText('Old Testament Genesis')).toBe(true);
            expect(hasText('New Testament Matthew')).toBe(true);
        });

        // Click OT
        fireEvent.click(screen.getByRole('button', { name: 'OT' }));
        expect(screen.getAllByRole('button').some(btn => btn.textContent.includes('Old Testament Genesis'))).toBe(true);
        expect(screen.queryAllByRole('button').some(btn => btn.textContent.includes('New Testament Matthew'))).toBe(false);

        // Click NT
        fireEvent.click(screen.getByRole('button', { name: 'NT' }));
        expect(screen.queryAllByRole('button').some(btn => btn.textContent.includes('Old Testament Genesis'))).toBe(false);
        expect(screen.getAllByRole('button').some(btn => btn.textContent.includes('New Testament Matthew'))).toBe(true);
    });

    it('suggests books and navigates directly', () => {
        const onNavigate = vi.fn();
        renderPanel({ onNavigateToVerse: onNavigate });
        
        const input = screen.getByPlaceholderText('Type to search...');
        fireEvent.change(input, { target: { value: 'gen' } });
        fireEvent.focus(input);
        
        const genesisSuggestion = screen.getByText('Genesis');
        fireEvent.click(genesisSuggestion);

        expect(onNavigate).toHaveBeenCalledWith('gen', 1, 1);
    });

    it('clears search', async () => {
        const { container } = renderPanel();
        
        const input = screen.getByPlaceholderText('Type to search...');
        fireEvent.change(input, { target: { value: 'God' } });
        
        const clearButton = container.querySelector('.search-clear-btn');
        fireEvent.click(clearButton);

        expect(input.value).toBe('');
    });
});

describe('normalizeQuery', () => {
    it('trims whitespace', () => {
        expect(normalizeQuery('  hello  ')).toBe('hello');
    });

    it('collapses multiple spaces', () => {
        expect(normalizeQuery('hello   world')).toBe('hello world');
    });

    it('trims and collapses together', () => {
        expect(normalizeQuery('  hello   world  ')).toBe('hello world');
    });

    it('returns empty string for whitespace-only input', () => {
        expect(normalizeQuery('   ')).toBe('');
    });
});


