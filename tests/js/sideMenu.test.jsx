import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { SideMenu, SideMenuTab, DisplaySettings } from '../../assets/js/SideMenu';

vi.mock('../../assets/js/hooks/useFocusTrap', () => ({
    default: vi.fn().mockReturnValue({ current: null })
}));

vi.mock('../../assets/js/useScrollDirection', () => ({
    default: vi.fn().mockReturnValue(true) // visible by default
}));

vi.mock('../../assets/js/Icon', () => ({
    default: ({ name }) => <span data-testid={`icon-${name}`}>{name}</span>
}));

vi.mock('../../assets/js/safeStorage', () => ({
    safeLocalStorageGetItem: vi.fn(),
    safeLocalStorageSetItem: vi.fn(),
}));

const messages = {
    settings: 'Settings',
    textSettings: 'Text Settings',
    appearance: 'Appearance',
    language: 'Language',
    favoriteTranslations: 'Favorites',
    info: 'Info',
    fontSize: 'Font Size',
    fontFamily: 'Font Family',
    theme: 'Theme',
    themeSystem: 'System',
    themeLight: 'Light',
    themeDark: 'Dark',
    darkModeVariant: 'Dark mode colors',
    darkVariantGold: 'Dark Gold',
    darkVariantCharcoal: 'Dark Charcoal',
    languageEn: 'English',
    languagePl: 'Polish',
    languageDe: 'German',
    comparisonLimit: 'Comparison Limit',
    changelogLink: 'Changelog',
    about: 'About',
    feedback: 'Feedback',
    githubRepo: 'GitHub',
    close: 'Zamknij',
    diffModeHint: 'Diff mode',
    diffModeLoose: 'Loose',
    diffModeStrict: 'Strict',
    favoriteTranslationsComparisonHint: 'Fav comparison',
    noFavorites: 'No fav',
    noFavoritesHint: 'No fav hint',
    availableTranslationsCounter: 'Available',
    openMenu: 'Open menu',
    appLanguage: 'App Language',
    selectLanguage: 'Select Language',
    comparisonSettings: 'Comparison Settings',
    diffMode: 'Diff Mode',
    zenMode: 'Zen Mode',
    removeFromFavorites: 'Remove from favorites',
    verseLayout: 'Verse Layout',
    verseLayoutSplit: 'Werset po wersecie',
    verseLayoutContinuous: 'Tekst ciągły',
    verseNumbersVisibility: 'Widoczność numerów wersetów',
    showVerseNumbers: 'Pokaż',
    hideVerseNumbers: 'Ukryj'
};

const renderWithIntl = (ui) => {
    return render(
        <IntlProvider locale="en" messages={messages}>
            {ui}
        </IntlProvider>
    );
};

describe('SideMenu UI Components', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('SideMenuTab', () => {
        it('renders button with settings icon', () => {
            renderWithIntl(<SideMenuTab onClick={vi.fn()} />);
            expect(screen.getByTestId('icon-settings')).toBeTruthy();
        });

        it('calls onClick when clicked', () => {
            const onClickMock = vi.fn();
            renderWithIntl(<SideMenuTab onClick={onClickMock} />);
            fireEvent.click(screen.getByRole('button'));
            expect(onClickMock).toHaveBeenCalled();
        });

        it('hides when isNavVisible=false', async () => {
            const { default: useScrollDirection } = await import('../../assets/js/useScrollDirection');
            useScrollDirection.mockReturnValueOnce(false);
            
            renderWithIntl(<SideMenuTab onClick={vi.fn()} />);
            const btn = screen.getByRole('button');
            expect(btn.className).toContain('nav-hidden-fab');
        });
    });

    describe('SideMenu', () => {
        it('renders overlay and panel', () => {
            renderWithIntl(<SideMenu isOpen={false} onClose={vi.fn()}><div data-testid="child" /></SideMenu>);
            expect(screen.getByTestId('child')).toBeTruthy();
        });

        it('adds active/open classes when isOpen=true', () => {
            const { container } = renderWithIntl(<SideMenu isOpen={true} onClose={vi.fn()} />);
            expect(container.querySelector('.side-menu-overlay.active')).toBeTruthy();
            expect(container.querySelector('.side-menu-panel.open')).toBeTruthy();
        });

        it('calls onClose when overlay is clicked', () => {
            const onCloseMock = vi.fn();
            const { container } = renderWithIntl(<SideMenu isOpen={true} onClose={onCloseMock} />);
            fireEvent.click(container.querySelector('.side-menu-overlay'));
            expect(onCloseMock).toHaveBeenCalled();
        });
    });

    describe('DisplaySettings', () => {
        const defaultProps = {
            fontSize: 'medium',
            setFontSize: vi.fn(),
            fontFamily: 'sans',
            setFontFamily: vi.fn(),
            translations: [],
            setLocaleAndUpdateHistory: vi.fn(),
            theme: 'system',
            setTheme: vi.fn(),
            darkVariant: 'charcoal',
            setDarkVariant: vi.fn(),
            zenMode: false,
            setZenMode: vi.fn(),
            onClose: vi.fn(),
            onOpenChangelog: vi.fn(),
            onOpenAbout: vi.fn(),
            continuousText: false,
            setContinuousText: vi.fn(),
            hideVerseNumbers: false,
            setHideVerseNumbers: vi.fn()
        };

        it('renders tab dock with 5 tabs', () => {
            renderWithIntl(<DisplaySettings {...defaultProps} />);
            const tabs = screen.getAllByRole('button').filter(b => b.className && typeof b.className === 'string' && b.className.includes('side-menu-dock-item'));
            expect(tabs.length).toBe(5);
        });

        it('shows font size buttons in text tab', () => {
            renderWithIntl(<DisplaySettings {...defaultProps} />);
            const buttons = screen.getAllByRole('button').filter(b => b.className.includes('font-size-btn'));
            expect(buttons.length).toBe(4);
        });

        it('calls setFontSize when a size button is clicked', () => {
            renderWithIntl(<DisplaySettings {...defaultProps} />);
            const buttons = screen.getAllByRole('button').filter(b => b.className.includes('font-size-btn'));
            fireEvent.click(buttons[2]); // Large is the 3rd button
            expect(defaultProps.setFontSize).toHaveBeenCalledWith('large');
        });

        it('shows font family buttons in text tab', () => {
            renderWithIntl(<DisplaySettings {...defaultProps} />);
            // Assuming the labels for families: Serif, Sans, Mono (these might be hardcoded, let's look for buttons in Font Family section)
            expect(screen.getByText('Serif')).toBeTruthy();
            expect(screen.getByText('Sans')).toBeTruthy();
            expect(screen.getByText('Mono')).toBeTruthy();
        });

        it('shows theme buttons in appearance tab', () => {
            renderWithIntl(<DisplaySettings {...defaultProps} />);
            
            // Switch to appearance tab
            fireEvent.click(screen.getByTestId('icon-sun').closest('button'));
            
            expect(screen.getByText('System')).toBeTruthy();
            expect(screen.getByText('Light')).toBeTruthy();
            expect(screen.getByText('Dark')).toBeTruthy();
        });

        it('calls setTheme when theme button is clicked', () => {
            renderWithIntl(<DisplaySettings {...defaultProps} />);
            fireEvent.click(screen.getByTestId('icon-sun').closest('button')); // Appearance tab
            
            fireEvent.click(screen.getByText('Dark'));
            expect(defaultProps.setTheme).toHaveBeenCalledWith('dark');
        });

        it('shows dark variants when theme is dark', () => {
            renderWithIntl(<DisplaySettings {...defaultProps} theme="dark" />);
            fireEvent.click(screen.getByTestId('icon-sun').closest('button')); // Appearance tab
            
            expect(screen.getByText('Dark mode colors')).toBeTruthy();
            expect(screen.getByText('Dark Gold')).toBeTruthy();
        });

        it('shows language buttons in language tab', () => {
            renderWithIntl(<DisplaySettings {...defaultProps} />);
            fireEvent.click(screen.getByTestId('icon-globe').closest('button')); // Language tab
            
            expect(screen.getByText('English')).toBeTruthy();
            expect(screen.getByText('Polski')).toBeTruthy();
            expect(screen.getByText('Deutsch')).toBeTruthy();
        });

        it('shows comparison limit buttons in favorites tab', () => {
            renderWithIntl(<DisplaySettings {...defaultProps} />);
            fireEvent.click(screen.getByTitle('Favorites')); // Favorites tab
            
            expect(screen.getByText('Comparison Limit')).toBeTruthy();
            expect(screen.getByText('2')).toBeTruthy();
            expect(screen.getByText('6')).toBeTruthy();
        });

        it('shows info links in info tab', () => {
            renderWithIntl(<DisplaySettings {...defaultProps} />);
            fireEvent.click(screen.getByTitle('Info')); // Info tab
            
            expect(screen.getByText('Changelog')).toBeTruthy();
            expect(screen.getByText('O programie')).toBeTruthy();
        });

        it('calls internal state setters when diff mode is toggled', () => {
            renderWithIntl(<DisplaySettings {...defaultProps} />);
            fireEvent.click(screen.getByTitle('Favorites')); // Favorites tab
            
            const strictBtn = screen.getByText('Strict');
            const looseBtn = screen.getByText('Loose');
            
            // Initial state is usually loose or strict depending on localStorage
            fireEvent.click(strictBtn);
            expect(strictBtn.className).toContain('active');
            
            fireEvent.click(looseBtn);
            expect(looseBtn.className).toContain('active');
        });

        it('calls internal limit setter when comparison limit is clicked', () => {
            renderWithIntl(<DisplaySettings {...defaultProps} />);
            fireEvent.click(screen.getByTitle('Favorites')); // Favorites tab
            
            const limit4Btn = screen.getByText('4');
            fireEvent.click(limit4Btn);
            expect(limit4Btn.className).toContain('active');
        });

        it('renders favorite translations and allows toggling them off', async () => {
            const { safeLocalStorageGetItem } = await import('../../assets/js/safeStorage');
            safeLocalStorageGetItem.mockReturnValue(JSON.stringify(['pl-bg', 'pl-ubg']));
            
            const translations = [
                { id: 'pl-bg', name: 'Biblia Gdańska' },
                { id: 'pl-ubg', name: 'Uwspółcześniona BG' }
            ];
            
            const { container } = renderWithIntl(<DisplaySettings {...defaultProps} translations={translations} />);
            fireEvent.click(screen.getByTitle('Favorites')); // Favorites tab
            
            // Should render the favorites list
            expect(screen.getByText('Biblia Gdańska')).toBeTruthy();
            
            // Click to remove favorite
            const removeBtns = container.querySelectorAll('.favorite-remove');
            if(removeBtns.length > 0) {
                fireEvent.click(removeBtns[0]);
            }
        });

        it('shows or hides verse numbers toggle based on continuousText prop', () => {
            const setContinuousTextMock = vi.fn();
            const setHideVerseNumbersMock = vi.fn();

            // 1. When continuousText is false, the verse numbers visibility setting should NOT be rendered
            const { rerender } = renderWithIntl(
                <DisplaySettings
                    {...defaultProps}
                    continuousText={false}
                    setContinuousText={setContinuousTextMock}
                    setHideVerseNumbers={setHideVerseNumbersMock}
                />
            );
            expect(screen.queryByText('Widoczność numerów wersetów')).toBeNull();

            // 2. When continuousText is true, the verse numbers visibility setting should be rendered
            rerender(
                <IntlProvider locale="en" messages={messages}>
                    <DisplaySettings
                        {...defaultProps}
                        continuousText={true}
                        setContinuousText={setContinuousTextMock}
                        setHideVerseNumbers={setHideVerseNumbersMock}
                    />
                </IntlProvider>
            );
            expect(screen.getByText('Widoczność numerów wersetów')).toBeInTheDocument();

            // 3. Test changing hideVerseNumbers state
            const hideBtn = screen.getByText('Ukryj');
            fireEvent.click(hideBtn);
            expect(setHideVerseNumbersMock).toHaveBeenCalledWith(true);

            const showBtn = screen.getByText('Pokaż');
            fireEvent.click(showBtn);
            expect(setHideVerseNumbersMock).toHaveBeenCalledWith(false);
        });
    });
});
