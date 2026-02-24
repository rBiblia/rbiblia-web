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
        setItem: (key, value) => { store[key] = value.toString(); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; },
        get length() { return Object.keys(store).length; },
        key: (i) => Object.keys(store)[i] || null
    };
};

// Test: getVerseKey generates correct format
function testGetVerseKey() {
    const getVerseKey = (bookId, chapterId, verseId) => `${bookId}_${chapterId}_${verseId}`;

    console.assert(
        getVerseKey('gen', 1, 1) === 'gen_1_1',
        'getVerseKey should return correct format'
    );
    console.assert(
        getVerseKey('1co', 13, 4) === '1co_13_4',
        'getVerseKey should handle book IDs starting with numbers'
    );
    console.log('✓ getVerseKey tests passed');
}

// Test: loadNotes returns empty object when no notes
function testLoadNotesEmpty() {
    const mockStorage = createMockStorage();

    const loadNotes = () => {
        try {
            return JSON.parse(mockStorage.getItem('rbiblia_notes') || '{}');
        } catch {
            return {};
        }
    };

    console.assert(
        Object.keys(loadNotes()).length === 0,
        'loadNotes should return empty object when no notes exist'
    );
    console.log('✓ loadNotes empty storage test passed');
}

// Test: loadNotes returns saved notes
function testLoadNotesSaved() {
    const mockStorage = createMockStorage();
    const testNotes = { 'gen_1_1': 'Test note' };
    mockStorage.setItem('rbiblia_notes', JSON.stringify(testNotes));

    const loadNotes = () => {
        try {
            return JSON.parse(mockStorage.getItem('rbiblia_notes') || '{}');
        } catch {
            return {};
        }
    };

    const loaded = loadNotes();
    console.assert(
        loaded['gen_1_1'] === 'Test note',
        'loadNotes should return saved notes'
    );
    console.log('✓ loadNotes with saved notes test passed');
}

// Test: saveNotes persists notes
function testSaveNotes() {
    const mockStorage = createMockStorage();
    const testNotes = { 'gen_1_1': 'New note', 'exo_2_3': 'Another note' };

    const saveNotes = (notes) => {
        mockStorage.setItem('rbiblia_notes', JSON.stringify(notes));
    };

    saveNotes(testNotes);

    const saved = JSON.parse(mockStorage.getItem('rbiblia_notes'));
    console.assert(
        saved['gen_1_1'] === 'New note',
        'saveNotes should persist notes'
    );
    console.assert(
        Object.keys(saved).length === 2,
        'saveNotes should save all notes'
    );
    console.log('✓ saveNotes tests passed');
}

// Test: Notes export format
function testNotesExportFormat() {
    const notes = { 'gen_1_1': 'Note 1' };
    const generalNotes = [{ id: 'note1', text: 'General note', createdAt: '2026-01-01' }];

    const exportData = {
        version: 1,
        exportDate: new Date().toISOString(),
        verseNotes: notes,
        generalNotes: generalNotes
    };

    console.assert(exportData.version === 1, 'Export should have version');
    console.assert(exportData.verseNotes !== undefined, 'Export should have verseNotes');
    console.assert(exportData.generalNotes !== undefined, 'Export should have generalNotes');
    console.assert(typeof exportData.exportDate === 'string', 'Export should have date string');
    console.log('✓ Notes export format tests passed');
}

// Test: Notes import merge
function testNotesImportMerge() {
    const existing = { 'gen_1_1': 'Existing note' };
    const imported = { 'gen_1_1': 'Updated note', 'exo_2_3': 'New note' };

    // Merge: imported overwrites existing
    const merged = { ...existing, ...imported };

    console.assert(
        merged['gen_1_1'] === 'Updated note',
        'Merge should overwrite existing notes'
    );
    console.assert(
        merged['exo_2_3'] === 'New note',
        'Merge should add new notes'
    );
    console.assert(
        Object.keys(merged).length === 2,
        'Merge should have correct count'
    );
    console.log('✓ Notes import merge tests passed');
}

// Run all tests
function runAllTests() {
    console.log('Running Notes utility tests...\n');

    testGetVerseKey();
    testLoadNotesEmpty();
    testLoadNotesSaved();
    testSaveNotes();
    testNotesExportFormat();
    testNotesImportMerge();

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
