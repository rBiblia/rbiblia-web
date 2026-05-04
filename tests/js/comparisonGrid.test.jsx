import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ComparisonGrid from '../../assets/js/ComparisonGrid';

vi.mock('react-intl', () => ({
  useIntl: () => ({
    formatMessage: ({ id }) => id,
    locale: 'pl'
  }),
}));

vi.mock('../../assets/js/SideMenu', () => ({
  getComparisonLimit: () => 2,
  getFavoriteTranslations: () => ['en_kjv'],
  isDiffModeStrict: () => false,
  FAVORITE_TRANSLATIONS_UPDATED_EVENT: 'FAVORITE_TRANSLATIONS_UPDATED'
}));

vi.mock('../../assets/js/safeJsonParse', () => ({
  safeJsonParse: vi.fn(async (response) => response.json()),
}));

describe('ComparisonGrid', () => {
  const defaultProps = {
    verseId: 1,
    bookId: "gen",
    bookName: "Rodzaju",
    bookSigil: "Rdz",
    chapterId: 1,
    currentTranslation: "pl_ubg",
    translations: [
      { id: "pl_ubg", name: "Uwspółcześniona Biblia Gdańska", language: "pl" },
      { id: "en_kjv", name: "King James Version", language: "en" }
    ],
    onClose: vi.fn(),
    onNavigateVerse: vi.fn(),
    totalVerses: 10
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn((url) => {
      // Return verse data matching the requested chapter/verse context
      if (url.includes('/chapter/')) {
        return Promise.resolve({
          json: () => Promise.resolve({ data: { 1: "Na początku", 2: "Ziemia zaś" } })
        });
      }
      return Promise.resolve({
        json: () => Promise.resolve({ data: { 1: "Na początku", 2: "Ziemia zaś" } })
      });
    });
  });

  it('renders the base comparison text and controls', async () => {
    render(<ComparisonGrid {...defaultProps} />);
    
    // Check titles
    expect(screen.getByText('Rodzaju')).toBeInTheDocument();
    
    // Check translation name
    expect(screen.getByText('Uwspółcześniona Biblia Gdańska')).toBeInTheDocument();
    
    // It should load the verse
    await waitFor(() => {
      expect(screen.getByText('Na początku')).toBeInTheDocument();
    });
  });

  it('navigates to next verse when button is clicked', async () => {
    render(<ComparisonGrid {...defaultProps} />);
    await waitFor(() => screen.getByText('Na początku'));
    
    const nextBtn = screen.getByTitle('nextVerse');
    expect(nextBtn).not.toBeDisabled();
    
    fireEvent.click(nextBtn);
    expect(defaultProps.onNavigateVerse).toHaveBeenCalledWith('next');
  });

  it('navigates to prev verse when button is clicked', async () => {
    render(<ComparisonGrid {...defaultProps} verseId={2} />);
    await waitFor(() => screen.getByText('Ziemia zaś'));
    
    const prevBtn = screen.getByTitle('previousVerse');
    expect(prevBtn).not.toBeDisabled();
    
    fireEvent.click(prevBtn);
    expect(defaultProps.onNavigateVerse).toHaveBeenCalledWith('prev');
  });

  it('disables prev button on first verse', async () => {
    render(<ComparisonGrid {...defaultProps} verseId={1} />);
    await waitFor(() => screen.getByText('Na początku'));
    
    const prevBtn = screen.getByTitle('previousVerse');
    expect(prevBtn).toBeDisabled();
  });

  it('handles keyboard navigation and diff toggle', async () => {
    const onNavigateVerse = vi.fn();
    const onClose = vi.fn();
    render(<ComparisonGrid {...defaultProps} verseId={2} onNavigateVerse={onNavigateVerse} onClose={onClose} />);
    
    await waitFor(() => screen.getByText('Ziemia zaś'));

    fireEvent.keyDown(globalThis.window, { key: 'ArrowLeft' });
    expect(onNavigateVerse).toHaveBeenCalledWith('prev');

    fireEvent.keyDown(globalThis.window, { key: 'ArrowRight' });
    expect(onNavigateVerse).toHaveBeenCalledWith('next');

    fireEvent.keyDown(globalThis.window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
    
    const toggleSwitch = screen.getByRole('checkbox', { name: /toggleDifferences/i });
    expect(toggleSwitch.checked).toBe(false); // default or local storage
    
    fireEvent.keyDown(globalThis.window, { key: 'd' });
    expect(toggleSwitch.checked).toBe(true);
  });

  it('renders strict mode diff', async () => {
    const sideMenu = await import('../../assets/js/SideMenu');
    sideMenu.isDiffModeStrict = () => true;
    
    // Trigger difference in text
    global.fetch = vi.fn((url) => {
        if (url.includes('pl_ubg')) {
            return Promise.resolve({ json: () => Promise.resolve({ data: { 1: "Na początku ziemi" } }) });
        }
        return Promise.resolve({ json: () => Promise.resolve({ data: { 1: "Na początku świata" } }) });
    });

    render(<ComparisonGrid {...defaultProps} />);
    
    await waitFor(() => {
        expect(screen.getByText('świata')).toBeInTheDocument();
    });

    // The word 'świata' should be marked since they are different
    const marks = document.querySelectorAll('mark.comparison-diff-word');
    expect(marks.length).toBeGreaterThan(0);
  });

  it('shows missing verse correctly', async () => {
    global.fetch = vi.fn((url) => {
        if (url.includes('pl_ubg')) {
            return Promise.resolve({ json: () => Promise.resolve({ data: { 1: "Na początku ziemi" } }) });
        }
        return Promise.resolve({ json: () => Promise.resolve({ data: { } }) }); // Not found for kjv
    });

    render(<ComparisonGrid {...defaultProps} />);
    
    await waitFor(() => {
        expect(screen.getByText('verseNotFoundInTranslation')).toBeInTheDocument();
    });
  });
});
