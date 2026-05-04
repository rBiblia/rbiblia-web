import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import WelcomePopup, { isWelcomePopupDisabled } from '../../assets/js/WelcomePopup';
import * as safeStorage from '../../assets/js/safeStorage';

vi.mock('../../assets/js/hooks/useFocusTrap', () => ({
    default: vi.fn().mockReturnValue({ current: null })
}));

describe('WelcomePopup', () => {
    beforeEach(() => {
        vi.spyOn(safeStorage, 'safeLocalStorageGetItem').mockReturnValue(null);
        vi.spyOn(safeStorage, 'safeLocalStorageSetItem').mockReturnValue(true);
        vi.spyOn(safeStorage, 'safeLocalStorageRemoveItem').mockReturnValue(true);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('returns null if isOpen is false', () => {
        const { container } = render(<WelcomePopup isOpen={false} onClose={vi.fn()} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders popup if isOpen is true', () => {
        render(<WelcomePopup isOpen={true} onClose={vi.fn()} />);
        expect(screen.getByText('Witamy w rBiblia Web')).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
        const onClose = vi.fn();
        render(<WelcomePopup isOpen={true} onClose={onClose} />);
        fireEvent.click(screen.getByRole('button', { name: 'Zamknij' }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('toggles dont show again checkbox and updates localStorage', () => {
        render(<WelcomePopup isOpen={true} onClose={vi.fn()} />);
        
        const checkbox = screen.getByRole('checkbox');
        expect(checkbox).not.toBeChecked();

        fireEvent.click(checkbox);
        expect(checkbox).toBeChecked();
        expect(safeStorage.safeLocalStorageSetItem).toHaveBeenCalledWith('rbiblia_disable_welcome_popup', '1');

        fireEvent.click(checkbox);
        expect(checkbox).not.toBeChecked();
        expect(safeStorage.safeLocalStorageRemoveItem).toHaveBeenCalledWith('rbiblia_disable_welcome_popup');
    });

    it('initializes checkbox based on isWelcomePopupDisabled', () => {
        safeStorage.safeLocalStorageGetItem.mockReturnValue('1');
        
        render(<WelcomePopup isOpen={true} onClose={vi.fn()} />);
        expect(screen.getByRole('checkbox')).toBeChecked();
        expect(isWelcomePopupDisabled()).toBe(true);
    });
});
