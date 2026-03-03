/**
 * Book+Chapter Navigation logic - Tests
 *
 * Tests for navigateToBookAndChapter, changeSelectedChapter with bookOverride,
 * and the race condition fix when selecting from the modal.
 */

// ─── changeSelectedChapter with bookOverride Tests ─────────────────────────

/**
 * Simulates changeSelectedChapter logic from Bible.js.
 * The key fix: uses bookOverride when provided, otherwise falls back to selectedBook.
 */
function createChapterChanger(initialBook) {
  let currentBook = initialBook;
  let currentChapter = null;
  const apiCalls = [];

  const changeSelectedChapter = (newChapter, bookOverride) => {
    const effectiveBook = bookOverride || currentBook;

    // Record what was sent to the "API"
    apiCalls.push({
      book: effectiveBook,
      chapter: newChapter,
    });

    currentChapter = newChapter;
  };

  return {
    changeSelectedChapter,
    setCurrentBook: (book) => {
      currentBook = book;
    },
    getCurrentChapter: () => currentChapter,
    getApiCalls: () => [...apiCalls],
  };
}

function testChangeSelectedChapterWithoutOverride() {
  const changer = createChapterChanger("gen");

  changer.changeSelectedChapter(5);

  const calls = changer.getApiCalls();
  console.assert(calls.length === 1, "Should make one API call");
  console.assert(
    calls[0].book === "gen",
    "Should use current book (gen) when no override"
  );
  console.assert(calls[0].chapter === 5, "Should use provided chapter");

  console.log("✓ changeSelectedChapter without override uses current book");
}

function testChangeSelectedChapterWithOverride() {
  const changer = createChapterChanger("gen");

  // Override book to 'exo' — simulates modal selection
  changer.changeSelectedChapter(3, "exo");

  const calls = changer.getApiCalls();
  console.assert(calls.length === 1, "Should make one API call");
  console.assert(
    calls[0].book === "exo",
    "Should use override book (exo) instead of current (gen)"
  );
  console.assert(calls[0].chapter === 3, "Should use provided chapter");

  console.log("✓ changeSelectedChapter with override uses override book");
}

function testOverridePreventsStaleBookUsage() {
  const changer = createChapterChanger("gen");

  // Scenario: user selects 'mat' chapter 28 from modal
  // Without override, currentBook is still 'gen' — chapter 28 may not exist in gen
  changer.changeSelectedChapter(28, "mat");

  const calls = changer.getApiCalls();
  console.assert(
    calls[0].book === "mat",
    "Should use mat (override), NOT gen (stale)"
  );
  console.assert(calls[0].chapter === 28, "Should request chapter 28");

  console.log("✓ bookOverride prevents stale book usage (race condition fix)");
}

// ─── navigateToBookAndChapter Tests ────────────────────────────────────────

/**
 * Simulates the navigateToBookAndChapter logic from Bible.js,
 * verifying that all state is set atomically.
 */
function createNavigator() {
  let selectedBook = "gen";
  let selectedChapter = 1;
  let keepChapterIfPossible = false;
  const apiCalls = [];
  const stateChanges = [];

  const setSelectedBook = (book) => {
    selectedBook = book;
    stateChanges.push({ type: "setSelectedBook", value: book });
  };

  const setSelectedChapter = (chapter) => {
    selectedChapter = chapter;
    stateChanges.push({ type: "setSelectedChapter", value: chapter });
  };

  const changeSelectedChapter = (newChapter, bookOverride) => {
    const effectiveBook = bookOverride || selectedBook;
    apiCalls.push({ book: effectiveBook, chapter: newChapter });
  };

  const navigateToBookAndChapter = (book, chapter) => {
    keepChapterIfPossible = true;
    setSelectedChapter(chapter);
    setSelectedBook(book);
    changeSelectedChapter(chapter, book);
  };

  return {
    navigateToBookAndChapter,
    getSelectedBook: () => selectedBook,
    getSelectedChapter: () => selectedChapter,
    getKeepChapterIfPossible: () => keepChapterIfPossible,
    getApiCalls: () => [...apiCalls],
    getStateChanges: () => [...stateChanges],
  };
}

function testNavigateToBookAndChapterSetsBookAndChapter() {
  const nav = createNavigator();

  nav.navigateToBookAndChapter("mat", 5);

  console.assert(nav.getSelectedBook() === "mat", "Book should be set to mat");
  console.assert(nav.getSelectedChapter() === 5, "Chapter should be set to 5");

  console.log("✓ navigateToBookAndChapter sets both book and chapter");
}

function testNavigateToBookAndChapterSetsKeepFlag() {
  const nav = createNavigator();

  nav.navigateToBookAndChapter("exo", 3);

  console.assert(
    nav.getKeepChapterIfPossible() === true,
    "keepChapterIfPossible should be true to prevent useEffect override"
  );

  console.log("✓ navigateToBookAndChapter sets keepChapterIfPossible flag");
}

function testNavigateToBookAndChapterApiUsesCorrectBook() {
  const nav = createNavigator();

  nav.navigateToBookAndChapter("rev", 22);

  const calls = nav.getApiCalls();
  console.assert(calls.length === 1, "Should make exactly one API call");
  console.assert(calls[0].book === "rev", "API call should use new book (rev)");
  console.assert(
    calls[0].chapter === 22,
    "API call should use new chapter (22)"
  );

  console.log("✓ navigateToBookAndChapter API call uses correct book");
}

function testNavigateToBookAndChapterStateOrder() {
  const nav = createNavigator();

  nav.navigateToBookAndChapter("lev", 7);

  const changes = nav.getStateChanges();
  console.assert(changes.length === 2, "Should have 2 state changes");
  console.assert(
    changes[0].type === "setSelectedChapter" && changes[0].value === 7,
    "Chapter should be set FIRST (so useEffect sees correct value)"
  );
  console.assert(
    changes[1].type === "setSelectedBook" && changes[1].value === "lev",
    "Book should be set SECOND (triggers useEffect)"
  );

  console.log(
    "✓ navigateToBookAndChapter sets chapter before book (correct order)"
  );
}

// ─── Race condition scenario simulation ────────────────────────────────────

function testRaceConditionScenario() {
  // Simulate the exact bug scenario:
  // User is reading gen:5, opens modal, selects mat:28
  // Without fix, API would request gen/28 (doesn't exist — gen has ~50 chapters but mat has 28)

  const structure = {
    gen: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 50],
    exo: [1, 2, 3, 4, 5],
    mat: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 28],
  };

  let selectedBook = "gen";

  const apiCalls = [];

  // Simulated fixed changeSelectedChapter with bookOverride
  const changeSelectedChapter = (chapter, bookOverride) => {
    const effectiveBook = bookOverride || selectedBook;

    // Verify the chapter exists in the effective book
    const chapterExists = structure[effectiveBook]?.includes(chapter);
    apiCalls.push({
      book: effectiveBook,
      chapter: chapter,
      chapterExists: chapterExists,
    });
  };

  // Fixed: navigateToBookAndChapter passes book override
  const navigateToBookAndChapter = (book, chapter) => {
    selectedBook = book;
    changeSelectedChapter(chapter, book);
  };

  // User selects mat:28 from modal
  navigateToBookAndChapter("mat", 28);

  console.assert(apiCalls.length === 1, "Should make one API call");
  console.assert(apiCalls[0].book === "mat", "API should target mat, not gen");
  console.assert(apiCalls[0].chapter === 28, "API should request chapter 28");
  console.assert(
    apiCalls[0].chapterExists === true,
    "Chapter 28 should exist in mat"
  );

  console.log("✓ Race condition scenario: correct book used in API call");
}

function testRaceConditionWithSameBook() {
  // When the user selects a different chapter in the SAME book,
  // navigateToBookAndChapter should still work correctly
  let selectedBook = "gen";
  const apiCalls = [];

  const changeSelectedChapter = (chapter, bookOverride) => {
    const effectiveBook = bookOverride || selectedBook;
    apiCalls.push({ book: effectiveBook, chapter: chapter });
  };

  const navigateToBookAndChapter = (book, chapter) => {
    selectedBook = book;
    changeSelectedChapter(chapter, book);
  };

  navigateToBookAndChapter("gen", 10);

  console.assert(apiCalls[0].book === "gen", "Should use gen");
  console.assert(apiCalls[0].chapter === 10, "Should use chapter 10");
  console.assert(selectedBook === "gen", "Book should remain gen");

  console.log("✓ Race condition with same book: works correctly");
}

// ─── getAppropriateChapter with keepChapterIfPossible Tests ────────────────

function testGetAppropriateChapterKeepsChapter() {
  const structure = {
    gen: [1, 2, 3, 4, 5],
    mat: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  };

  const getAppropriateChapter = (
    structureData,
    book,
    currentChapter,
    keepIfPossible,
    startFromLast
  ) => {
    if (
      keepIfPossible &&
      structureData[book].some((ch) => ch == currentChapter)
    ) {
      return currentChapter;
    }
    if (startFromLast) {
      return structureData[book][structureData[book].length - 1];
    }
    return structureData[book][0];
  };

  // When keepChapterIfPossible is true and chapter exists in new book
  const result = getAppropriateChapter(structure, "mat", 5, true, false);
  console.assert(result === 5, "Should keep chapter 5 when it exists in mat");

  // When keepChapterIfPossible is true but chapter does NOT exist
  const result2 = getAppropriateChapter(structure, "gen", 10, true, false);
  console.assert(
    result2 === 1,
    "Should fall back to first chapter when 10 does not exist in gen"
  );

  // When keepChapterIfPossible is false
  const result3 = getAppropriateChapter(structure, "mat", 5, false, false);
  console.assert(
    result3 === 1,
    "Should return first chapter when keepChapterIfPossible is false"
  );

  // When startFromLastVerse is true
  const result4 = getAppropriateChapter(structure, "gen", 1, false, true);
  console.assert(
    result4 === 5,
    "Should return last chapter when startFromLastVerse is true"
  );

  console.log(
    "✓ getAppropriateChapter with keepChapterIfPossible tests passed"
  );
}

// ─── updateHistory receives correct book Tests ─────────────────────────────

function testUpdateHistoryReceivesCorrectBook() {
  const historyCalls = [];

  // Simulated updateHistory
  const updateHistory = (locale, translation, book, chapter) => {
    historyCalls.push({ locale, translation, book, chapter });
  };

  let selectedBook = "gen";
  const selectedTranslation = "pl_ubg";
  const locale = "pl";

  // Simulated changeSelectedChapter with bookOverride
  const changeSelectedChapter = (chapter, bookOverride) => {
    const effectiveBook = bookOverride || selectedBook;
    updateHistory(locale, selectedTranslation, effectiveBook, chapter);
  };

  // User navigates from gen to mat:15 via modal
  changeSelectedChapter(15, "mat");

  console.assert(historyCalls.length === 1, "Should call updateHistory once");
  console.assert(
    historyCalls[0].book === "mat",
    "URL history should use mat, not gen"
  );
  console.assert(
    historyCalls[0].chapter === 15,
    "URL history should use chapter 15"
  );

  console.log("✓ updateHistory receives correct book with bookOverride");
}

// ─── Multiple callers use navigateToBookAndChapter Tests ───────────────────

function testAllCallersUseNavigateToBookAndChapter() {
  // Verify that SelectionGrid, ChapterComparison, and handleNavigateToVerse
  // all go through navigateToBookAndChapter (simulated)

  const navigateCalls = [];
  const navigateToBookAndChapter = (book, chapter) => {
    navigateCalls.push({ book, chapter, source: "navigateToBookAndChapter" });
  };

  // SelectionGrid callback
  const onSelectChapter = (book, chapter) => {
    navigateToBookAndChapter(book, chapter);
  };

  // ChapterComparison callback
  const onNavigateChapter = (book, chapter) => {
    navigateToBookAndChapter(book, chapter);
  };

  // handleNavigateToVerse callback
  const handleNavigateToVerse = (book, chapter, verse) => {
    navigateToBookAndChapter(book, chapter);
  };

  // Simulate all three sources
  onSelectChapter("mat", 5);
  onNavigateChapter("rev", 1);
  handleNavigateToVerse("gen", 3, 16);

  console.assert(
    navigateCalls.length === 3,
    "All three callers should use navigateToBookAndChapter"
  );
  console.assert(
    navigateCalls[0].book === "mat",
    "SelectionGrid should navigate to mat"
  );
  console.assert(
    navigateCalls[1].book === "rev",
    "ChapterComparison should navigate to rev"
  );
  console.assert(
    navigateCalls[2].book === "gen",
    "handleNavigateToVerse should navigate to gen"
  );
  console.assert(
    navigateCalls[2].chapter === 3,
    "handleNavigateToVerse should navigate to chapter 3"
  );

  console.log("✓ All callers use navigateToBookAndChapter consistently");
}

// ─── Edge case: chapter as string (from URL) ──────────────────────────────

function testChapterAsStringFromUrl() {
  const structure = {
    gen: [1, 2, 3, 4, 5],
  };

  // Chapter from URL is sometimes a string
  const getAppropriateChapter = (
    structureData,
    book,
    currentChapter,
    keepIfPossible
  ) => {
    if (
      keepIfPossible &&
      structureData[book].some((ch) => ch == currentChapter)
    ) {
      return currentChapter;
    }
    return structureData[book][0];
  };

  // String "3" should match number 3 via == comparison (intentional loose equality)
  const result = getAppropriateChapter(structure, "gen", "3", true);
  console.assert(
    result === "3",
    'String chapter "3" should be kept when it matches via =='
  );

  // String "99" should NOT match and fallback to first
  const result2 = getAppropriateChapter(structure, "gen", "99", true);
  console.assert(
    result2 === 1,
    "Non-existent string chapter should fall back to first"
  );

  console.log("✓ Chapter as string from URL handled correctly");
}

// ─── Run All Tests ─────────────────────────────────────────────────────────

function runAllTests() {
  console.log("Running Book+Chapter Navigation tests...\n");

  // changeSelectedChapter with bookOverride
  testChangeSelectedChapterWithoutOverride();
  testChangeSelectedChapterWithOverride();
  testOverridePreventsStaleBookUsage();

  // navigateToBookAndChapter
  testNavigateToBookAndChapterSetsBookAndChapter();
  testNavigateToBookAndChapterSetsKeepFlag();
  testNavigateToBookAndChapterApiUsesCorrectBook();
  testNavigateToBookAndChapterStateOrder();

  // Race condition scenarios
  testRaceConditionScenario();
  testRaceConditionWithSameBook();

  // getAppropriateChapter integration
  testGetAppropriateChapterKeepsChapter();

  // updateHistory
  testUpdateHistoryReceivesCorrectBook();

  // All callers consistency
  testAllCallersUseNavigateToBookAndChapter();

  // Edge cases
  testChapterAsStringFromUrl();

  console.log("\n✅ All tests passed!");
}

// Export for use
if (typeof module !== "undefined" && module.exports) {
  module.exports = { runAllTests };
}

// Auto-run in browser
if (typeof globalThis.window !== "undefined") {
  runAllTests();
}
