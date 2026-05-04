import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AboutModal from '../../assets/js/AboutModal';
import { IntlProvider } from 'react-intl';

const renderWithIntl = (component) => {
    return render(
        <IntlProvider locale="pl" messages={{
            aboutTitle: 'O programie',
            close: 'Zamknij',
            loading: 'Ładowanie',
            unexpectedErrorOccurred: 'Wystąpił nieoczekiwany błąd'
        }}>
            {component}
        </IntlProvider>
    );
};

describe('AboutModal', () => {
    beforeEach(() => {
        globalThis.fetch = vi.fn();
    });

    it('does not fetch or render content if not open', () => {
        const { container } = renderWithIntl(<AboutModal isOpen={false} onClose={vi.fn()} />);
        expect(globalThis.fetch).not.toHaveBeenCalled();
        expect(container.querySelector('.changelog-overlay.active')).toBeNull();
    });

    it('loads and displays about text', async () => {
        globalThis.fetch.mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve('Version 1.0.0 About Text')
        });

        renderWithIntl(<AboutModal isOpen={true} onClose={vi.fn()} />);

        expect(screen.getByText('Ładowanie...')).toBeTruthy();

        await waitFor(() => {
            expect(screen.getByText('Version 1.0.0 About Text')).toBeTruthy();
        });
        expect(screen.getByText('O programie')).toBeTruthy();
    });

    it('shows error if fetch fails', async () => {
        globalThis.fetch.mockResolvedValue({
            ok: false
        });

        renderWithIntl(<AboutModal isOpen={true} onClose={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText('Wystąpił nieoczekiwany błąd')).toBeTruthy();
        });
    });

    it('calls onClose when overlay or close button is clicked', () => {
        const onClose = vi.fn();
        renderWithIntl(<AboutModal isOpen={true} onClose={onClose} />);

        const overlay = document.querySelector('.changelog-overlay');
        fireEvent.click(overlay);
        expect(onClose).toHaveBeenCalledTimes(1);

        const closeBtn = screen.getByLabelText('Zamknij');
        fireEvent.click(closeBtn);
        expect(onClose).toHaveBeenCalledTimes(2);
    });
});
