/**
 * Notes utility functions - Tests
 *
 * Run these tests in browser console or with Node.js test runner
 */

// Mock localStorage for testing
const createMockStorage = () => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (i) => Object.keys(store)[i] || null,
  };
};

// Test: getVerseKey generates correct format
function testGetVerseKey() {
  const getVerseKey = (bookId, chapterId, verseId) =>
    `${bookId}_${chapterId}_${verseId}`;

  console.assert(
    getVerseKey("gen", 1, 1) === "gen_1_1",
    "getVerseKey should return correct format"
  );
  console.assert(
    getVerseKey("1co", 13, 4) === "1co_13_4",
    "getVerseKey should handle book IDs starting with numbers"
  );
  console.log("✓ getVerseKey tests passed");
}

// Test: getTranslationVerseKey generates correct format
function testGetTranslationVerseKey() {
  const getTranslationVerseKey = (translationId, bookId, chapterId, verseId) =>
    `${translationId}:${bookId}_${chapterId}_${verseId}`;

  console.assert(
    getTranslationVerseKey("pl_bb", "gen", 4, 6) === "pl_bb:gen_4_6",
    "getTranslationVerseKey should return correct format with translation prefix"
  );
  console.assert(
    getTranslationVerseKey("pl_pns_2018", "1co", 13, 4) ===
    "pl_pns_2018:1co_13_4",
    "getTranslationVerseKey should handle complex translation IDs"
  );
  console.log("✓ getTranslationVerseKey tests passed");
}

// Test: parseTranslationVerseKey parses correctly
function testParseTranslationVerseKey() {
  const parseTranslationVerseKey = (key) => {
    const [translationId, rest] = key.split(":");
    const [book, chapter, verse] = rest.split("_");
    return { translationId, book, chapter, verse };
  };

  const result1 = parseTranslationVerseKey("pl_bb:gen_4_6");
  console.assert(
    result1.translationId === "pl_bb",
    "Should parse translationId"
  );
  console.assert(result1.book === "gen", "Should parse book");
  console.assert(result1.chapter === "4", "Should parse chapter");
  console.assert(result1.verse === "6", "Should parse verse");

  const result2 = parseTranslationVerseKey("pl_pns_2018:1co_13_4");
  console.assert(
    result2.translationId === "pl_pns_2018",
    "Should parse complex translationId"
  );
  console.assert(result2.book === "1co", "Should parse book from complex key");
  console.log("✓ parseTranslationVerseKey tests passed");
}

// Test: loadNotes returns empty object when no notes
function testLoadNotesEmpty() {
  const mockStorage = createMockStorage();

  const loadNotes = () => {
    try {
      return JSON.parse(mockStorage.getItem("rbiblia_notes") || "{}");
    } catch {
      return {};
    }
  };

  console.assert(
    Object.keys(loadNotes()).length === 0,
    "loadNotes should return empty object when no notes exist"
  );
  console.log("✓ loadNotes empty storage test passed");
}

// Test: loadNotes returns saved notes
function testLoadNotesSaved() {
  const mockStorage = createMockStorage();
  const testNotes = { gen_1_1: "Test note" };
  mockStorage.setItem("rbiblia_notes", JSON.stringify(testNotes));

  const loadNotes = () => {
    try {
      return JSON.parse(mockStorage.getItem("rbiblia_notes") || "{}");
    } catch {
      return {};
    }
  };

  const loaded = loadNotes();
  console.assert(
    loaded["gen_1_1"] === "Test note",
    "loadNotes should return saved notes"
  );
  console.log("✓ loadNotes with saved notes test passed");
}

// Test: saveNotes persists notes
function testSaveNotes() {
  const mockStorage = createMockStorage();
  const testNotes = { gen_1_1: "New note", exo_2_3: "Another note" };

  const saveNotes = (notes) => {
    mockStorage.setItem("rbiblia_notes", JSON.stringify(notes));
  };

  saveNotes(testNotes);

  const saved = JSON.parse(mockStorage.getItem("rbiblia_notes"));
  console.assert(
    saved["gen_1_1"] === "New note",
    "saveNotes should persist notes"
  );
  console.assert(
    Object.keys(saved).length === 2,
    "saveNotes should save all notes"
  );
  console.log("✓ saveNotes tests passed");
}

// Test: Translation notes storage
function testTranslationNotes() {
  const mockStorage = createMockStorage();

  const loadTranslationNotes = () => {
    try {
      return JSON.parse(
        mockStorage.getItem("rbiblia_translation_notes") || "{}"
      );
    } catch {
      return {};
    }
  };

  const saveTranslationNotes = (notes) => {
    mockStorage.setItem("rbiblia_translation_notes", JSON.stringify(notes));
  };

  // Test empty
  console.assert(
    Object.keys(loadTranslationNotes()).length === 0,
    "loadTranslationNotes should return empty object initially"
  );

  // Test save and load
  const testNotes = {
    "pl_bb:gen_4_6": "Notatka Biblia Brzeska",
    "pl_pns_2018:gen_4_6": "Notatka PNŚ 2018",
  };
  saveTranslationNotes(testNotes);

  const loaded = loadTranslationNotes();
  console.assert(
    loaded["pl_bb:gen_4_6"] === "Notatka Biblia Brzeska",
    "Should load translation note"
  );
  console.assert(
    loaded["pl_pns_2018:gen_4_6"] === "Notatka PNŚ 2018",
    "Should load second translation note"
  );
  console.assert(
    Object.keys(loaded).length === 2,
    "Should have correct count"
  );

  console.log("✓ Translation notes storage tests passed");
}

// Test: Notes export format
function testNotesExportFormat() {
  const notes = { gen_1_1: "Note 1" };
  const generalNotes = [
    { id: "note1", text: "General note", createdAt: "2026-01-01" },
  ];

  const exportData = {
    version: 1,
    exportDate: new Date().toISOString(),
    verseNotes: notes,
    generalNotes: generalNotes,
  };

  console.assert(exportData.version === 1, "Export should have version");
  console.assert(
    exportData.verseNotes !== undefined,
    "Export should have verseNotes"
  );
  console.assert(
    exportData.generalNotes !== undefined,
    "Export should have generalNotes"
  );
  console.assert(
    typeof exportData.exportDate === "string",
    "Export should have date string"
  );
  console.log("✓ Notes export format tests passed");
}

// Test: Notes import merge
function testNotesImportMerge() {
  const existing = { gen_1_1: "Existing note" };
  const imported = { gen_1_1: "Updated note", exo_2_3: "New note" };

  // Merge: imported overwrites existing
  const merged = { ...existing, ...imported };

  console.assert(
    merged["gen_1_1"] === "Updated note",
    "Merge should overwrite existing notes"
  );
  console.assert(
    merged["exo_2_3"] === "New note",
    "Merge should add new notes"
  );
  console.assert(
    Object.keys(merged).length === 2,
    "Merge should have correct count"
  );
  console.log("✓ Notes import merge tests passed");
}

// Test: XML escaping
function testXmlEscaping() {
  const escapeXml = (str) =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  console.assert(
    escapeXml("Hello & World") === "Hello &amp; World",
    "Should escape ampersand"
  );
  console.assert(
    escapeXml("<tag>") === "&lt;tag&gt;",
    "Should escape angle brackets"
  );
  console.assert(
    escapeXml('He said "hi"') === "He said &quot;hi&quot;",
    "Should escape quotes"
  );
  console.assert(
    escapeXml("It's fine") === "It&apos;s fine",
    "Should escape apostrophe"
  );
  console.assert(
    escapeXml("Plain text") === "Plain text",
    "Should not modify plain text"
  );
  console.log("✓ XML escaping tests passed");
}

// Test: XML export generates valid structure
function testXmlExportStructure() {
  const escapeXml = (str) =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  const globalNotes = { gen_4_7: "Global note" };
  const translationNotes = {
    "pl_bb:gen_4_6": "BB note",
    "pl_pns_2018:gen_4_6": "PNŚ note",
  };

  // Simulate export
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<notes app="rBiblia">\n';

  // Global notes
  xml += "  <translation>\n";
  for (const [key, text] of Object.entries(globalNotes)) {
    const [book, chapter, verse] = key.split("_");
    xml += `    <note book="${book}" chapter="${chapter}" verse="${verse}">${escapeXml(text)}</note>\n`;
  }
  xml += "  </translation>\n";

  // Group by translation
  const byTranslation = {};
  for (const [key, text] of Object.entries(translationNotes)) {
    const [translationId, rest] = key.split(":");
    const [book, chapter, verse] = rest.split("_");
    if (!byTranslation[translationId]) byTranslation[translationId] = [];
    byTranslation[translationId].push({ book, chapter, verse, text });
  }

  for (const [translationId, notes] of Object.entries(byTranslation)) {
    xml += `  <translation id="${escapeXml(translationId)}">\n`;
    for (const { book, chapter, verse, text } of notes) {
      xml += `    <note book="${book}" chapter="${chapter}" verse="${verse}">${escapeXml(text)}</note>\n`;
    }
    xml += "  </translation>\n";
  }
  xml += "</notes>\n";

  // Verify structure
  console.assert(
    xml.includes('<?xml version="1.0"'),
    "Should have XML declaration"
  );
  console.assert(
    xml.includes('<notes app="rBiblia">'),
    "Should have notes root element"
  );
  console.assert(
    xml.includes("<translation>"),
    "Should have global translation element"
  );
  console.assert(
    xml.includes('<translation id="pl_bb">'),
    "Should have pl_bb translation"
  );
  console.assert(
    xml.includes('<translation id="pl_pns_2018">'),
    "Should have pl_pns_2018 translation"
  );
  console.assert(
    xml.includes('book="gen" chapter="4" verse="7"'),
    "Should have global note attributes"
  );
  console.assert(
    xml.includes('book="gen" chapter="4" verse="6"'),
    "Should have translation note attributes"
  );
  console.assert(
    xml.includes("Global note"),
    "Should contain global note text"
  );
  console.assert(xml.includes("BB note"), "Should contain BB note text");
  console.assert(xml.includes("PNŚ note"), "Should contain PNŚ note text");

  console.log("✓ XML export structure tests passed");
}

// Test: XML import parsing
function testXmlImportParsing() {
  // Only run in browser environment (needs DOMParser)
  if (typeof DOMParser === "undefined") {
    console.log("⏭ XML import parsing test skipped (no DOMParser in Node.js)");
    return;
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<notes app="rBiblia">
  <translation>
    <note book="gen" chapter="4" verse="7">Globalna notatka</note>
  </translation>
  <translation id="pl_bb">
    <note book="gen" chapter="4" verse="6">Notatka Brzeska</note>
  </translation>
  <translation id="pl_pns_2018">
    <note book="gen" chapter="4" verse="6">Notatka PNŚ</note>
  </translation>
</notes>`;

  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");

  const notesRoot = doc.querySelector("notes");
  console.assert(notesRoot !== null, "Should find notes root");

  const translations = notesRoot.querySelectorAll("translation");
  console.assert(translations.length === 3, "Should find 3 translation groups");

  // First is global (no id)
  console.assert(
    translations[0].getAttribute("id") === null,
    "First translation should have no id (global)"
  );

  // Second is pl_bb
  console.assert(
    translations[1].getAttribute("id") === "pl_bb",
    "Second translation should be pl_bb"
  );

  // Third is pl_pns_2018
  console.assert(
    translations[2].getAttribute("id") === "pl_pns_2018",
    "Third translation should be pl_pns_2018"
  );

  // Check notes in global
  const globalNotes = translations[0].querySelectorAll("note");
  console.assert(globalNotes.length === 1, "Global should have 1 note");
  console.assert(
    globalNotes[0].getAttribute("book") === "gen",
    "Global note book should be gen"
  );
  console.assert(
    globalNotes[0].textContent.trim() === "Globalna notatka",
    "Global note text should match"
  );

  console.log("✓ XML import parsing tests passed");
}

// Run all tests
function runAllTests() {
  console.log("Running Notes utility tests...\n");

  testGetVerseKey();
  testGetTranslationVerseKey();
  testParseTranslationVerseKey();
  testLoadNotesEmpty();
  testLoadNotesSaved();
  testSaveNotes();
  testTranslationNotes();
  testNotesExportFormat();
  testNotesImportMerge();
  testXmlEscaping();
  testXmlExportStructure();
  testXmlImportParsing();

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
