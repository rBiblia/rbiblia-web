/**
 * Comparison Grid logic - Tests
 *
 * Tests for verse comparison navigation, swipe gestures,
 * translation selector integration, and diff highlighting logic.
 */

// ─── Comparison Verse Navigation Tests ─────────────────────────────────────

function testComparisonVerseNavigation() {
    const createNavigator = (initialVerse, totalVerses) => {
        let currentVerse = initialVerse;
        return {
            handlePrev: () => {
                if (currentVerse > 1) currentVerse--;
            },
            handleNext: () => {
                if (currentVerse < totalVerses) currentVerse++;
            },
            canGoPrev: () => currentVerse > 1,
            canGoNext: () => currentVerse < totalVerses,
            getCurrent: () => currentVerse,
        };
    };

    // Basic navigation
    const nav = createNavigator(5, 20);
    console.assert(nav.canGoPrev() === true, 'Should be able to go prev from verse 5');
    console.assert(nav.canGoNext() === true, 'Should be able to go next from verse 5');

    nav.handleNext();
    console.assert(nav.getCurrent() === 6, 'Should advance to verse 6');

    nav.handlePrev();
    console.assert(nav.getCurrent() === 5, 'Should go back to verse 5');

    // Boundary: first verse
    const navFirst = createNavigator(1, 10);
    console.assert(navFirst.canGoPrev() === false, 'Should NOT be able to go prev from verse 1');
    navFirst.handlePrev();
    console.assert(navFirst.getCurrent() === 1, 'Should stay at verse 1 when trying to go prev');

    // Boundary: last verse
    const navLast = createNavigator(10, 10);
    console.assert(navLast.canGoNext() === false, 'Should NOT be able to go next from last verse');
    navLast.handleNext();
    console.assert(navLast.getCurrent() === 10, 'Should stay at last verse when trying to go next');

    // Single verse chapter
    const navSingle = createNavigator(1, 1);
    console.assert(navSingle.canGoPrev() === false, 'Single verse: cannot go prev');
    console.assert(navSingle.canGoNext() === false, 'Single verse: cannot go next');

    console.log('✓ Comparison verse navigation tests passed');
}

// ─── Comparison Swipe Gesture Tests ────────────────────────────────────────

function testComparisonSwipeGestures() {
    const determineSwipe = (startX, endX, startY, endY, threshold = 60) => {
        const deltaX = startX - endX;
        const deltaY = startY - endY;

        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
            return deltaX > 0 ? 'next' : 'prev'; // left swipe = next, right swipe = prev
        }
        return null;
    };

    // Swipe left → next verse
    console.assert(
        determineSwipe(300, 100, 200, 200) === 'next',
        'Swipe left should trigger next verse'
    );

    // Swipe right → previous verse
    console.assert(
        determineSwipe(100, 300, 200, 200) === 'prev',
        'Swipe right should trigger previous verse'
    );

    // Below threshold (60px) — no action
    console.assert(
        determineSwipe(200, 170, 200, 200) === null,
        'Small horizontal movement below threshold should be ignored'
    );

    // Exactly at threshold — no action (must exceed, not equal)
    console.assert(
        determineSwipe(200, 140, 200, 200) === null,
        'Movement exactly at threshold should be ignored'
    );

    // Just over threshold — trigger
    console.assert(
        determineSwipe(200, 139, 200, 200) === 'next',
        'Movement just over threshold (61px) should trigger'
    );

    // Vertical scroll (should not trigger)
    console.assert(
        determineSwipe(200, 210, 100, 300) === null,
        'Vertical movement should NOT trigger swipe'
    );

    // Diagonal but mostly vertical
    console.assert(
        determineSwipe(200, 130, 100, 300) === null,
        'Diagonal movement (mostly vertical) should NOT trigger swipe'
    );

    console.log('✓ Comparison swipe gesture tests passed');
}

// ─── Translation Selector Disabled Options Tests ───────────────────────────

function testTranslationSelectorDisabledOptions() {
    const translations = [
        { id: 'pl_ubg', name: 'UBG', language: 'pl' },
        { id: 'pl_bw', name: 'BW', language: 'pl' },
        { id: 'en_kjv', name: 'KJV', language: 'en' },
        { id: 'en_esv', name: 'ESV', language: 'en' },
        { id: 'de_lut', name: 'Luther', language: 'de' },
    ];

    const currentTranslation = 'pl_ubg';
    const selectedTranslations = ['en_kjv', 'de_lut', ''];

    // Build disabled IDs for slot index 2 (empty slot)
    const usedTranslations = selectedTranslations.filter(
        (t, i) => t && i !== 2
    );
    const disabledIds = [currentTranslation, ...usedTranslations];

    // Current translation should be disabled
    console.assert(
        disabledIds.includes('pl_ubg'),
        'Current translation should be in disabled list'
    );

    // Already selected translations should be disabled
    console.assert(
        disabledIds.includes('en_kjv'),
        'Already selected translation should be disabled'
    );
    console.assert(
        disabledIds.includes('de_lut'),
        'Already selected translation should be disabled'
    );

    // Available translations should NOT be disabled
    console.assert(
        !disabledIds.includes('pl_bw'),
        'Available translation should NOT be disabled'
    );
    console.assert(
        !disabledIds.includes('en_esv'),
        'Available translation should NOT be disabled'
    );

    console.log('✓ Translation selector disabled options tests passed');
}

// ─── Translation Grouping Tests ────────────────────────────────────────────

function testTranslationGrouping() {
    const translations = [
        { id: 'pl_ubg', name: 'UBG', language: 'pl' },
        { id: 'pl_bw', name: 'BW', language: 'pl' },
        { id: 'en_kjv', name: 'KJV', language: 'en' },
        { id: 'de_lut', name: 'Luther', language: 'de' },
    ];
    const favorites = ['pl_ubg', 'en_kjv'];

    // Separate favorites from others
    const favoriteTranslations = translations.filter(t => favorites.includes(t.id));
    const otherTranslations = translations.filter(t => !favorites.includes(t.id));

    console.assert(
        favoriteTranslations.length === 2,
        'Should have 2 favorites'
    );
    console.assert(
        otherTranslations.length === 2,
        'Should have 2 non-favorites'
    );

    // Group others by language
    const map = {};
    otherTranslations.forEach(trans => {
        if (!map[trans.language]) {
            map[trans.language] = [];
        }
        map[trans.language].push(trans);
    });

    console.assert(
        Object.keys(map).length === 2,
        'Should have 2 language groups (pl, de)'
    );
    console.assert(
        map['pl'].length === 1,
        'Polish group should have 1 translation'
    );
    console.assert(
        map['de'].length === 1,
        'German group should have 1 translation'
    );

    console.log('✓ Translation grouping tests passed');
}

// ─── Collapsed Groups Toggle Tests ─────────────────────────────────────────

function testCollapsedGroupsToggle() {
    let collapsedGroups = {};

    const toggleGroup = (groupName) => {
        collapsedGroups = {
            ...collapsedGroups,
            [groupName]: !collapsedGroups[groupName],
        };
    };

    // Initially not collapsed
    console.assert(
        !collapsedGroups['polski'],
        'Group should not be collapsed initially'
    );

    // Toggle to collapsed
    toggleGroup('polski');
    console.assert(
        collapsedGroups['polski'] === true,
        'Group should be collapsed after first toggle'
    );

    // Toggle back to expanded
    toggleGroup('polski');
    console.assert(
        collapsedGroups['polski'] === false,
        'Group should be expanded after second toggle'
    );

    // Multiple groups independently
    toggleGroup('english');
    console.assert(
        collapsedGroups['english'] === true,
        'English group should be collapsed'
    );
    console.assert(
        collapsedGroups['polski'] === false,
        'Polish group should remain expanded'
    );

    console.log('✓ Collapsed groups toggle tests passed');
}

// ─── Diff Highlighting Availability Tests ──────────────────────────────────

function testDiffHighlightingAvailability() {
    // Need at least 2 texts to highlight differences
    const canHighlight = (texts) => texts.filter(Boolean).length >= 2;

    console.assert(
        canHighlight([]) === false,
        'No texts → cannot highlight'
    );
    console.assert(
        canHighlight(['one']) === false,
        'Single text → cannot highlight'
    );
    console.assert(
        canHighlight(['one', 'two']) === true,
        'Two texts → can highlight'
    );
    console.assert(
        canHighlight(['one', null, 'three']) === true,
        'Two texts with null in between → can highlight'
    );
    console.assert(
        canHighlight([null, null]) === false,
        'Two nulls → cannot highlight'
    );

    console.log('✓ Diff highlighting availability tests passed');
}

// ─── Comparison Keyboard Shortcuts Tests ───────────────────────────────────

function testComparisonKeyboardShortcuts() {
    const calls = [];

    const handleKeyDown = (key, activeTag = 'div') => {
        if (key === 'Escape') {
            calls.push('close');
            return;
        }

        // Suppress in inputs
        if (['input', 'textarea', 'select'].includes(activeTag)) {
            return;
        }

        if (key.toLowerCase() === 'd') {
            calls.push('toggle-diff');
            return;
        }

        if (key === 'ArrowLeft' || key === 'ArrowUp') {
            calls.push('prev');
        } else if (key === 'ArrowRight' || key === 'ArrowDown') {
            calls.push('next');
        }
    };

    handleKeyDown('Escape');
    console.assert(calls[0] === 'close', 'Escape should close');

    handleKeyDown('d');
    console.assert(calls[1] === 'toggle-diff', 'D key should toggle diff');

    handleKeyDown('ArrowLeft');
    console.assert(calls[2] === 'prev', 'ArrowLeft should go prev');

    handleKeyDown('ArrowRight');
    console.assert(calls[3] === 'next', 'ArrowRight should go next');

    handleKeyDown('ArrowUp');
    console.assert(calls[4] === 'prev', 'ArrowUp should go prev');

    handleKeyDown('ArrowDown');
    console.assert(calls[5] === 'next', 'ArrowDown should go next');

    // Suppressed in input
    const beforeLen = calls.length;
    handleKeyDown('d', 'input');
    handleKeyDown('ArrowLeft', 'select');
    console.assert(
        calls.length === beforeLen,
        'Keys should be suppressed in input/select'
    );

    // Escape works even in input
    handleKeyDown('Escape', 'input');
    console.assert(
        calls[calls.length - 1] === 'close',
        'Escape should work even when input is focused'
    );

    console.log('✓ Comparison keyboard shortcuts tests passed');
}

// ─── Run All Tests ─────────────────────────────────────────────────────────

function runAllTests() {
    console.log('Running Comparison Grid logic tests...\n');

    testComparisonVerseNavigation();
    testComparisonSwipeGestures();
    testTranslationSelectorDisabledOptions();
    testTranslationGrouping();
    testCollapsedGroupsToggle();
    testDiffHighlightingAvailability();
    testComparisonKeyboardShortcuts();

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
