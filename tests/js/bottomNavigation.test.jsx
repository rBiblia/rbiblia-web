import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IntlProvider } from 'react-intl';
import BottomNavigation from '../../assets/js/BottomNavigation';
import blurOnTouchInteraction from '../../assets/js/blurOnTouchInteraction';

vi.mock('../../assets/js/useScrollDirection', () => ({
    default: vi.fn().mockReturnValue(true)
}));

vi.mock('../../assets/js/blurOnTouchInteraction', () => ({
    default: vi.fn()
}));

describe('BottomNavigation', () => {
    const defaultProps = {
        onPrevChapter: vi.fn(),
        onNextChapter: vi.fn(),
        onOpenSelection: vi.fn(),
        onOpenNotes: vi.fn(),
        onOpenChapterComparison: vi.fn(),
        isPrevAvailable: true,
        isNextAvailable: true,
        currentBook: 'Rdz',
        currentChapter: 1,
    };

    const renderWithIntl = (props = {}) => {
        return render(
            <IntlProvider locale="en" messages={{
                previousChapter: 'Previous Chapter',
                nextChapter: 'Next Chapter',
                notes: 'Notes',
                selectBook: 'Select Book',
                chapterComparison: 'Chapter Comparison'
            }}>
                <BottomNavigation {...defaultProps} {...props} />
            </IntlProvider>
        );
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders all navigation buttons', () => {
        renderWithIntl();
        
        expect(screen.getByRole('button', { name: 'Previous Chapter' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Next Chapter' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Notes' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Select Book' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Chapter Comparison' })).toBeInTheDocument();
    });

    it('displays current book and chapter', () => {
        renderWithIntl();
        expect(screen.getByText('Rdz 1')).toBeInTheDocument();
    });

    it('disables previous button when isPrevAvailable is false', () => {
        renderWithIntl({ isPrevAvailable: false });
        expect(screen.getByRole('button', { name: 'Previous Chapter' })).toBeDisabled();
    });

    it('disables next button when isNextAvailable is false', () => {
        renderWithIntl({ isNextAvailable: false });
        expect(screen.getByRole('button', { name: 'Next Chapter' })).toBeDisabled();
    });

    it('calls appropriate handlers on button clicks', () => {
        renderWithIntl();
        
        fireEvent.click(screen.getByRole('button', { name: 'Previous Chapter' }));
        expect(defaultProps.onPrevChapter).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole('button', { name: 'Next Chapter' }));
        expect(defaultProps.onNextChapter).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole('button', { name: 'Notes' }));
        expect(defaultProps.onOpenNotes).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole('button', { name: 'Select Book' }));
        expect(defaultProps.onOpenSelection).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole('button', { name: 'Chapter Comparison' }));
        expect(defaultProps.onOpenChapterComparison).toHaveBeenCalledTimes(1);
    });

    it('calls blurOnTouchInteraction on prev/next buttons pointer events', () => {
        renderWithIntl();
        
        const prevBtn = screen.getByRole('button', { name: 'Previous Chapter' });
        fireEvent.pointerUp(prevBtn);
        fireEvent.touchEnd(prevBtn);
        
        expect(blurOnTouchInteraction).toHaveBeenCalledTimes(2);
    });
});
