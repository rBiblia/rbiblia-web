import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useVersesCache from '../../assets/js/useVersesCache';

// Mock safeJsonParse since it relies on Response which we mock via fetch
vi.mock('../../assets/js/safeJsonParse', () => ({
  safeJsonParse: vi.fn(async (response) => response.json()),
}));

describe('useVersesCache', () => {
  const locale = 'pl';
  
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.stubGlobal('requestIdleCallback', vi.fn((cb) => cb()));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('fetches verses and stores them in cache', async () => {
    const mockData = { 1: 'Werset 1', 2: 'Werset 2' };
    fetch.mockResolvedValueOnce({
      json: async () => ({ data: mockData })
    });

    const { result } = renderHook(() => useVersesCache(locale));

    let versesResult;
    await act(async () => {
      versesResult = await result.current.getVerses('pl_ubg', 'gen', '1');
    });

    expect(fetch).toHaveBeenCalledWith('/api/pl/translation/pl_ubg/book/gen/chapter/1');
    expect(versesResult.data).toEqual(mockData);
    expect(versesResult.fromCache).toBe(false);

    // Second call should come from cache
    let cacheResult;
    await act(async () => {
      cacheResult = await result.current.getVerses('pl_ubg', 'gen', '1');
    });

    expect(fetch).toHaveBeenCalledTimes(1); // No new fetch
    expect(cacheResult.data).toEqual(mockData);
    expect(cacheResult.fromCache).toBe(true);
  });

  it('has isInCache method that correctly identifies cached items', async () => {
    const mockData = { 1: 'Werset' };
    fetch.mockResolvedValueOnce({
      json: async () => ({ data: mockData })
    });

    const { result } = renderHook(() => useVersesCache(locale));
    
    expect(result.current.isInCache('pl_ubg', 'gen', '1')).toBe(false);

    await act(async () => {
      await result.current.getVerses('pl_ubg', 'gen', '1');
    });

    expect(result.current.isInCache('pl_ubg', 'gen', '1')).toBe(true);
  });

  it('can clear the cache', async () => {
    const mockData = { 1: 'Werset' };
    fetch.mockResolvedValueOnce({
      json: async () => ({ data: mockData })
    });
    fetch.mockResolvedValueOnce({
      json: async () => ({ data: mockData })
    });

    const { result } = renderHook(() => useVersesCache(locale));
    
    await act(async () => {
      await result.current.getVerses('pl_ubg', 'gen', '1');
    });
    
    expect(result.current.isInCache('pl_ubg', 'gen', '1')).toBe(true);

    act(() => {
      result.current.clearCache();
    });

    expect(result.current.isInCache('pl_ubg', 'gen', '1')).toBe(false);

    // Should fetch again after clear
    await act(async () => {
      await result.current.getVerses('pl_ubg', 'gen', '1');
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('evicts oldest entries when cache exceeds MAX_CACHE_SIZE', async () => {
    const { result } = renderHook(() => useVersesCache(locale));
    
    // Fill the cache (MAX_CACHE_SIZE is 50)
    for (let i = 1; i <= 51; i++) {
      fetch.mockResolvedValueOnce({
        json: async () => ({ data: { 1: `Chapter ${i}` } })
      });
      await act(async () => {
        await result.current.getVerses('pl_ubg', 'gen', i.toString());
      });
    }

    // The oldest entry (chapter 1) should be evicted
    expect(result.current.isInCache('pl_ubg', 'gen', '1')).toBe(false);
    
    // The newest entry (chapter 51) should still be in cache
    expect(result.current.isInCache('pl_ubg', 'gen', '51')).toBe(true);
  });

  it('prefetchAdjacent prefetches the next and previous chapters', async () => {
    fetch.mockResolvedValue({
      json: async () => ({ data: { 1: 'Text' } })
    });

    const { result } = renderHook(() => useVersesCache(locale));
    
    const structure = { gen: ['4', '5', '6'] };
    await act(async () => {
      await result.current.prefetchAdjacent('pl_ubg', 'gen', '5', structure);
    });

    // Should have called fetch for chapter 4 and chapter 6
    expect(fetch).toHaveBeenCalledWith('/api/pl/translation/pl_ubg/book/gen/chapter/4');
    expect(fetch).toHaveBeenCalledWith('/api/pl/translation/pl_ubg/book/gen/chapter/6');
    
    expect(result.current.isInCache('pl_ubg', 'gen', '4')).toBe(true);
    expect(result.current.isInCache('pl_ubg', 'gen', '6')).toBe(true);
  });
});
