import { describe, it, expect, vi, beforeEach } from 'vitest';
import Cookies from 'js-cookie';
import getDataFromCurrentPathname from '../../assets/js/getDataFromCurrentPathname';
import { DEFAULT_BOOK, DEFAULT_CHAPTER, DEFAULT_LANGUAGE, DEFAULT_TRANSLATION } from '../../assets/consts';

describe('getDataFromCurrentPathname', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setLocationPathname = (pathname) => {
    Object.defineProperty(window, 'location', {
      value: { pathname },
      writable: true,
    });
  };

  it('parses full URL path correctly', () => {
    setLocationPathname('/pl/pl_ubg/gen/3');
    const result = getDataFromCurrentPathname();
    expect(result).toEqual({
      language: 'pl',
      translation: 'pl_ubg',
      book: 'gen',
      chapter: '3'
    });
  });

  it('strips trailing slash', () => {
    setLocationPathname('/de/de_lut/mat/5/');
    const result = getDataFromCurrentPathname();
    expect(result).toEqual({
      language: 'de',
      translation: 'de_lut',
      book: 'mat',
      chapter: '5'
    });
  });

  it('falls back to default language if unsupported', () => {
    setLocationPathname('/fr/fr_tob/mat/1');
    const result = getDataFromCurrentPathname();
    expect(result.language).toBe(DEFAULT_LANGUAGE);
  });

  it('falls back to defaults if segments are missing', () => {
    setLocationPathname('/en');
    const result = getDataFromCurrentPathname();
    expect(result.translation).toBe(DEFAULT_TRANSLATION);
    expect(result.book).toBe(DEFAULT_BOOK);
    expect(result.chapter).toBe(DEFAULT_CHAPTER);
  });

  it('uses Cookies fallback for recent_translation and recent_book when missing in url', () => {
    setLocationPathname('/pl');
    Cookies.get.mockImplementation((key) => {
      if (key === 'recent_translation') return 'en_kjv';
      if (key === 'recent_book') return 'exo';
      return null;
    });

    const result = getDataFromCurrentPathname();
    expect(result.translation).toBe('en_kjv');
    expect(result.book).toBe('exo');
    // chapter doesn't have a cookie fallback, should use default
    expect(result.chapter).toBe(DEFAULT_CHAPTER);
  });
});
