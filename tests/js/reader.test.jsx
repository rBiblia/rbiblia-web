import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Reader from '../../assets/js/Reader';

vi.mock('../../assets/js/Verse', () => ({
    default: ({ verseId, verseContent, isHighlighted, bookId, chapterId }) => (
        <div 
            className={`verse line ${isHighlighted ? 'highlight' : ''}`}
            data-verse-id={verseId}
            data-book-id={bookId}
            data-chapter-id={chapterId}
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
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

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
        
        expect(onVerseClick).toHaveBeenCalledWith('1', 'gen', '1');
    });

    it('calls onVerseClick when Enter is pressed on a verse', () => {
        const onVerseClick = vi.fn();
        render(<Reader {...defaultProps} onVerseClick={onVerseClick} />);
        
        const verseEl = screen.getByTestId('verse-1');
        fireEvent.keyDown(verseEl, { key: 'Enter' });
        
        expect(onVerseClick).toHaveBeenCalledWith('1', 'gen', '1');
    });

    it('renders side-by-side columns for current and next chapter in continuousText mode', () => {
        const continuousProps = {
            ...defaultProps,
            continuousText: true,
            selectedBookName: 'Księga Rodzaju',
            nextVerses: {
                '1': 'And it came to pass...',
                '2': 'And God said...'
            },
            nextChapterBookId: 'gen',
            nextChapterId: 2,
            nextChapterBookName: 'Księga Rodzaju'
        };

        const { container } = render(<Reader {...continuousProps} />);

        // Verify container elements and column headers
        expect(screen.getByText('Księga Rodzaju 1')).toBeInTheDocument();
        expect(screen.getByText('Księga Rodzaju 2')).toBeInTheDocument();

        // Verify current chapter verse exists and has correct bookId and chapterId
        const currentVerseEl = screen.getByText('In the beginning God created the heaven and the earth.');
        expect(currentVerseEl).toBeInTheDocument();
        expect(currentVerseEl.dataset.bookId).toBe('gen');
        expect(currentVerseEl.dataset.chapterId).toBe('1');

        // Verify next chapter verse exists and has correct bookId and chapterId
        const nextVerseEl = screen.getByText('And it came to pass...');
        expect(nextVerseEl).toBeInTheDocument();
        expect(nextVerseEl.dataset.bookId).toBe('gen');
        expect(nextVerseEl.dataset.chapterId).toBe('2');

        // Verify layout columns are present
        const currentCol = container.querySelector('.reader-current-chapter');
        const nextCol = container.querySelector('.reader-next-chapter');
        expect(currentCol).toBeTruthy();
        expect(nextCol).toBeTruthy();
        expect(currentCol).toHaveClass('col-md-6');
        expect(nextCol).toHaveClass('col-md-6');
    });
});
