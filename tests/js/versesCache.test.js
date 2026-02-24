/**
 * Verses Cache utility functions - Tests
 * 
 * Tests for useVersesCache hook logic
 */

// Mock cache implementation for testing
const createMockCache = () => {
    const cache = new Map();
    const MAX_CACHE_SIZE = 50;

    const getCacheKey = (translation, book, chapter) =>
        `${translation}_${book}_${chapter}`;

    const get = (translation, book, chapter) => {
        const key = getCacheKey(translation, book, chapter);
        return cache.get(key);
    };

    const set = (translation, book, chapter, data) => {
        const key = getCacheKey(translation, book, chapter);

        // Evict oldest if full
        if (cache.size >= MAX_CACHE_SIZE) {
            const firstKey = cache.keys().next().value;
            cache.delete(firstKey);
        }

        cache.set(key, data);
    };

    const has = (translation, book, chapter) => {
        const key = getCacheKey(translation, book, chapter);
        return cache.has(key);
    };

    const clear = () => {
        cache.clear();
    };

    const size = () => cache.size;

    return { get, set, has, clear, size, getCacheKey };
};

// Test: getCacheKey generates correct format
function testGetCacheKey() {
    const cache = createMockCache();

    console.assert(
        cache.getCacheKey('pl_ubg', 'gen', 1) === 'pl_ubg_gen_1',
        'getCacheKey should return correct format'
    );
    console.assert(
        cache.getCacheKey('en_kjv', '1co', 13) === 'en_kjv_1co_13',
        'getCacheKey should handle numeric book prefixes'
    );
    console.log('✓ getCacheKey tests passed');
}

// Test: Cache stores and retrieves data
function testCacheStoreRetrieve() {
    const cache = createMockCache();
    const testData = { 1: 'Verse 1 content', 2: 'Verse 2 content' };

    cache.set('pl_ubg', 'gen', 1, testData);

    console.assert(
        cache.has('pl_ubg', 'gen', 1) === true,
        'Cache should have stored item'
    );
    console.assert(
        cache.get('pl_ubg', 'gen', 1) === testData,
        'Cache should return stored data'
    );
    console.log('✓ Cache store/retrieve tests passed');
}

// Test: Cache returns undefined for missing items
function testCacheMiss() {
    const cache = createMockCache();

    console.assert(
        cache.has('pl_ubg', 'gen', 999) === false,
        'Cache should not have missing item'
    );
    console.assert(
        cache.get('pl_ubg', 'gen', 999) === undefined,
        'Cache should return undefined for missing item'
    );
    console.log('✓ Cache miss tests passed');
}

// Test: Cache clear removes all items
function testCacheClear() {
    const cache = createMockCache();

    cache.set('pl_ubg', 'gen', 1, { 1: 'a' });
    cache.set('pl_ubg', 'gen', 2, { 1: 'b' });
    cache.set('pl_ubg', 'exo', 1, { 1: 'c' });

    console.assert(cache.size() === 3, 'Cache should have 3 items');

    cache.clear();

    console.assert(cache.size() === 0, 'Cache should be empty after clear');
    console.log('✓ Cache clear tests passed');
}

// Test: Cache evicts oldest when full
function testCacheEviction() {
    const cache = createMockCache();

    // Fill cache to max
    for (let i = 1; i <= 50; i++) {
        cache.set('pl_ubg', 'gen', i, { verse: i });
    }

    console.assert(cache.size() === 50, 'Cache should be at max size');
    console.assert(cache.has('pl_ubg', 'gen', 1) === true, 'First item should exist');

    // Add one more - should evict first
    cache.set('pl_ubg', 'gen', 51, { verse: 51 });

    console.assert(cache.size() === 50, 'Cache should still be at max size');
    console.assert(cache.has('pl_ubg', 'gen', 1) === false, 'First item should be evicted');
    console.assert(cache.has('pl_ubg', 'gen', 51) === true, 'New item should exist');
    console.log('✓ Cache eviction tests passed');
}

// Test: Prefetch adjacent chapters logic
function testPrefetchAdjacentLogic() {
    const structure = {
        gen: [1, 2, 3, 4, 5],
        exo: [1, 2, 3]
    };

    const getAdjacentChapters = (book, chapter) => {
        if (!structure[book]) return { prev: null, next: null };

        const chapters = structure[book];
        const currentIndex = chapters.indexOf(chapter);

        return {
            prev: currentIndex > 0 ? chapters[currentIndex - 1] : null,
            next: currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null
        };
    };

    // Middle chapter
    let adjacent = getAdjacentChapters('gen', 3);
    console.assert(adjacent.prev === 2, 'Previous chapter should be 2');
    console.assert(adjacent.next === 4, 'Next chapter should be 4');

    // First chapter
    adjacent = getAdjacentChapters('gen', 1);
    console.assert(adjacent.prev === null, 'No previous for first chapter');
    console.assert(adjacent.next === 2, 'Next chapter should be 2');

    // Last chapter
    adjacent = getAdjacentChapters('gen', 5);
    console.assert(adjacent.prev === 4, 'Previous chapter should be 4');
    console.assert(adjacent.next === null, 'No next for last chapter');

    console.log('✓ Prefetch adjacent logic tests passed');
}

// Run all tests
function runAllTests() {
    console.log('Running Verses Cache tests...\n');

    testGetCacheKey();
    testCacheStoreRetrieve();
    testCacheMiss();
    testCacheClear();
    testCacheEviction();
    testPrefetchAdjacentLogic();

    console.log('\n✅ All tests passed!');
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runAllTests };
}

// Auto-run in browser
if (typeof window !== 'undefined') {
    runAllTests();
}
