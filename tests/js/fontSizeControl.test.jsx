import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import FontSizeControl from '../../assets/js/FontSizeControl';
import * as safeStorage from '../../assets/js/safeStorage';

describe('FontSizeControl', () => {
    beforeEach(() => {
        vi.spyOn(safeStorage, 'safeLocalStorageGetItem').mockReturnValue(null);
        vi.spyOn(safeStorage, 'safeLocalStorageSetItem').mockReturnValue(true);
        document.documentElement.style.removeProperty('--verse-font-size');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders toggle button', () => {
        render(<FontSizeControl />);
        expect(screen.getByRole('button', { name: 'Change font size' })).toBeInTheDocument();
    });

    it('expands panel when toggle is clicked', () => {
        render(<FontSizeControl />);
        
        expect(screen.queryByText('A-')).not.toBeInTheDocument();
        
        fireEvent.click(screen.getByRole('button', { name: 'Change font size' }));
        
        expect(screen.getByText('A-')).toBeInTheDocument();
        expect(screen.getByText('A+')).toBeInTheDocument();
        expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('increases font size', () => {
        render(<FontSizeControl />);
        fireEvent.click(screen.getByRole('button', { name: 'Change font size' }));
        
        const increaseBtn = screen.getByRole('button', { name: 'Increase font size' });
        fireEvent.click(increaseBtn);
        
        expect(screen.getByText('109%')).toBeInTheDocument();
        expect(parseFloat(document.documentElement.style.getPropertyValue('--verse-font-size'))).toBeCloseTo(1.25);
    });

    it('decreases font size', () => {
        render(<FontSizeControl />);
        fireEvent.click(screen.getByRole('button', { name: 'Change font size' }));
        
        const decreaseBtn = screen.getByRole('button', { name: 'Decrease font size' });
        fireEvent.click(decreaseBtn);
        
        expect(screen.getByText('91%')).toBeInTheDocument();
        expect(parseFloat(document.documentElement.style.getPropertyValue('--verse-font-size'))).toBeCloseTo(1.05);
    });

    it('respects min and max bounds', () => {
        render(<FontSizeControl />);
        fireEvent.click(screen.getByRole('button', { name: 'Change font size' }));
        
        const decreaseBtn = screen.getByRole('button', { name: 'Decrease font size' });
        for(let i=0; i<10; i++) fireEvent.click(decreaseBtn);
        
        expect(screen.getByText('70%')).toBeInTheDocument();
        expect(decreaseBtn).toBeDisabled();

        const increaseBtn = screen.getByRole('button', { name: 'Increase font size' });
        for(let i=0; i<20; i++) fireEvent.click(increaseBtn);
        
        expect(screen.getByText('139%')).toBeInTheDocument();
        expect(increaseBtn).toBeDisabled();
    });

    it('resets font size', () => {
        render(<FontSizeControl />);
        fireEvent.click(screen.getByRole('button', { name: 'Change font size' }));
        
        fireEvent.click(screen.getByRole('button', { name: 'Increase font size' }));
        expect(screen.getByText('109%')).toBeInTheDocument();

        fireEvent.click(screen.getByText('109%'));
        expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('loads initial value from localStorage', () => {
        safeStorage.safeLocalStorageGetItem.mockReturnValue('1.35');
        render(<FontSizeControl />);
        fireEvent.click(screen.getByRole('button', { name: 'Change font size' }));
        
        expect(screen.getByText('117%')).toBeInTheDocument();
        expect(document.documentElement.style.getPropertyValue('--verse-font-size')).toBe('1.35rem');
    });
});
