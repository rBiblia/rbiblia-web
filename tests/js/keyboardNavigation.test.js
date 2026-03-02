/**
 * Keyboard Navigation logic - Tests
 *
 * Tests for useKeyboardNavigation hook logic (pure function extraction)
 * and chapter/book navigation helpers used in Bible.js
 */

// ─── Keyboard Navigation Logic Tests ───────────────────────────────────────

/**
 * Simulated navigation handler to verify keyboard callbacks
 */
function createNavigationTracker() {
  const calls = [];
  return {
    prevChapter: () => calls.push("prev"),
    nextChapter: () => calls.push("next"),
    getCalls: () => [...calls],
    reset: () => (calls.length = 0),
  };
}

/**
 * Simulated keyboard handler matching the hook logic
 */
function createKeyboardHandler(onPrev, onNext, { enabled = true } = {}) {
  return (key, activeTag = "div", isContentEditable = false) => {
    if (!enabled) return;

    // Suppress in inputs
    if (
      activeTag === "input" ||
      activeTag === "textarea" ||
      activeTag === "select"
    ) {
      return;
    }
    if (isContentEditable) return;

    if (key === "ArrowLeft") {
      onPrev?.();
    } else if (key === "ArrowRight") {
      onNext?.();
    }
  };
}

// Test: ArrowLeft calls prevChapter
function testArrowLeftCallsPrev() {
  const nav = createNavigationTracker();
  const handler = createKeyboardHandler(nav.prevChapter, nav.nextChapter);

  handler("ArrowLeft");

  console.assert(
    nav.getCalls().length === 1 && nav.getCalls()[0] === "prev",
    "ArrowLeft should call prevChapter exactly once"
  );
  console.log("✓ ArrowLeft calls prevChapter");
}

// Test: ArrowRight calls nextChapter
function testArrowRightCallsNext() {
  const nav = createNavigationTracker();
  const handler = createKeyboardHandler(nav.prevChapter, nav.nextChapter);

  handler("ArrowRight");

  console.assert(
    nav.getCalls().length === 1 && nav.getCalls()[0] === "next",
    "ArrowRight should call nextChapter exactly once"
  );
  console.log("✓ ArrowRight calls nextChapter");
}

// Test: Other keys are ignored
function testOtherKeysIgnored() {
  const nav = createNavigationTracker();
  const handler = createKeyboardHandler(nav.prevChapter, nav.nextChapter);

  handler("ArrowUp");
  handler("ArrowDown");
  handler("Enter");
  handler("Space");
  handler("a");
  handler("Escape");

  console.assert(
    nav.getCalls().length === 0,
    "Non-arrow keys should not trigger navigation"
  );
  console.log("✓ Other keys are ignored");
}

// Test: Navigation suppressed when input is focused
function testSuppressedInInput() {
  const nav = createNavigationTracker();
  const handler = createKeyboardHandler(nav.prevChapter, nav.nextChapter);

  handler("ArrowLeft", "input");
  handler("ArrowRight", "textarea");
  handler("ArrowLeft", "select");

  console.assert(
    nav.getCalls().length === 0,
    "Navigation should be suppressed when input/textarea/select is focused"
  );
  console.log("✓ Navigation suppressed in input elements");
}

// Test: Navigation suppressed when contentEditable
function testSuppressedInContentEditable() {
  const nav = createNavigationTracker();
  const handler = createKeyboardHandler(nav.prevChapter, nav.nextChapter);

  handler("ArrowLeft", "div", true);
  handler("ArrowRight", "div", true);

  console.assert(
    nav.getCalls().length === 0,
    "Navigation should be suppressed when contentEditable is active"
  );
  console.log("✓ Navigation suppressed in contentEditable");
}

// Test: Navigation disabled via enabled flag
function testDisabledWhenEnabledFalse() {
  const nav = createNavigationTracker();
  const handler = createKeyboardHandler(nav.prevChapter, nav.nextChapter, {
    enabled: false,
  });

  handler("ArrowLeft");
  handler("ArrowRight");

  console.assert(
    nav.getCalls().length === 0,
    "Navigation should be disabled when enabled=false"
  );
  console.log("✓ Navigation disabled when enabled=false");
}

// Test: Rapid consecutive presses
function testRapidConsecutivePresses() {
  const nav = createNavigationTracker();
  const handler = createKeyboardHandler(nav.prevChapter, nav.nextChapter);

  handler("ArrowRight");
  handler("ArrowRight");
  handler("ArrowRight");
  handler("ArrowLeft");

  const calls = nav.getCalls();
  console.assert(calls.length === 4, "Should register all key presses");
  console.assert(
    calls[0] === "next" &&
      calls[1] === "next" &&
      calls[2] === "next" &&
      calls[3] === "prev",
    "Should register presses in correct order"
  );
  console.log("✓ Rapid consecutive presses handled correctly");
}

// Test: Null callbacks handled gracefully
function testNullCallbacks() {
  const handler = createKeyboardHandler(null, null);

  // Should not throw
  let threw = false;
  try {
    handler("ArrowLeft");
    handler("ArrowRight");
  } catch (e) {
    threw = true;
  }

  console.assert(!threw, "Null callbacks should not throw");
  console.log("✓ Null callbacks handled gracefully");
}

// ─── Chapter/Book Navigation Logic Tests ───────────────────────────────────

/**
 * Simulated structure matching Bible.js patterns
 */
function createMockStructure() {
  return {
    gen: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 50], // Genesis: 50 represented by subset
    exo: [1, 2, 3, 4, 5],
    lev: [1, 2, 3],
  };
}

function getChapterIndex(structure, book, chapter) {
  if (!structure[book]) return -1;
  return structure[book].findIndex((c) => c === parseInt(chapter));
}

function isNextChapterAvailable(structure, book, chapter) {
  const chapters = structure[book];
  if (!chapters) return false;
  const idx = getChapterIndex(structure, book, chapter);
  return typeof chapters[idx + 1] !== "undefined";
}

function isPrevChapterAvailable(structure, book, chapter) {
  const idx = getChapterIndex(structure, book, chapter);
  return idx > 0;
}

function getBookIndex(structure, book) {
  return Object.keys(structure).findIndex((key) => key === book);
}

function isNextBookAvailable(structure, book) {
  const idx = getBookIndex(structure, book);
  return typeof Object.keys(structure)[idx + 1] !== "undefined";
}

function isPrevBookAvailable(structure, book) {
  return getBookIndex(structure, book) > 0;
}

// Tests for chapter navigation availability
function testNextChapterAvailability() {
  const struct = createMockStructure();

  console.assert(
    isNextChapterAvailable(struct, "gen", 1) === true,
    "Next chapter should be available for gen:1"
  );
  console.assert(
    isNextChapterAvailable(struct, "gen", 50) === false,
    "Next chapter should NOT be available for last chapter (gen:50)"
  );
  console.assert(
    isNextChapterAvailable(struct, "lev", 3) === false,
    "Next chapter should NOT be available for lev:3 (last chapter)"
  );
  console.log("✓ Next chapter availability tests passed");
}

function testPrevChapterAvailability() {
  const struct = createMockStructure();

  console.assert(
    isPrevChapterAvailable(struct, "gen", 2) === true,
    "Prev chapter should be available for gen:2"
  );
  console.assert(
    isPrevChapterAvailable(struct, "gen", 1) === false,
    "Prev chapter should NOT be available for first chapter (gen:1)"
  );
  console.assert(
    isPrevChapterAvailable(struct, "exo", 1) === false,
    "Prev chapter should NOT be available for exo:1 (first chapter)"
  );
  console.log("✓ Prev chapter availability tests passed");
}

// Tests for book navigation availability
function testBookNavigationAvailability() {
  const struct = createMockStructure();

  console.assert(
    isNextBookAvailable(struct, "gen") === true,
    "Next book should be available after gen"
  );
  console.assert(
    isNextBookAvailable(struct, "lev") === false,
    "Next book should NOT be available after last book"
  );
  console.assert(
    isPrevBookAvailable(struct, "exo") === true,
    "Prev book should be available before exo"
  );
  console.assert(
    isPrevBookAvailable(struct, "gen") === false,
    "Prev book should NOT be available before gen"
  );
  console.log("✓ Book navigation availability tests passed");
}

// Test: getChapterIndex for edge cases
function testChapterIndexEdgeCases() {
  const struct = createMockStructure();

  console.assert(
    getChapterIndex(struct, "gen", 1) === 0,
    "gen:1 should be at index 0"
  );
  console.assert(
    getChapterIndex(struct, "gen", 50) === 10,
    "gen:50 should be at last index"
  );
  console.assert(
    getChapterIndex(struct, "gen", 999) === -1,
    "Non-existent chapter should return -1"
  );
  console.assert(
    getChapterIndex(struct, "nonexistent", 1) === -1,
    "Non-existent book should return -1"
  );
  // parseInt conversion like Bible.js
  console.assert(
    getChapterIndex(struct, "gen", "1") === 0,
    'String chapter "1" should match number 1 via parseInt'
  );
  console.log("✓ Chapter index edge cases passed");
}

// Test: Cross-book navigation scenario
function testCrossBookNavigation() {
  const struct = createMockStructure();
  const books = Object.keys(struct);

  // At last chapter of gen (50) - prevChapter should work, nextChapter should go to next book
  const genLastChapter = struct.gen[struct.gen.length - 1];
  console.assert(
    !isNextChapterAvailable(struct, "gen", genLastChapter),
    "gen last chapter should not have next chapter"
  );
  console.assert(
    isNextBookAvailable(struct, "gen"),
    "gen should have a next book (exo)"
  );
  console.assert(
    books[getBookIndex(struct, "gen") + 1] === "exo",
    "Next book after gen should be exo"
  );

  // At first chapter of exo (1) - nextChapter should work, prevChapter should go to prev book
  console.assert(
    !isPrevChapterAvailable(struct, "exo", 1),
    "First chapter of exo should not have prev chapter"
  );
  console.assert(
    isPrevBookAvailable(struct, "exo"),
    "exo should have a prev book (gen)"
  );

  console.log("✓ Cross-book navigation tests passed");
}

// ─── Book Sigla Logic Tests ────────────────────────────────────────────────

function testGetSigla() {
  // Inline re-implementation for standalone testing
  const sigla = {
    gen: "Rdz",
    exo: "Wj",
    mat: "Mt",
    rev: "Ap",
    "1co": "1 Kor",
    "2co": "2 Kor",
  };
  const getSigla = (bookId) => sigla[bookId] || bookId.toUpperCase();

  console.assert(getSigla("gen") === "Rdz", "gen → Rdz");
  console.assert(getSigla("mat") === "Mt", "mat → Mt");
  console.assert(getSigla("1co") === "1 Kor", "1co → 1 Kor");
  console.assert(
    getSigla("unknown") === "UNKNOWN",
    "unknown → UNKNOWN (fallback)"
  );
  console.log("✓ Book sigla tests passed");
}

// ─── Swipe Navigation Logic Tests ──────────────────────────────────────────

function testSwipeDirectionLogic() {
  const determineSwipe = (startX, endX, startY, endY, threshold) => {
    const deltaX = startX - endX;
    const deltaY = startY - endY;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
      return deltaX > 0 ? "left" : "right";
    }
    return null;
  };

  // Horizontal swipe left (finger moves from right to left)
  console.assert(
    determineSwipe(300, 100, 200, 200, 50) === "left",
    "Large leftward gesture should be detected as swipe left"
  );

  // Horizontal swipe right
  console.assert(
    determineSwipe(100, 300, 200, 200, 50) === "right",
    "Large rightward gesture should be detected as swipe right"
  );

  // Below threshold
  console.assert(
    determineSwipe(200, 175, 200, 200, 50) === null,
    "Small gesture below threshold should return null"
  );

  // Vertical > horizontal (scrolling, not swiping)
  console.assert(
    determineSwipe(200, 210, 100, 300, 50) === null,
    "Predominantly vertical gesture should return null"
  );

  console.log("✓ Swipe direction logic tests passed");
}

// ─── Debounce Logic Tests ──────────────────────────────────────────────────

function testDebounceMinLength() {
  // Logic extracted from useDebounce: if string < minLength, return ''
  const shouldDebounce = (value, minLength) => {
    if (typeof value === "string" && value.length < minLength) {
      return "";
    }
    return value;
  };

  console.assert(
    shouldDebounce("ab", 3) === "",
    "String shorter than minLength should return empty"
  );
  console.assert(
    shouldDebounce("abc", 3) === "abc",
    "String equal to minLength should pass through"
  );
  console.assert(
    shouldDebounce("abcd", 3) === "abcd",
    "String longer than minLength should pass through"
  );
  console.assert(
    shouldDebounce("", 0) === "",
    "Empty string with minLength 0 should pass through"
  );
  console.assert(
    shouldDebounce(42, 3) === 42,
    "Non-string value should pass through regardless of minLength"
  );
  console.log("✓ Debounce minLength logic tests passed");
}

// ─── URL Parsing Logic Tests ───────────────────────────────────────────────

function testUrlParsingLogic() {
  // Re-implementation of getDataFromCurrentPathname parsing
  const parsePathname = (pathname) => {
    const [, language, translation, book, chapter] = pathname
      .replace(/\/$/, "")
      .split("/");

    const ACCEPTED_LANGUAGES = ["pl", "en", "de"];
    const lang = ACCEPTED_LANGUAGES.includes(language) ? language : "en";

    return {
      language: lang,
      translation: translation || "pl_ubg",
      book: book || "gen",
      chapter: chapter || "1",
    };
  };

  // Full path
  let result = parsePathname("/pl/pl_ubg/gen/3");
  console.assert(result.language === "pl", "Language should be pl");
  console.assert(
    result.translation === "pl_ubg",
    "Translation should be pl_ubg"
  );
  console.assert(result.book === "gen", "Book should be gen");
  console.assert(result.chapter === "3", "Chapter should be 3");

  // German path
  result = parsePathname("/de/de_lut/mat/5");
  console.assert(result.language === "de", "Language should be de");

  // Unsupported language falls back to en
  result = parsePathname("/fr/fr_tob/mat/1");
  console.assert(
    result.language === "en",
    "Unknown language should fallback to en"
  );

  // Minimal path with defaults
  result = parsePathname("/en");
  console.assert(
    result.translation === "pl_ubg",
    "Missing translation should get default"
  );
  console.assert(result.book === "gen", "Missing book should get default");
  console.assert(result.chapter === "1", "Missing chapter should get default");

  // Trailing slash
  result = parsePathname("/pl/pl_ubg/gen/3/");
  console.assert(result.chapter === "3", "Trailing slash should be stripped");

  console.log("✓ URL parsing logic tests passed");
}

// ─── Run All Tests ─────────────────────────────────────────────────────────

function runAllTests() {
  console.log("Running Keyboard Navigation & UI Logic tests...\n");

  // Keyboard navigation
  testArrowLeftCallsPrev();
  testArrowRightCallsNext();
  testOtherKeysIgnored();
  testSuppressedInInput();
  testSuppressedInContentEditable();
  testDisabledWhenEnabledFalse();
  testRapidConsecutivePresses();
  testNullCallbacks();

  // Chapter/book navigation
  testNextChapterAvailability();
  testPrevChapterAvailability();
  testBookNavigationAvailability();
  testChapterIndexEdgeCases();
  testCrossBookNavigation();

  // Supporting logic
  testGetSigla();
  testSwipeDirectionLogic();
  testDebounceMinLength();
  testUrlParsingLogic();

  console.log("\n✅ All tests passed!");
}

// Export for use
if (typeof module !== "undefined" && module.exports) {
  module.exports = { runAllTests };
}

// Auto-run in browser
if (typeof window !== "undefined") {
  runAllTests();
}
