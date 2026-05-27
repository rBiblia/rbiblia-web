import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Verse from '../../assets/js/Verse';

// Mock react-intl
vi.mock('react-intl', () => ({
  useIntl: () => ({
    formatMessage: ({ id }) => id,
  }),
}));

describe('Verse component', () => {
  let errorSpy;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });
  const defaultProps = {
    verseId: "1",
    chapterId: "1",
    bookId: "gen",
    verseContent: "Na początku Bóg stworzył niebo i ziemię.",
    isHighlighted: false,
    allNotes: {},
  };

  it('renders verse number and content', () => {
    render(<Verse {...defaultProps} />);
    expect(screen.getByText('1:1')).toBeInTheDocument();
    expect(screen.getByText('Na początku Bóg stworzył niebo i ziemię.')).toBeInTheDocument();
  });

  it('adds highlighted class when isHighlighted prop is true', () => {
    const { container } = render(<Verse {...defaultProps} isHighlighted={true} />);
    expect(container.firstChild).toHaveClass('highlighted');
  });

  it('adds has-note class when verse has a note in allNotes', () => {
    const propsWithNote = {
      ...defaultProps,
      allNotes: { "gen_1_1": "This is a note" }
    };
    const { container } = render(<Verse {...propsWithNote} />);
    expect(container.firstChild).toHaveClass('has-note');
    expect(screen.getByText('This is a note')).toBeInTheDocument();
  });

  it('renders dataset attributes on the outermost element in both layouts', () => {
    // 1. Block layout
    const { container: blockContainer } = render(<Verse {...defaultProps} />);
    const blockOuter = blockContainer.firstChild;
    expect(blockOuter.dataset.verseId).toBe("1");
    expect(blockOuter.dataset.bookId).toBe("gen");
    expect(blockOuter.dataset.chapterId).toBe("1");

    // 2. Continuous layout
    const { container: contContainer } = render(<Verse {...defaultProps} continuousText={true} />);
    const contOuter = contContainer.firstChild;
    expect(contOuter.dataset.verseId).toBe("1");
    expect(contOuter.dataset.bookId).toBe("gen");
    expect(contOuter.dataset.chapterId).toBe("1");
  });

  it('renders translation notes and allows expanding/collapsing long notes', () => {
    const longNoteText = "This is a very long note text that exceeds the threshold of 80 characters. " + 
                         "It is so long that it should definitely trigger the show more button to appear.";
    const propsWithTranslationNote = {
      ...defaultProps,
      translationId: "pl-bg",
      translationName: "BG",
      allTranslationNotes: { "pl-bg:gen_1_1": longNoteText }
    };
    
    const { container } = render(<Verse {...propsWithTranslationNote} />);
    expect(container.firstChild).toHaveClass('has-note');
    
    expect(screen.getByText(longNoteText)).toBeInTheDocument();
    
    const toggleBtn = screen.getByText('showMore');
    expect(toggleBtn).toBeInTheDocument();
    
    fireEvent.click(toggleBtn);
    expect(screen.getByText('showLess')).toBeInTheDocument();
  });

  it('blocks deep link if shouldBlockAppDeepLink returns true', () => {
    // Mock matchMedia to simulate mobile
    Object.defineProperty(globalThis, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query.includes('max-width') || query.includes('pointer: coarse'),
      })),
    });

    render(<Verse {...defaultProps} />);
    
    const link = screen.getByText('1:1');
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    let prevented = false;
    clickEvent.preventDefault = () => { prevented = true; };
    
    fireEvent(link, clickEvent);
    expect(prevented).toBe(true);
  });

  it('renders inline span and standard-sized verse link in continuous text mode', () => {
    const { container } = render(<Verse {...defaultProps} continuousText={true} />);
    
    // In continuous text mode, the main tag is a SPAN with class 'verse-continuous'
    expect(container.firstChild.tagName).toBe('SPAN');
    expect(container.firstChild).toHaveClass('verse-continuous');
    expect(container.firstChild).toHaveClass('verse');
    
    // It should render standard-sized verse link inside a .verse-number-inline
    const numberContainer = container.querySelector('.verse-number-inline');
    expect(numberContainer).toBeTruthy();
    expect(numberContainer.querySelector('a')).toBeTruthy();
    expect(screen.getByText('1')).toBeInTheDocument(); // link text is just the verseId "1" instead of "1:1"
    
    expect(screen.getByText('Na początku Bóg stworzył niebo i ziemię.')).toBeInTheDocument();
  });

  it('hides verse numbers when hideVerseNumbers is true ONLY in continuous mode', () => {
    // 1. Block Mode - Should NOT hide verse numbers even if hideVerseNumbers is true
    const { container: blockContainer } = render(<Verse {...defaultProps} hideVerseNumbers={true} />);
    const blockNumberCell = blockContainer.querySelector('.verse-number-cell');
    expect(blockNumberCell).not.toHaveClass('d-none');
    const blockVerseWrapper = blockContainer.querySelector('.verse');
    expect(blockVerseWrapper).toHaveClass('col-10');

    // 2. Continuous Mode - Should hide verse numbers
    const { container: contContainer } = render(<Verse {...defaultProps} continuousText={true} hideVerseNumbers={true} />);
    const contNumberSpan = contContainer.querySelector('.verse-number-inline');
    expect(contNumberSpan).toHaveClass('d-none');
  });
});
