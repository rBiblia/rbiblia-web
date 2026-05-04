import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ChapterSelector from '../../assets/js/ChapterSelector';
import { IntlProvider } from 'react-intl';

const renderWithIntl = (component) => {
    return render(
        <IntlProvider locale="pl" messages={{
            chapterList: 'Rozdziały'
        }}>
            {component}
        </IntlProvider>
    );
};

describe('ChapterSelector', () => {
    it('renders disabled state when structure is loading or chapters empty', () => {
        renderWithIntl(<ChapterSelector isStructureLoading={true} chapters={[]} changeSelectedChapter={vi.fn()} />);
        const select = screen.getByRole('combobox');
        expect(select.className).toContain('selector-disabled');
        expect(screen.getByText('Rozdziały')).toBeTruthy();
    });

    it('renders chapters and handles selection', () => {
        const changeSelectedChapter = vi.fn();
        const chapters = [1, 2, 3];
        renderWithIntl(
            <ChapterSelector 
                isStructureLoading={false} 
                chapters={chapters} 
                selectedChapter={2}
                changeSelectedChapter={changeSelectedChapter} 
            />
        );
        
        const select = screen.getByRole('combobox');
        expect(select.value).toBe('2');
        
        const options = screen.getAllByRole('option');
        expect(options.length).toBe(3);
        
        fireEvent.change(select, { target: { value: '3' } });
        expect(changeSelectedChapter).toHaveBeenCalledWith('3');
    });
});
