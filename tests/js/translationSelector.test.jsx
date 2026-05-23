import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TranslationSelector from '../../assets/js/TranslationSelector';
import { IntlProvider } from 'react-intl';
import * as SideMenuEvents from '../../assets/js/SideMenu';

vi.mock('../../assets/js/Icon', () => ({
    default: ({ name }) => <span data-testid={`icon-${name}`}>{name}</span>
}));

// Mock safeStorage indirectly via SideMenu mock or mock SideMenu methods
vi.spyOn(SideMenuEvents, 'getFavoriteTranslations').mockReturnValue(['pl-bg']);
vi.spyOn(SideMenuEvents, 'saveFavoriteTranslations').mockImplementation(() => {});

const mockTranslations = [
    { id: 'pl-bg', name: 'Biblia Gdańska', language: 'pl' },
    { id: 'pl-ubg', name: 'Uwspółcześniona Biblia Gdańska', language: 'pl' },
    { id: 'en-kjv', name: 'King James Version', language: 'en' }
];

const renderWithIntl = (component) => {
    return render(
        <IntlProvider locale="pl" messages={{
            favorites: 'Ulubione',
            removeFromFavorites: 'Usuń',
            addToFavorites: 'Dodaj',
            searchTranslationPlaceholder: 'Wyszukaj tłumaczenie...',
            noTranslationResults: 'Nie znaleziono tłumaczeń',
            clear: 'Wyczyść'
        }}>
            {component}
        </IntlProvider>
    );
};

describe('TranslationSelector', () => {
    const defaultProps = {
        translations: mockTranslations,
        selectedTranslation: 'pl-bg',
        changeSelectedTranslation: vi.fn(),
        isLoading: false
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders and toggles dropdown', () => {
        renderWithIntl(<TranslationSelector {...defaultProps} />);
        
        const trigger = screen.getByRole('button', { name: /Biblia Gdańska/i });
        expect(trigger).toBeTruthy();
        
        // Open
        fireEvent.click(trigger);
        expect(screen.getByText('Ulubione')).toBeTruthy();
        
        // Close
        fireEvent.click(trigger);
        expect(screen.queryByText('Ulubione')).toBeNull();
    });

    it('shows loading state', () => {
        renderWithIntl(<TranslationSelector {...defaultProps} isLoading={true} />);
        const trigger = screen.getByRole('button');
        expect(trigger.className).toContain('disabled');
        expect(trigger.disabled).toBe(true);
        expect(document.querySelector('.spinner-border')).toBeTruthy();
    });

    it('groups translations and allows selection', () => {
        const changeSelectedTranslation = vi.fn();
        renderWithIntl(<TranslationSelector {...defaultProps} changeSelectedTranslation={changeSelectedTranslation} />);
        
        const trigger = screen.getAllByRole('button', { name: /Biblia Gdańska/i })[0];
        fireEvent.click(trigger);
        
        // Favorite
        expect(screen.getAllByText('Biblia Gdańska').length).toBeGreaterThan(0);

        // Other groups (pl, en) should be collapsed by default
        const plGroup = screen.getByText('polski');
        const enGroup = screen.getByText('angielski');
        expect(plGroup).toBeTruthy();
        expect(enGroup).toBeTruthy();
        
        // Open PL group
        fireEvent.click(plGroup);
        const ubgOption = screen.getByRole('button', { name: /Uwspółcześniona Biblia Gdańska/i });
        expect(ubgOption).toBeTruthy();
        
        // Select
        fireEvent.click(ubgOption);
        expect(changeSelectedTranslation).toHaveBeenCalledWith('pl-ubg');
    });

    it('toggles favorites', () => {
        renderWithIntl(<TranslationSelector {...defaultProps} />);
        
        fireEvent.click(screen.getAllByRole('button', { name: /Biblia Gdańska/i })[0]);
        
        const favGroupLabel = screen.getByText('Ulubione');
        expect(favGroupLabel).toBeTruthy();

        // Add to favorites from other group
        fireEvent.click(screen.getByText('polski'));
        
        const ubgOption = screen.getByRole('button', { name: /Uwspółcześniona Biblia Gdańska/i });
        const ubgContainer = ubgOption.closest('.translation-item');
        
        const starBtn = ubgContainer.querySelector('.translation-star');
        fireEvent.click(starBtn);
        
        expect(SideMenuEvents.saveFavoriteTranslations).toHaveBeenCalled();
        const callArg = SideMenuEvents.saveFavoriteTranslations.mock.calls[0][0];
        expect(callArg).toContain('pl-ubg');
    });

    it('handles disabled options', () => {
        renderWithIntl(<TranslationSelector {...defaultProps} disabledOptions={['pl-bg']} selectedTranslation="pl-ubg" />);
        
        const trigger = screen.getByRole('button', { name: /Uwspółcześniona Biblia Gdańska/i });
        fireEvent.click(trigger);
        
        const bgOption = screen.getAllByRole('button', { name: /Biblia Gdańska/i }).find(btn => btn.className.includes('translation-name'));
        expect(bgOption.disabled).toBe(true);
    });

    it('filters translations by search query and auto-expands groups', () => {
        renderWithIntl(<TranslationSelector {...defaultProps} />);
        
        const trigger = screen.getAllByRole('button', { name: /Biblia Gdańska/i })[0];
        fireEvent.click(trigger);
        
        // Initially, pl-ubg is not visible because pl group is collapsed
        expect(screen.queryByRole('button', { name: /Uwspółcześniona Biblia Gdańska/i })).toBeNull();
        
        // Find search input
        const searchInput = screen.getByPlaceholderText('Wyszukaj tłumaczenie...');
        expect(searchInput).toBeTruthy();
        
        // Type "uwsp"
        fireEvent.change(searchInput, { target: { value: 'uwsp' } });
        
        // Now it should be visible because group is auto-expanded
        const ubgOption = screen.getByRole('button', { name: /Uwspółcześniona Biblia Gdańska/i });
        expect(ubgOption).toBeTruthy();
        
        // Also it filters out other unrelated translations (e.g. King James Version)
        expect(screen.queryByText('King James Version')).toBeNull();
        
        // Click clear button
        const clearBtn = screen.getByTitle('Wyczyść');
        fireEvent.click(clearBtn);
        
        // Search query should be cleared
        expect(searchInput.value).toBe('');
    });

    it('shows empty state when no results match search query', () => {
        renderWithIntl(<TranslationSelector {...defaultProps} />);
        
        const trigger = screen.getAllByRole('button', { name: /Biblia Gdańska/i })[0];
        fireEvent.click(trigger);
        
        const searchInput = screen.getByPlaceholderText('Wyszukaj tłumaczenie...');
        
        // Type something that doesn't match
        fireEvent.change(searchInput, { target: { value: 'nonexistent-translation-xyz' } });
        
        // Should show no results message
        expect(screen.getByText('Nie znaleziono tłumaczeń')).toBeTruthy();
    });
});
