import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LanguageSelector from '../../assets/js/LanguageSelector';
import { IntlProvider } from 'react-intl';

const renderWithIntl = (component, locale = 'pl') => {
    return render(
        <IntlProvider locale={locale} messages={{}}>
            {component}
        </IntlProvider>
    );
};

// Mock constants
vi.mock('../../assets/consts', () => ({
    LANGUAGES: {
        'pl': 'Polski',
        'en': 'English',
        'de': 'Deutsch'
    }
}));

describe('LanguageSelector', () => {
    it('renders language options and selects current locale', () => {
        const setLocale = vi.fn();
        renderWithIntl(<LanguageSelector setLocaleAndUpdateHistory={setLocale} />, 'pl');
        
        const select = screen.getByRole('combobox');
        expect(select.value).toBe('pl');
        
        const options = screen.getAllByRole('option');
        expect(options.length).toBe(3);
        expect(options[0].value).toBe('pl');
        expect(options[0].textContent).toBe('Polski');
    });

    it('calls setLocaleAndUpdateHistory when selection changes', () => {
        const setLocale = vi.fn();
        renderWithIntl(<LanguageSelector setLocaleAndUpdateHistory={setLocale} />, 'pl');
        
        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: 'en' } });
        
        expect(setLocale).toHaveBeenCalledWith('en');
    });
});
