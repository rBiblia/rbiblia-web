import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import useFocusTrap from '../../assets/js/hooks/useFocusTrap';
import { render, screen, fireEvent } from '@testing-library/react';

// A component to test useFocusTrap in DOM
const FocusTrapTestComponent = ({ isOpen, onClose }) => {
    const ref = useFocusTrap(isOpen, onClose);
    return (
        <div>
            <button data-testid="outside">Outside</button>
            <div ref={ref} data-testid="trap">
                <button className="close">Close</button>
                <input type="text" />
                <button>Submit</button>
            </div>
        </div>
    );
};

describe('useFocusTrap', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        document.body.innerHTML = '';
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('sets focus to a suitable element on open', () => {
        render(<FocusTrapTestComponent isOpen={true} onClose={vi.fn()} />);
        
        act(() => {
            vi.advanceTimersByTime(10);
        });

        const input = screen.getByRole('textbox');
        expect(document.activeElement).toBe(input);
    });

    it('calls onClose on Escape', () => {
        const onClose = vi.fn();
        render(<FocusTrapTestComponent isOpen={true} onClose={onClose} />);
        
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onClose).toHaveBeenCalled();
    });

    it('traps focus forward (Tab)', () => {
        render(<FocusTrapTestComponent isOpen={true} onClose={vi.fn()} />);
        
        act(() => {
            vi.advanceTimersByTime(10);
        });

        const buttons = screen.getAllByRole('button');
        const submitBtn = buttons[2]; // Outside, Close, Submit

        submitBtn.focus();
        expect(document.activeElement).toBe(submitBtn);

        fireEvent.keyDown(document, { key: 'Tab' });
        
        const closeBtn = buttons[1];
        expect(document.activeElement).toBe(closeBtn);
    });

    it('traps focus backward (Shift+Tab)', () => {
        render(<FocusTrapTestComponent isOpen={true} onClose={vi.fn()} />);
        
        act(() => {
            vi.advanceTimersByTime(10);
        });

        const buttons = screen.getAllByRole('button');
        const closeBtn = buttons[1];

        closeBtn.focus();
        expect(document.activeElement).toBe(closeBtn);

        fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
        
        const submitBtn = buttons[2];
        expect(document.activeElement).toBe(submitBtn);
    });
});
