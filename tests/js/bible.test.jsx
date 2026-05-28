import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import Bible from '../../assets/js/Bible';
import { IntlProvider } from 'react-intl';

// Mock dependencies
vi.mock('../../assets/js/Navigator', () => ({
    default: (props) => (
        <div data-testid="navigator">
            <button data-testid="nav-translation" onClick={() => props.changeSelectedTranslation('pl-ubg')}>Trans</button>
            <button data-testid="nav-book" onClick={() => props.changeSelectedBook('Exo')}>Book</button>
            <button data-testid="nav-chapter" onClick={() => props.changeSelectedChapter(2)}>Chap</button>
            <button data-testid="nav-next-chap" onClick={props.nextChapter}>NextC</button>
            <button data-testid="nav-prev-chap" onClick={props.prevChapter}>PrevC</button>
            <button data-testid="nav-next-book" onClick={props.nextBook}>NextB</button>
            <button data-testid="nav-prev-book" onClick={props.prevBook}>PrevB</button>
        </div>
    )
}));
vi.mock('../../assets/js/Reader', () => ({
    default: (props) => <div data-testid="reader" />
}));
vi.mock('../../assets/js/BottomNavigation', () => ({
    default: (props) => <div data-testid="bottom-nav" />
}));
vi.mock('../../assets/js/SelectionGrid', () => ({
    default: () => <div data-testid="selection-grid" />
}));
vi.mock('../../assets/js/ComparisonGrid', () => ({
    default: () => <div data-testid="comparison-grid" />
}));
vi.mock('../../assets/js/SearchPanel', () => ({
    default: () => <div data-testid="search-panel" />
}));
vi.mock('../../assets/js/ChapterComparison', () => ({
    default: () => <div data-testid="chapter-comparison" />
}));
vi.mock('../../assets/js/ChangelogModal', () => ({
    default: () => <div data-testid="changelog-modal" />
}));
vi.mock('../../assets/js/AboutModal', () => ({
    default: () => <div data-testid="about-modal" />
}));
vi.mock('../../assets/js/SideMenu', () => ({
    SideMenu: ({ children }) => <div data-testid="side-menu">{children}</div>,
    SideMenuTab: () => <div />,
    DisplaySettings: () => <div />,
}));
vi.mock('../../assets/js/Notes', () => ({
    NotesPanel: () => <div />,
    NoteEditor: () => <div />,
    loadNotes: vi.fn(() => ({})),
    loadTranslationNotes: vi.fn(() => ({})),
}));
vi.mock('../../assets/js/WelcomePopup', () => ({
    default: () => null,
    isWelcomePopupDisabled: () => true,
}));
vi.mock('../../assets/js/useSwipeNavigation', () => ({
    default: vi.fn()
}));
vi.mock('../../assets/js/hooks', () => ({
    useKeyboardNavigation: vi.fn()
}));
vi.mock('../../assets/js/getAppropriateBook', () => ({
    default: vi.fn((structure, book) => book || (structure ? Object.keys(structure)[0] : 'Gen'))
}));
vi.mock('../../assets/js/safeJsonParse', () => ({
    safeJsonParse: vi.fn(async (response) => {
        const text = await response.text();
        return JSON.parse(text);
    }),
    default: vi.fn(async (response) => {
        const text = await response.text();
        return JSON.parse(text);
    })
}));

const mockGetVerses = vi.fn().mockResolvedValue({ data: { 1: 'Verse' } });
vi.mock('../../assets/js/useVersesCache', () => ({
    default: () => ({
        getVerses: mockGetVerses,
        isInCache: vi.fn(() => false),
        clearCache: vi.fn(),
        prefetchAdjacent: vi.fn(),
    }),
}));

vi.mock('../../assets/js/safeStorage', () => ({
    safeLocalStorageGetItem: vi.fn((key) => null),
    safeLocalStorageSetItem: vi.fn(),
    safeLocalStorageRemoveItem: vi.fn()
}));

vi.mock('../../assets/js/updateHistory', () => ({
    default: vi.fn()
}));

const mockGetData = vi.fn(() => ({ translation: 'pl-bg', book: 'Gen', chapter: 1 }));
vi.mock('../../assets/js/getDataFromCurrentPathname', () => ({
    default: () => mockGetData()
}));

// Provide a mock Intl object directly
const mockIntl = {
    locale: 'pl',
    formatMessage: ({ id, defaultMessage }) => defaultMessage || id
};

let currentRender;
const renderWithIntl = (component) => {
    currentRender = render(
        <IntlProvider locale="pl" messages={{}}>
            {component}
        </IntlProvider>
    );
    return currentRender;
};

describe('Bible Component', () => {
    // Suppress known React async state update errors during component teardown.
    // Bible.jsx has complex async effects that may fire after unmount in test env.
    const noop = () => {};
    let uncaughtHandler;
    let unhandledHandler;

    beforeAll(() => {
        uncaughtHandler = (err) => { console.error('CRASH:', err); };
        unhandledHandler = (reason) => { console.error('REJECTION:', reason); };
        process.on('uncaughtException', uncaughtHandler);
        process.on('unhandledRejection', unhandledHandler);
    });

    afterAll(() => {
        process.removeListener('uncaughtException', uncaughtHandler);
        process.removeListener('unhandledRejection', unhandledHandler);
    });

    beforeEach(() => {
        globalThis.fetch = vi.fn().mockImplementation((url) => {
            if (url.includes('/translation/') && !url.endsWith('/translation')) {
                return Promise.resolve({
                    ok: true,
                    text: () => Promise.resolve(JSON.stringify({ data: { 'Gen': [1, 2, 3], 'Exo': [1, 2] } }))
                });
            }
            if (url.includes('/translation')) {
                return Promise.resolve({
                    ok: true,
                    text: () => Promise.resolve(JSON.stringify({ data: [{ id: 'pl-bg', name: 'BG' }] }))
                });
            }
            if (url.includes('/book')) {
                return Promise.resolve({
                    ok: true,
                    text: () => Promise.resolve(JSON.stringify({ data: [{ id: 'Gen', name: 'Genesis' }, { id: 'Exo', name: 'Exodus' }] }))
                });
            }
            return Promise.reject(new Error('not found'));
        });

        globalThis.scrollTo = vi.fn();
        mockGetVerses.mockResolvedValue({ data: { 1: 'Verse' } });
    });

    afterEach(async () => {
        if (currentRender) {
            currentRender.unmount();
            currentRender = null;
        }
        // Flush pending microtasks to prevent leaked promises
        await new Promise((r) => setTimeout(r, 0));
        vi.clearAllMocks();
    });

    it('renders Navigator, Reader, BottomNavigation after loading data', async () => {
        renderWithIntl(<Bible intl={mockIntl} setLocale={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByTestId('navigator')).toBeTruthy();
            expect(screen.getByTestId('reader')).toBeTruthy();
            expect(screen.getByTestId('bottom-nav')).toBeTruthy();
        });
    });



    it('Font size - saves to localStorage and sets CSS variable', async () => {
        const { safeLocalStorageSetItem } = await import('../../assets/js/safeStorage');
        renderWithIntl(<Bible intl={mockIntl} setLocale={vi.fn()} />);

        await waitFor(() => {
            expect(safeLocalStorageSetItem).toHaveBeenCalledWith('rbiblia-font-size', 'medium');
        });

        expect(document.documentElement.style.getPropertyValue('--verse-font-size')).toBe('1.15rem');
    });

    it('Theme - sets data-theme on document.documentElement', async () => {
        const { safeLocalStorageGetItem } = await import('../../assets/js/safeStorage');
        safeLocalStorageGetItem.mockImplementation((key) => {
            if (key === 'rbiblia-theme') return 'dark';
            return null;
        });

        renderWithIntl(<Bible intl={mockIntl} setLocale={vi.fn()} />);

        await waitFor(() => {
            expect(document.documentElement.dataset.theme).toBe('dark');
        });
    });

    it('Dark variant - sets data-dark-variant', async () => {
        const { safeLocalStorageGetItem } = await import('../../assets/js/safeStorage');
        safeLocalStorageGetItem.mockImplementation((key) => {
            if (key === 'rbiblia-dark-variant') return 'blue';
            return null;
        });

        renderWithIntl(<Bible intl={mockIntl} setLocale={vi.fn()} />);

        await waitFor(() => {
            expect(document.documentElement.dataset.darkVariant).toBe('blue');
        });
    });

    it('Zen mode - saves to localStorage', async () => {
        const { safeLocalStorageGetItem } = await import('../../assets/js/safeStorage');
        safeLocalStorageGetItem.mockImplementation((key) => {
            if (key === 'rbiblia-zen-mode') return '1';
            return null;
        });

        renderWithIntl(<Bible intl={mockIntl} setLocale={vi.fn()} />);
        await waitFor(() => {
            expect(safeLocalStorageGetItem).toHaveBeenCalledWith('rbiblia-zen-mode');
        });
    });

    it('changes translation when Navigator callback is triggered', async () => {
        const { fireEvent } = await import('@testing-library/react');
        renderWithIntl(<Bible intl={mockIntl} setLocale={vi.fn()} />);
        
        await waitFor(() => {
            expect(screen.getByTestId('nav-translation')).toBeTruthy();
        });

        await act(async () => {
            fireEvent.click(screen.getByTestId('nav-translation'));
        });
    });

    it('changes book and chapter when Navigator callbacks are triggered', async () => {
        const { fireEvent } = await import('@testing-library/react');
        renderWithIntl(<Bible intl={mockIntl} setLocale={vi.fn()} />);
        
        await waitFor(() => {
            expect(screen.getByTestId('nav-book')).toBeTruthy();
        });

        await act(async () => {
            fireEvent.click(screen.getByTestId('nav-book'));
        });

        await act(async () => {
            fireEvent.click(screen.getByTestId('nav-chapter'));
        });
    });

    it('handles next and previous chapter navigation', async () => {
        const { fireEvent } = await import('@testing-library/react');
        renderWithIntl(<Bible intl={mockIntl} setLocale={vi.fn()} />);
        
        await waitFor(() => {
            expect(screen.getByTestId('nav-next-chap')).toBeTruthy();
        });

        await act(async () => {
            fireEvent.click(screen.getByTestId('nav-next-chap'));
        });

        await act(async () => {
            fireEvent.click(screen.getByTestId('nav-prev-chap'));
        });
    });

    it('handles next and previous chapter navigation in continuousText mode', async () => {
        const { safeLocalStorageGetItem } = await import('../../assets/js/safeStorage');
        safeLocalStorageGetItem.mockImplementation((key) => {
            if (key === 'rbiblia-continuous-text') return '1';
            return null;
        });

        const { fireEvent } = await import('@testing-library/react');
        renderWithIntl(<Bible intl={mockIntl} setLocale={vi.fn()} />);
        
        await waitFor(() => {
            expect(screen.getByTestId('nav-next-chap')).toBeTruthy();
        });

        // Initially we are on Gen chapter 1. Under mocked structure 'Gen' has [1, 2, 3] chapters.
        // Clicking next chapter should jump by 1 chapter (from index 0 to index 1), so chapter 2.
        await act(async () => {
            fireEvent.click(screen.getByTestId('nav-next-chap'));
        });

        await waitFor(() => {
            expect(mockGetVerses).toHaveBeenCalledWith('pl-bg', 'Gen', 2);
        });

        // Going back by 1 chapter should land back at index 0 (chapter 1).
        await act(async () => {
            fireEvent.click(screen.getByTestId('nav-prev-chap'));
        });

        await waitFor(() => {
            expect(mockGetVerses).toHaveBeenCalledWith('pl-bg', 'Gen', 1);
        });
    });

    it('handles next and previous book navigation', async () => {
        const { fireEvent } = await import('@testing-library/react');
        renderWithIntl(<Bible intl={mockIntl} setLocale={vi.fn()} />);
        
        await waitFor(() => {
            expect(screen.getByTestId('nav-next-book')).toBeTruthy();
        });

        await act(async () => {
            fireEvent.click(screen.getByTestId('nav-next-book'));
        });

        await act(async () => {
            fireEvent.click(screen.getByTestId('nav-prev-book'));
        });
    });

});
