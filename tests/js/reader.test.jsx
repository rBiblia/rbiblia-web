import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Reader from '../../assets/js/Reader';

vi.mock('../../assets/js/Verse', () => ({
    default: ({ verseId, verseContent, isHighlighted }) => (
        <div 
            className={`verse ${isHighlighted ? 'highlight' : ''}`}
            data-verse-id={verseId}
            data-testid={`verse-${verseId}`}
        >
            {verseContent}
        </div>
    )
}));

vi.mock('../../assets/js/SkeletonLoader', () => ({
    default: () => <div data-testid="skeleton-loader">Loading...</div>
}));

describe('Reader', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    const defaultProps = {
        selectedBook: 'gen',
        selectedChapter: 1,
        selectedTranslation: 'kjv',
        translationName: 'KJV',
        verses: {
            '1': 'In the beginning God created the heaven and the earth.',
            '2': 'And the earth was without form...'
        },
        showVerses: true,
        onVerseClick: vi.fn(),
        onVerseLongPress: vi.fn(),
        onVerseCompare: vi.fn(),
    };

    it('renders SkeletonLoader when showVerses is false', () => {
        render(<Reader {...defaultProps} showVerses={false} />);
        expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
        expect(screen.queryByTestId('verse-1')).not.toBeInTheDocument();
    });

    it('renders verses when showVerses is true', () => {
        render(<Reader {...defaultProps} />);
        expect(screen.getByTestId('verse-1')).toBeInTheDocument();
        expect(screen.getByTestId('verse-2')).toBeInTheDocument();
        expect(screen.getByText('In the beginning God created the heaven and the earth.')).toBeInTheDocument();
    });

    it('passes isHighlighted to highlighted verse', () => {
        render(<Reader {...defaultProps} highlightedVerse="2" />);
        expect(screen.getByTestId('verse-2')).toHaveClass('highlight');
        expect(screen.getByTestId('verse-1')).not.toHaveClass('highlight');
    });

    it('calls onVerseClick when a verse is clicked', () => {
        const onVerseClick = vi.fn();
        render(<Reader {...defaultProps} onVerseClick={onVerseClick} />);
        
        const verseEl = screen.getByTestId('verse-1');
        fireEvent.click(verseEl);
        
        expect(onVerseClick).toHaveBeenCalledWith('1');
    });

    it('calls onVerseClick when Enter is pressed on a verse', () => {
        const onVerseClick = vi.fn();
        render(<Reader {...defaultProps} onVerseClick={onVerseClick} />);
        
        const verseEl = screen.getByTestId('verse-1');
        fireEvent.keyDown(verseEl, { key: 'Enter' });
        
        expect(onVerseClick).toHaveBeenCalledWith('1');
    });

    it('triggers long press via mouse events', () => {
        const onVerseLongPress = vi.fn();
        render(<Reader {...defaultProps} onVerseLongPress={onVerseLongPress} />);
        
        const verseEl = screen.getByTestId('verse-2');
        
        fireEvent.mouseDown(verseEl, { button: 0, clientX: 100, clientY: 100 });
        
        act(() => {
            vi.advanceTimersByTime(500);
        });
        
        expect(onVerseLongPress).toHaveBeenCalledWith('2');
        
        const onVerseClick = vi.fn();
        fireEvent.click(verseEl);
        expect(onVerseClick).not.toHaveBeenCalled();
    });

    it('cancels long press on mouse move', () => {
        const onVerseLongPress = vi.fn();
        render(<Reader {...defaultProps} onVerseLongPress={onVerseLongPress} />);
        
        const verseEl = screen.getByTestId('verse-1');
        
        fireEvent.mouseDown(verseEl, { button: 0, clientX: 100, clientY: 100 });
        fireEvent.mouseMove(verseEl, { clientX: 120, clientY: 120 });
        
        act(() => {
            vi.advanceTimersByTime(500);
        });
        
        expect(onVerseLongPress).not.toHaveBeenCalled();
    });

    it('triggers long press via touch events', () => {
        const onVerseLongPress = vi.fn();
        render(<Reader {...defaultProps} onVerseLongPress={onVerseLongPress} />);
        
        const verseEl = screen.getByTestId('verse-1');
        
        fireEvent.touchStart(verseEl, {
            touches: [{ clientX: 50, clientY: 50 }]
        });
        
        act(() => {
            vi.advanceTimersByTime(500);
        });
        
        expect(onVerseLongPress).toHaveBeenCalledWith('1');
    });

    it('cancels long press on touch move', () => {
        const onVerseLongPress = vi.fn();
        render(<Reader {...defaultProps} onVerseLongPress={onVerseLongPress} />);
        
        const verseEl = screen.getByTestId('verse-1');
        
        fireEvent.touchStart(verseEl, {
            touches: [{ clientX: 50, clientY: 50 }]
        });
        
        fireEvent.touchMove(verseEl, {
            touches: [{ clientX: 70, clientY: 70 }]
        });
        
        act(() => {
            vi.advanceTimersByTime(500);
        });
        
        expect(onVerseLongPress).not.toHaveBeenCalled();
    });

    it('cancels long press on touch end', () => {
        const onVerseLongPress = vi.fn();
        render(<Reader {...defaultProps} onVerseLongPress={onVerseLongPress} />);
        
        const verseEl = screen.getByTestId('verse-1');
        
        fireEvent.touchStart(verseEl, {
            touches: [{ clientX: 50, clientY: 50 }]
        });
        
        fireEvent.touchEnd(verseEl);
        
        act(() => {
            vi.advanceTimersByTime(500);
        });
        
        expect(onVerseLongPress).not.toHaveBeenCalled();
    });
});
