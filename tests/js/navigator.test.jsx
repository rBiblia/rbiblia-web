import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Navigator from '../../assets/js/Navigator';
import { IntlProvider } from 'react-intl';

// Mock child components to isolate Navigator tests
vi.mock('../../assets/js/TranslationSelector', () => ({
    default: () => <div data-testid="translation-selector" />
}));

vi.mock('../../assets/js/DirectionalNavigationButton', () => ({
    default: ({ direction, disabled, onClick }) => (
        <button 
            data-testid={`nav-btn-${direction}`} 
            disabled={disabled} 
            onClick={onClick}
        >
            {direction}
        </button>
    )
}));

vi.mock('../../assets/js/Icon', () => ({
    default: ({ name }) => <span data-testid={`icon-${name}`}>{name}</span>
}));

// Mock hooks
vi.mock('../../assets/js/useScrollDirection', () => ({
    default: () => true // Always visible for tests
}));

vi.mock('../../assets/js/blurOnTouchInteraction', () => ({
    default: vi.fn()
}));

const renderWithIntl = (component) => {
    return render(
        <IntlProvider locale="pl" messages={{
            search: 'Szukaj',
            selectBook: 'Wybierz księgę',
            notes: 'Notatki',
            chapterComparison: 'Porównanie',
            settings: 'Ustawienia'
        }}>
            {component}
        </IntlProvider>
    );
};

describe('Navigator', () => {
    const defaultProps = {
        translations: [],
        books: { 'Gen': { name: 'Genesis' } },
        structure: {},
        isStructureLoading: false,
        listsLoading: false,
        changeSelectedTranslation: vi.fn(),
        selectedTranslation: 'pl-bg',
        selectedBook: 'Gen',
        selectedChapter: 1,
        prevChapter: vi.fn(),
        nextChapter: vi.fn(),
        isNextBookAvailable: true,
        isPrevBookAvailable: false,
        isNextChapterAvailable: true,
        isPrevChapterAvailable: false,
        onOpenSelection: vi.fn(),
        onOpenNotes: vi.fn(),
        onOpenSearch: vi.fn(),
        onOpenSettings: vi.fn(),
        onOpenChapterComparison: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders all main elements', () => {
        renderWithIntl(<Navigator {...defaultProps} />);
        
        expect(screen.getByTestId('translation-selector')).toBeTruthy();
        expect(screen.getByTestId('nav-btn-left')).toBeTruthy();
        expect(screen.getByTestId('nav-btn-right')).toBeTruthy();
        
        // Mobile search button
        const mobileSearchBtn = screen.getAllByTitle(/Szukaj/i)[0];
        expect(mobileSearchBtn).toBeTruthy();
        
        // Desktop action buttons
        expect(screen.getByTitle(/Wybierz księgę/i)).toBeTruthy();
        expect(screen.getByTitle(/Notatki/i)).toBeTruthy();
        expect(screen.getByTitle(/Ustawienia/i)).toBeTruthy();
        expect(screen.getByTitle(/Porównanie/i)).toBeTruthy();
        
        // Location button
        expect(screen.getByText('Genesis 1')).toBeTruthy();
    });

    it('handles next and prev navigation clicks', () => {
        const prevChapter = vi.fn();
        const nextChapter = vi.fn();
        
        renderWithIntl(
            <Navigator 
                {...defaultProps} 
                prevChapter={prevChapter} 
                nextChapter={nextChapter}
                isPrevChapterAvailable={true}
            />
        );
        
        fireEvent.click(screen.getByTestId('nav-btn-left'));
        expect(prevChapter).toHaveBeenCalledTimes(1);
        
        fireEvent.click(screen.getByTestId('nav-btn-right'));
        expect(nextChapter).toHaveBeenCalledTimes(1);
    });

    it('disables navigation buttons correctly based on availability', () => {
        const { rerender } = renderWithIntl(
            <Navigator 
                {...defaultProps} 
                isPrevChapterAvailable={false}
                isPrevBookAvailable={false}
                isNextChapterAvailable={false}
                isNextBookAvailable={false}
            />
        );
        
        expect(screen.getByTestId('nav-btn-left').disabled).toBe(true);
        expect(screen.getByTestId('nav-btn-right').disabled).toBe(true);
        
        rerender(
            <IntlProvider locale="pl" messages={{}}>
                <Navigator 
                    {...defaultProps} 
                    isPrevChapterAvailable={true}
                    isPrevBookAvailable={false}
                    isNextChapterAvailable={false}
                    isNextBookAvailable={true}
                />
            </IntlProvider>
        );
        
        expect(screen.getByTestId('nav-btn-left').disabled).toBe(false);
        expect(screen.getByTestId('nav-btn-right').disabled).toBe(false);
    });

    it('calls respective callbacks for action buttons', () => {
        const onOpenSelection = vi.fn();
        const onOpenSearch = vi.fn();
        const onOpenNotes = vi.fn();
        const onOpenChapterComparison = vi.fn();
        const onOpenSettings = vi.fn();

        renderWithIntl(
            <Navigator 
                {...defaultProps}
                onOpenSelection={onOpenSelection}
                onOpenSearch={onOpenSearch}
                onOpenNotes={onOpenNotes}
                onOpenChapterComparison={onOpenChapterComparison}
                onOpenSettings={onOpenSettings}
            />
        );

        // Location button
        fireEvent.click(screen.getByText('Genesis 1').closest('button'));
        expect(onOpenSelection).toHaveBeenCalledTimes(1);

        // Mobile search
        const searchBtns = screen.getAllByTitle(/Szukaj/i);
        fireEvent.click(searchBtns[0]); // Mobile
        expect(onOpenSearch).toHaveBeenCalledTimes(1);
        fireEvent.click(searchBtns[1]); // Desktop
        expect(onOpenSearch).toHaveBeenCalledTimes(2);

        fireEvent.click(screen.getByTitle(/Notatki/i));
        expect(onOpenNotes).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByTitle(/Ustawienia/i));
        expect(onOpenSettings).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByTitle(/Porównanie/i));
        expect(onOpenChapterComparison).toHaveBeenCalledTimes(1);
    });

    it('shows loading indicator text when location is loading', () => {
        renderWithIntl(<Navigator {...defaultProps} selectedBook={null} />);
        expect(screen.getByText('...')).toBeTruthy();
    });
});
