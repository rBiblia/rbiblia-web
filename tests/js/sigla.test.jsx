import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import SelectionGrid from '../../assets/js/SelectionGrid';

// Mock react-intl
vi.mock('react-intl', () => ({
  useIntl: () => ({
    formatMessage: ({ id }) => id,
  }),
}));

describe('SelectionGrid sigla logic', () => {
  const mockBooks = {
    gen: { name: 'Rodzaju', sigla: 'Rdz', group: 'ot' },
    mat: { name: 'Ewangelia Mateusza', sigla: 'Mt', group: 'nt' },
    xyz: { name: 'Unknown', group: 'ot' } // No sigla
  };

  const mockStructure = {
    gen: [1, 2, 3],
    mat: [1, 2],
    xyz: [1]
  };

  const renderComponent = () => {
    return render(
      <SelectionGrid
        books={mockBooks}
        structure={mockStructure}
        onSelectChapter={vi.fn()}
        onClose={vi.fn()}
      />
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default to desktop width
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
  });

  it('renders full book names on desktop', () => {
    renderComponent();
    expect(screen.getByText('Rodzaju')).toBeInTheDocument();
    expect(screen.getByText('Ewangelia Mateusza')).toBeInTheDocument();
    expect(screen.getByText('Unknown')).toBeInTheDocument(); // fallback
  });

  it('renders sigla on mobile viewport', () => {
    // Set to mobile width
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });
    
    renderComponent();
    
    expect(screen.getByText('Rdz')).toBeInTheDocument();
    expect(screen.getByText('Mt')).toBeInTheDocument();
    // For book without sigla, it falls back to uppercase ID
    expect(screen.getByText('XYZ')).toBeInTheDocument();
  });
});
