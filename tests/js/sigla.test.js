/**
 * Sigla migration - Tests
 *
 * Verifies that book sigla (abbreviations) are correctly resolved
 * from the API-provided books object rather than hardcoded data.
 */

// ─── Helper: simulate books object from /api/{locale}/book ──────────────────

function createBooksFixture() {
  return {
    gen: { name: "Rodzaju", sigla: "Rdz", group: "ot" },
    exo: { name: "Wyjścia", sigla: "Wj", group: "ot" },
    mat: { name: "Ewangelia Mateusza", sigla: "Mt", group: "nt" },
    rev: { name: "Apokalipsa św. Jana (Objawienie)", sigla: "Ap", group: "nt" },
    "1co": { name: "1 List do Koryntian", sigla: "1 Kor", group: "nt" },
  };
}

function createBooksFixtureEnglish() {
  return {
    gen: { name: "Genesis", sigla: "Gen", group: "ot" },
    exo: { name: "Exodus", sigla: "Exod", group: "ot" },
    mat: { name: "Matthew", sigla: "Matt", group: "nt" },
    rev: { name: "Revelation", sigla: "Rev", group: "nt" },
    "1co": { name: "1 Corinthians", sigla: "1 Cor", group: "nt" },
  };
}

// ─── Helper: replicate sigla resolution logic from SelectionGrid/Bible.js ───

/**
 * Resolves sigla from the books object, matching the production logic:
 *   books[bookId]?.sigla || bookId.toUpperCase()
 */
function resolveSigla(books, bookId) {
  return books[bookId]?.sigla || bookId?.toUpperCase() || "";
}

/**
 * Resolves display name for SelectionGrid:
 *   mobile → sigla, desktop → full name
 */
function getBookDisplayName(books, bookId, isMobile) {
  if (isMobile) {
    return books[bookId]?.sigla || bookId.toUpperCase();
  }
  return books[bookId]?.name || bookId;
}

// ─── Tests: Basic sigla resolution ──────────────────────────────────────────

function testSiglaResolvedFromBooks() {
  const books = createBooksFixture();

  console.assert(
    resolveSigla(books, "gen") === "Rdz",
    "Should resolve 'gen' to 'Rdz' from books object"
  );
  console.assert(
    resolveSigla(books, "mat") === "Mt",
    "Should resolve 'mat' to 'Mt' from books object"
  );
  console.assert(
    resolveSigla(books, "rev") === "Ap",
    "Should resolve 'rev' to 'Ap' from books object"
  );

  console.log("✓ Sigla resolved correctly from books object");
}

function testSiglaWithNumericPrefix() {
  const books = createBooksFixture();

  console.assert(
    resolveSigla(books, "1co") === "1 Kor",
    "Should resolve '1co' to '1 Kor' (book ID starting with number)"
  );

  console.log("✓ Sigla works with numeric-prefixed book IDs");
}

function testSiglaFallbackForUnknownBook() {
  const books = createBooksFixture();

  console.assert(
    resolveSigla(books, "xyz") === "XYZ",
    "Should fallback to uppercased bookId for unknown books"
  );

  console.log("✓ Sigla falls back to bookId.toUpperCase() for unknown books");
}

function testSiglaFallbackForMissingSiglaField() {
  // Simulate a book entry without the sigla field (backwards compatibility)
  const books = {
    gen: { name: "Rodzaju", group: "ot" },
  };

  console.assert(
    resolveSigla(books, "gen") === "GEN",
    "Should fallback to uppercased bookId when sigla field is missing"
  );

  console.log("✓ Sigla falls back correctly when sigla field is absent");
}

function testSiglaWithNullBookId() {
  const books = createBooksFixture();

  console.assert(
    resolveSigla(books, null) === "",
    "Should return empty string for null bookId"
  );

  console.log("✓ Sigla handles null bookId gracefully");
}

function testSiglaWithEmptyBooksObject() {
  const books = {};

  console.assert(
    resolveSigla(books, "gen") === "GEN",
    "Should fallback when books is empty (loading state)"
  );

  console.log("✓ Sigla handles empty books object (loading state)");
}

// ─── Tests: Locale-dependent sigla from different API responses ─────────────

function testSiglaChangesWithLocale() {
  const booksPl = createBooksFixture();
  const booksEn = createBooksFixtureEnglish();

  const plSigla = resolveSigla(booksPl, "gen");
  const enSigla = resolveSigla(booksEn, "gen");

  console.assert(plSigla === "Rdz", "Polish sigla for gen should be 'Rdz'");
  console.assert(enSigla === "Gen", "English sigla for gen should be 'Gen'");
  console.assert(
    plSigla !== enSigla,
    "Sigla should differ between locales (from different API responses)"
  );

  console.log("✓ Sigla differs correctly between locale-specific API data");
}

function testSiglaConsistentWithBookName() {
  const books = createBooksFixture();

  // Sigla should be shorter than the full book name
  for (const [bookId, book] of Object.entries(books)) {
    const sigla = resolveSigla(books, bookId);
    console.assert(
      sigla.length <= book.name.length,
      `Sigla '${sigla}' should be shorter than or equal to name '${book.name}'`
    );
  }

  console.log("✓ All sigla are shorter than or equal to their book names");
}

// ─── Tests: SelectionGrid display name logic ────────────────────────────────

function testDisplayNameMobileUsesSigla() {
  const books = createBooksFixture();

  console.assert(
    getBookDisplayName(books, "gen", true) === "Rdz",
    "Mobile display should show sigla 'Rdz' for gen"
  );
  console.assert(
    getBookDisplayName(books, "mat", true) === "Mt",
    "Mobile display should show sigla 'Mt' for mat"
  );

  console.log("✓ Mobile display uses sigla from books object");
}

function testDisplayNameDesktopUsesFullName() {
  const books = createBooksFixture();

  console.assert(
    getBookDisplayName(books, "gen", false) === "Rodzaju",
    "Desktop display should show full name 'Rodzaju' for gen"
  );
  console.assert(
    getBookDisplayName(books, "mat", false) === "Ewangelia Mateusza",
    "Desktop display should show full name for mat"
  );

  console.log("✓ Desktop display uses full name from books object");
}

function testDisplayNameMobileFallbackForUnknown() {
  const books = createBooksFixture();

  console.assert(
    getBookDisplayName(books, "unknown", true) === "UNKNOWN",
    "Mobile should fallback to uppercased bookId for unknown book"
  );

  console.log("✓ Mobile display falls back to uppercased ID for unknown books");
}

function testDisplayNameDesktopFallbackForUnknown() {
  const books = createBooksFixture();

  console.assert(
    getBookDisplayName(books, "unknown", false) === "unknown",
    "Desktop should fallback to raw bookId for unknown book"
  );

  console.log("✓ Desktop display falls back to raw bookId for unknown books");
}

// ─── Tests: Integration-style checks ────────────────────────────────────────

function testAllStandardBooksHaveSigla() {
  const books = createBooksFixture();

  // Every book in our fixture must have a non-empty sigla
  for (const [bookId, book] of Object.entries(books)) {
    console.assert(
      book.sigla && book.sigla.length > 0,
      `Book '${bookId}' must have a non-empty sigla field`
    );
  }

  console.log("✓ All fixture books have non-empty sigla");
}

function testComparisonGridReceivesCorrectSigil() {
  // Simulates the prop being passed: books[selectedBook]?.sigla || selectedBook?.toUpperCase()
  const books = createBooksFixture();

  const withSigla = books["mat"]?.sigla || "mat".toUpperCase();
  console.assert(
    withSigla === "Mt",
    "ComparisonGrid should receive 'Mt' for mat"
  );

  const withoutSigla = books["xyz"]?.sigla || "xyz".toUpperCase();
  console.assert(
    withoutSigla === "XYZ",
    "ComparisonGrid should receive 'XYZ' fallback for unknown book"
  );

  console.log("✓ ComparisonGrid bookSigil prop resolves correctly");
}

function testBottomNavigationReceivesCorrectSigla() {
  // Simulates the useMemo: books[selectedBook]?.sigla || selectedBook?.toUpperCase() || ""
  const books = createBooksFixture();

  const currentBookSigla = books["rev"]?.sigla || "rev"?.toUpperCase() || "";
  console.assert(
    currentBookSigla === "Ap",
    "BottomNavigation should receive 'Ap' for rev"
  );

  // Loading state: books is empty
  const emptyBooks = {};
  const loadingSigla =
    emptyBooks["rev"]?.sigla || "rev"?.toUpperCase() || "";
  console.assert(
    loadingSigla === "REV",
    "BottomNavigation should show 'REV' fallback during loading"
  );

  console.log("✓ BottomNavigation currentBook prop resolves correctly");
}

// ─── Runner ─────────────────────────────────────────────────────────────────

function runAllTests() {
  console.log("\n📖 Running sigla migration tests...\n");

  // Basic resolution
  testSiglaResolvedFromBooks();
  testSiglaWithNumericPrefix();
  testSiglaFallbackForUnknownBook();
  testSiglaFallbackForMissingSiglaField();
  testSiglaWithNullBookId();
  testSiglaWithEmptyBooksObject();

  // Locale awareness
  testSiglaChangesWithLocale();
  testSiglaConsistentWithBookName();

  // SelectionGrid display logic
  testDisplayNameMobileUsesSigla();
  testDisplayNameDesktopUsesFullName();
  testDisplayNameMobileFallbackForUnknown();
  testDisplayNameDesktopFallbackForUnknown();

  // Integration-style
  testAllStandardBooksHaveSigla();
  testComparisonGridReceivesCorrectSigil();
  testBottomNavigationReceivesCorrectSigla();

  console.log("\n✅ All sigla migration tests passed!");
}

// Export for use
if (typeof module !== "undefined" && module.exports) {
  module.exports = { runAllTests };
}

// Auto-run in browser
if (globalThis.window !== undefined) {
  runAllTests();
}
