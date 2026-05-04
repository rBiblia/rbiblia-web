import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BookSelector from '../../assets/js/BookSelector';
import { IntlProvider } from 'react-intl';

const renderWithIntl = (component) => {
    return render(
        <IntlProvider locale="pl" messages={{
            bookList: 'Księgi'
        }}>
            {component}
        </IntlProvider>
    );
};

describe('BookSelector', () => {
    it('renders disabled state when structure is loading', () => {
        renderWithIntl(<BookSelector isStructureLoading={true} changeSelectedBook={vi.fn()} />);
        const select = screen.getByRole('combobox');
        expect(select.className).toContain('selector-disabled');
        expect(screen.getByText('Księgi')).toBeTruthy();
    });

    it('renders books and handles selection', () => {
        const changeSelectedBook = vi.fn();
        const books = {
            'Gen': { name: 'Genesis' },
            'Exo': { name: 'Exodus' }
        };
        const structure = {
            'Gen': [1, 2],
            'Exo': [1]
        };
        
        renderWithIntl(
            <BookSelector 
                isStructureLoading={false} 
                structure={structure}
                books={books}
                selectedBook="Gen"
                changeSelectedBook={changeSelectedBook} 
            />
        );
        
        const select = screen.getByRole('combobox');
        expect(select.value).toBe('Gen');
        
        const options = screen.getAllByRole('option');
        expect(options.length).toBe(2);
        expect(options[1].textContent).toBe('Exodus');
        
        fireEvent.change(select, { target: { value: 'Exo' } });
        expect(changeSelectedBook).toHaveBeenCalledWith('Exo');
    });
});
