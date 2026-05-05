import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChangelogModal from '../../assets/js/ChangelogModal';
import { IntlProvider } from 'react-intl';

const renderWithIntl = (component) => {
    return render(
        <IntlProvider locale="pl" messages={{
            changelogTitle: 'Historia zmian',
            close: 'Zamknij',
            loading: 'Ładowanie',
            unexpectedErrorOccurred: 'Wystąpił nieoczekiwany błąd'
        }}>
            {component}
        </IntlProvider>
    );
};

describe('ChangelogModal', () => {
    beforeEach(() => {
        globalThis.fetch = vi.fn();
    });

    it('does not fetch or render content if not open', () => {
        const { container } = renderWithIntl(<ChangelogModal isOpen={false} onClose={vi.fn()} />);
        expect(globalThis.fetch).not.toHaveBeenCalled();
        expect(container.querySelector('.changelog-overlay.active')).toBeNull();
    });

    it('loads and displays changelog text', async () => {
        globalThis.fetch.mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve('Version 1.0.0 Changelog Text')
        });

        renderWithIntl(<ChangelogModal isOpen={true} onClose={vi.fn()} />);

        expect(screen.getByText('Ładowanie...')).toBeTruthy();

        await waitFor(() => {
            expect(screen.getByText('Version 1.0.0 Changelog Text')).toBeTruthy();
        });
        expect(screen.getByText('Historia zmian')).toBeTruthy();
    });

    it('shows error if fetch fails', async () => {
        globalThis.fetch.mockResolvedValue({
            ok: false
        });

        renderWithIntl(<ChangelogModal isOpen={true} onClose={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText('Wystąpił nieoczekiwany błąd')).toBeTruthy();
        });
    });

    it('calls onClose when overlay or close button is clicked', async () => {
        globalThis.fetch.mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve('Changelog content')
        });

        const onClose = vi.fn();
        renderWithIntl(<ChangelogModal isOpen={true} onClose={onClose} />);

        // Wait for async fetch in useEffect to settle
        await waitFor(() => {
            expect(screen.getByText('Changelog content')).toBeTruthy();
        });

        const overlay = document.querySelector('.changelog-overlay');
        fireEvent.click(overlay);
        expect(onClose).toHaveBeenCalledTimes(1);

        const closeBtn = screen.getByLabelText('Zamknij');
        fireEvent.click(closeBtn);
        expect(onClose).toHaveBeenCalledTimes(2);
    });
});
