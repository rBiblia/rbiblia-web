import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IntlProvider } from 'react-intl';
import SelectionGrid from '../../assets/js/SelectionGrid';

const messages = {
    selectBook: 'Select Book',
    selectChapter: 'Select Chapter',
    backToBooks: 'Back to Books',
    oldTestament: 'Old Testament',
    newTestament: 'New Testament',
    deuterocanonicalBooks: 'Deuterocanonical',
    otherBooks: 'Other'
};

const mockBooks = {
    'gen': { name: 'Genesis', sigla: 'Rdz', group: 'ot' },
    'mat': { name: 'Matthew', sigla: 'Mt', group: 'nt' },
    'sir': { name: 'Sirach', sigla: 'Syr', group: 'dc' },
    'test': { name: 'TestBook', sigla: 'Tb', group: 'other' }
};

const mockStructure = {
    'gen': [1, 2, 3],
    'mat': [1, 2],
    'sir': [1],
    'test': [1]
};

describe('SelectionGrid', () => {
    beforeEach(() => {
        Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    });

    const renderGrid = (props = {}) => {
        return render(
            <IntlProvider locale="en" messages={messages}>
                <SelectionGrid 
                    books={mockBooks}
                    structure={mockStructure}
                    onSelectChapter={vi.fn()}
                    onClose={vi.fn()}
                    {...props}
                />
            </IntlProvider>
        );
    };

    it('renders books view initially if no initialBook is provided', () => {
        renderGrid();
        expect(screen.getByText('Old Testament')).toBeInTheDocument();
        expect(screen.getByText('New Testament')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Genesis' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Matthew' })).toBeInTheDocument();
    });

    it('renders chapters view initially if initialBook is provided', () => {
        renderGrid({ initialBook: 'gen' });
        expect(screen.getByText('Genesis - Select Chapter')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.queryByText('Old Testament')).not.toBeInTheDocument();
    });

    it('switches to chapters view when a book is clicked', () => {
        renderGrid();
        fireEvent.click(screen.getByRole('button', { name: 'Genesis' }));
        
        expect(screen.getByText('Genesis - Select Chapter')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    });

    it('returns to books view when Back button is clicked', () => {
        renderGrid({ initialBook: 'gen' });
        fireEvent.click(screen.getByRole('button', { name: 'Back to Books' }));
        
        expect(screen.getByText('Select Book')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Genesis' })).toBeInTheDocument();
    });

    it('calls onSelectChapter and onClose when a chapter is clicked', () => {
        const onSelectChapter = vi.fn();
        const onClose = vi.fn();
        renderGrid({ initialBook: 'gen', onSelectChapter, onClose });
        
        fireEvent.click(screen.getByRole('button', { name: '2' }));
        
        expect(onSelectChapter).toHaveBeenCalledWith('gen', 2);
        expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when close button is clicked', () => {
        const onClose = vi.fn();
        const { container } = renderGrid({ onClose });
        
        const closeBtn = container.querySelector('.btn-close');
        fireEvent.click(closeBtn);
        
        expect(onClose).toHaveBeenCalled();
    });

    it('highlights current book and chapter', () => {
        renderGrid({ currentBook: 'mat', currentChapter: 2 });
        
        const matBtn = screen.getByRole('button', { name: 'Matthew' });
        expect(matBtn).toHaveClass('tile-active');

        fireEvent.click(matBtn);
        const chapter2Btn = screen.getByRole('button', { name: '2' });
        expect(chapter2Btn).toHaveClass('tile-active');
    });

    it('renders compact view with sigla on mobile', () => {
        window.innerWidth = 500; 
        renderGrid();
        
        expect(screen.getByRole('button', { name: 'Rdz' })).toHaveTextContent('Rdz');
        expect(screen.getByRole('button', { name: 'Mt' })).toHaveTextContent('Mt');
    });
});
