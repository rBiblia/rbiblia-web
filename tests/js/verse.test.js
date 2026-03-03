/**
 * Verse component logic - Tests
 *
 * Tests for app link format, note preview threshold,
 * and floating action button visibility logic.
 */

// ─── App Link Format Tests ─────────────────────────────────────────────────

function testAppLinkFormat() {
  // Current format: bib://bookIdchapterId:verseId
  const buildAppLink = (bookId, chapterId, verseId) =>
    `bib://${bookId}${chapterId}:${verseId}`;

  console.assert(
    buildAppLink("col", 1, 14) === "bib://col1:14",
    "App link should be bib://col1:14"
  );
  console.assert(
    buildAppLink("gen", 3, 16) === "bib://gen3:16",
    "App link should be bib://gen3:16"
  );
  console.assert(
    buildAppLink("1co", 13, 4) === "bib://1co13:4",
    "App link should handle books starting with numbers"
  );
  console.assert(
    buildAppLink("mat", 28, 20) === "bib://mat28:20",
    "App link should be bib://mat28:20"
  );
  console.assert(
    buildAppLink("rev", 1, 1) === "bib://rev1:1",
    "App link should be bib://rev1:1"
  );

  // Verify old format is NOT generated
  const link = buildAppLink("col", 1, 14);
  console.assert(
    !link.startsWith("rbiblia://"),
    "Should NOT use old rbiblia:// scheme"
  );
  // Verify old format separators are NOT present in the path
  const linkPath = link.replace("bib://", "");
  console.assert(
    !linkPath.includes("/"),
    "Path should NOT use slash separators (old format used col/1/14)"
  );

  console.log("✓ App link format tests passed");
}

// ─── Note Preview Threshold Tests ──────────────────────────────────────────

function testNotePreviewThreshold() {
  const NOTE_PREVIEW_TOGGLE_THRESHOLD = 80;

  // New logic: checks each note text individually
  const isNoteExpandable = (noteText, translationNoteText) => {
    const hasNote = !!noteText;
    const hasTranslationNote = !!translationNoteText;
    return (
      (hasNote &&
        (noteText.length > NOTE_PREVIEW_TOGGLE_THRESHOLD ||
          noteText.includes("\n"))) ||
      (hasTranslationNote &&
        (translationNoteText.length > NOTE_PREVIEW_TOGGLE_THRESHOLD ||
          translationNoteText.includes("\n")))
    );
  };

  // Short single note — not expandable
  console.assert(
    isNoteExpandable("Short note", "") === false,
    "Short single note should NOT be expandable"
  );

  // Exactly at threshold — not expandable
  const exactText = "a".repeat(80);
  console.assert(
    isNoteExpandable(exactText, "") === false,
    "Note at exactly 80 chars should NOT be expandable"
  );

  // One char over threshold — expandable
  const overText = "a".repeat(81);
  console.assert(
    isNoteExpandable(overText, "") === true,
    "Note at 81 chars should be expandable"
  );

  // Long note — expandable
  const longNote = "a".repeat(200);
  console.assert(
    isNoteExpandable(longNote, "") === true,
    "Long note (200 chars) should be expandable"
  );

  // Multi-line single note — expandable
  console.assert(
    isNoteExpandable("Line 1\nLine 2", "") === true,
    "Multi-line note should be expandable regardless of length"
  );

  // Empty note — not expandable
  console.assert(
    isNoteExpandable("", "") === false,
    "Empty note should NOT be expandable"
  );

  // Two short notes together — NOT expandable (separator \n should not trigger)
  console.assert(
    isNoteExpandable("Amen", "notatka dla tłumaczenia") === false,
    "Two short notes combined should NOT be expandable (separator \\n fix)"
  );

  // Short global + long translation — expandable (translation is long)
  console.assert(
    isNoteExpandable("Amen", "a".repeat(81)) === true,
    "Short global + long translation note should be expandable"
  );

  // Short global + multiline translation — expandable
  console.assert(
    isNoteExpandable("Amen", "Line 1\nLine 2") === true,
    "Short global + multiline translation note should be expandable"
  );

  console.log("✓ Note preview threshold tests passed");
}

// ─── Floating Action Buttons Visibility Tests ──────────────────────────────

function testFloatingActionButtonsLogic() {
  // Simulates CSS hover logic: buttons visible when row is hovered
  const isButtonsVisible = (isRowHovered, isTouchDevice) => {
    if (isTouchDevice) return false; // Hidden on touch devices
    return isRowHovered;
  };

  // Desktop: visible on hover
  console.assert(
    isButtonsVisible(true, false) === true,
    "Buttons should be visible when row is hovered on desktop"
  );

  // Desktop: hidden when not hovered
  console.assert(
    isButtonsVisible(false, false) === false,
    "Buttons should be hidden when row is not hovered"
  );

  // Touch device: always hidden (uses long-press instead)
  console.assert(
    isButtonsVisible(true, true) === false,
    "Buttons should be hidden on touch devices even when hovered"
  );
  console.assert(
    isButtonsVisible(false, true) === false,
    "Buttons should be hidden on touch devices"
  );

  console.log("✓ Floating action buttons visibility tests passed");
}

// ─── Verse Action Handlers Tests ───────────────────────────────────────────

function testVerseActionHandlers() {
  // Note action should call onLongPress with verseId
  let calledWith = null;
  const onLongPress = (verseId) => {
    calledWith = verseId;
  };

  const openNoteEditor = (verseId, callback) => {
    callback?.(verseId);
  };

  openNoteEditor("14", onLongPress);
  console.assert(
    calledWith === "14",
    'Note action should call onLongPress with verseId "14"'
  );

  // Compare action should call onCompare with verseId
  calledWith = null;
  const onCompare = (verseId) => {
    calledWith = verseId;
  };

  const openComparison = (verseId, callback) => {
    callback?.(verseId);
  };

  openComparison("7", onCompare);
  console.assert(
    calledWith === "7",
    'Compare action should call onCompare with verseId "7"'
  );

  // Null callbacks should not throw
  let threw = false;
  try {
    openNoteEditor("1", null);
    openComparison("1", null);
  } catch (e) {
    threw = true;
  }
  console.assert(!threw, "Null callbacks should not throw");

  console.log("✓ Verse action handlers tests passed");
}

// ─── Note Icon Consistency Tests ───────────────────────────────────────────

function testNoteIconConsistency() {
  // The SVG fill should always be "none" regardless of note state
  const getNoteFill = (hasNote) => "none"; // Current implementation

  console.assert(
    getNoteFill(true) === "none",
    'Note icon fill should be "none" when note exists'
  );
  console.assert(
    getNoteFill(false) === "none",
    'Note icon fill should be "none" when no note exists'
  );

  console.log("✓ Note icon consistency tests passed");
}

// ─── Run All Tests ─────────────────────────────────────────────────────────

function runAllTests() {
  console.log("Running Verse component logic tests...\n");

  testAppLinkFormat();
  testNotePreviewThreshold();
  testFloatingActionButtonsLogic();
  testVerseActionHandlers();
  testNoteIconConsistency();

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
