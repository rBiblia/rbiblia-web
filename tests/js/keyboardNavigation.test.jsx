import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import useKeyboardNavigation from '../../assets/js/hooks/useKeyboardNavigation';

describe('useKeyboardNavigation', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  const fireKey = (key) => {
    const event = new KeyboardEvent('keydown', { key });
    globalThis.dispatchEvent(event);
  };

  it('calls onPrevChapter when ArrowLeft is pressed', () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    
    const { unmount } = renderHook(() => useKeyboardNavigation(onPrev, onNext));
    
    fireKey('ArrowLeft');
    
    expect(onPrev).toHaveBeenCalledTimes(1);
    expect(onNext).not.toHaveBeenCalled();
    
    unmount();
  });

  it('calls onNextChapter when ArrowRight is pressed', () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    
    const { unmount } = renderHook(() => useKeyboardNavigation(onPrev, onNext));
    
    fireKey('ArrowRight');
    
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onPrev).not.toHaveBeenCalled();
    
    unmount();
  });

  it('does nothing when disabled', () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    
    const { unmount } = renderHook(() => useKeyboardNavigation(onPrev, onNext, { enabled: false }));
    
    fireKey('ArrowRight');
    fireKey('ArrowLeft');
    
    expect(onPrev).not.toHaveBeenCalled();
    expect(onNext).not.toHaveBeenCalled();
    
    unmount();
  });

  it('ignores keydown if input is focused', () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    
    const { unmount } = renderHook(() => useKeyboardNavigation(onPrev, onNext));
    
    // Create an input and focus it
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    
    fireKey('ArrowRight');
    fireKey('ArrowLeft');
    
    expect(onPrev).not.toHaveBeenCalled();
    expect(onNext).not.toHaveBeenCalled();
    
    // Clean up
    document.body.removeChild(input);
    unmount();
  });
  
  it('ignores keydown if contenteditable is focused', () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    
    const { unmount } = renderHook(() => useKeyboardNavigation(onPrev, onNext));
    
    const div = document.createElement('div');
    Object.defineProperty(div, 'isContentEditable', { value: true, configurable: true });
    div.tabIndex = 0; // Ensure it can be focused in jsdom
    document.body.appendChild(div);
    div.focus();
    
    // Fallback: mock document.activeElement if focus fails in jsdom
    const activeElementSpy = vi.spyOn(document, 'activeElement', 'get').mockReturnValue(div);
    
    fireKey('ArrowRight');
    
    expect(onNext).not.toHaveBeenCalled();
    
    activeElementSpy.mockRestore();
    document.body.removeChild(div);
    unmount();
  });
});
