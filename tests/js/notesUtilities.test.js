import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
    escapeXml,
    exportNotesXml,
    importNotesXml,
    downloadFile,
    loadNotes,
    saveNotes,
    loadTranslationNotes,
    saveTranslationNotes
} from '../../assets/js/Notes';

describe('Notes Utilities (Pure Functions)', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe('escapeXml', () => {
        it('escapes special characters', () => {
            expect(escapeXml('foo & bar')).toBe('foo &amp; bar');
            expect(escapeXml('<script>alert("test")</script>')).toBe('&lt;script&gt;alert(&quot;test&quot;)&lt;/script&gt;');
            expect(escapeXml("it's a test")).toBe('it&apos;s a test');
        });

        it('returns empty string for empty input', () => {
            expect(escapeXml('')).toBe('');
        });

        it('handles text without special characters', () => {
            expect(escapeXml('Hello world 123')).toBe('Hello world 123');
        });

        it('handles mixed text with multiple entities', () => {
            expect(escapeXml('A & B < C > D " E \' F')).toBe('A &amp; B &lt; C &gt; D &quot; E &apos; F');
        });
    });

    describe('exportNotesXml', () => {
        it('generates valid XML with global notes', () => {
            saveNotes({
                'gen_1_1': 'In the beginning',
                'exo_2_3': 'Moses in the basket'
            });
            const xml = exportNotesXml();
            expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
            expect(xml).toContain('<notes app="rBiblia">');
            expect(xml).toContain('<translation>');
            expect(xml).toContain('<note book="gen" chapter="1" verse="1">In the beginning</note>');
            expect(xml).toContain('<note book="exo" chapter="2" verse="3">Moses in the basket</note>');
            expect(xml).toContain('</translation>');
            expect(xml).toContain('</notes>');
        });

        it('generates XML with translation-specific notes', () => {
            saveTranslationNotes({
                'pl_bb:joh_3_16': 'For God so loved'
            });
            const xml = exportNotesXml();
            expect(xml).toContain('<translation id="pl_bb">');
            expect(xml).toContain('<note book="joh" chapter="3" verse="16">For God so loved</note>');
        });

        it('handles mixed notes (global + translation)', () => {
            saveNotes({ 'psa_23_1': 'The Lord is my shepherd' });
            saveTranslationNotes({ 'en_kjv:psa_23_1': 'The LORD is my shepherd' });
            const xml = exportNotesXml();
            
            // Global
            expect(xml).toContain('<translation>');
            expect(xml).toContain('<note book="psa" chapter="23" verse="1">The Lord is my shepherd</note>');
            // Translation specific
            expect(xml).toContain('<translation id="en_kjv">');
            expect(xml).toContain('<note book="psa" chapter="23" verse="1">The LORD is my shepherd</note>');
        });

        it('returns empty <notes> element when no notes exist', () => {
            const xml = exportNotesXml();
            expect(xml).toBe('<?xml version="1.0" encoding="UTF-8"?>\n<notes app="rBiblia">\n</notes>\n');
        });
    });

    describe('importNotesXml', () => {
        it('imports global note from valid XML', () => {
            const xml = `<?xml version="1.0" encoding="UTF-8"?>
            <notes app="rBiblia">
                <translation>
                    <note book="rev" chapter="21" verse="1">New heaven and new earth</note>
                </translation>
            </notes>`;
            
            const result = importNotesXml(xml);
            expect(result.globalCount).toBe(1);
            expect(result.translationCount).toBe(0);
            
            const saved = loadNotes();
            expect(saved['rev_21_1']).toBe('New heaven and new earth');
        });

        it('imports translation-specific notes', () => {
            const xml = `<?xml version="1.0" encoding="UTF-8"?>
            <notes app="rBiblia">
                <translation id="pl_ubg">
                    <note book="mat" chapter="1" verse="1">Genealogy</note>
                </translation>
            </notes>`;
            
            const result = importNotesXml(xml);
            expect(result.globalCount).toBe(0);
            expect(result.translationCount).toBe(1);
            
            const saved = loadTranslationNotes();
            expect(saved['pl_ubg:mat_1_1']).toBe('Genealogy');
        });

        it('throws Error for invalid XML format (parsererror)', () => {
            const invalidXml = '<notes><unclosed_tag></notes>';
            expect(() => importNotesXml(invalidXml)).toThrow('Invalid XML format');
        });

        it('throws Error for missing <notes> root element', () => {
            const missingRoot = '<?xml version="1.0"?><data></data>';
            expect(() => importNotesXml(missingRoot)).toThrow('Missing <notes> root element');
        });
    });

    describe('Translation Notes Storage', () => {
        it('loadTranslationNotes returns empty object when no data', () => {
            expect(loadTranslationNotes()).toEqual({});
        });

        it('saveTranslationNotes and loadTranslationNotes round-trip', () => {
            const notes = { 'pl_ubg:joh_1_1': 'In the beginning was the Word' };
            saveTranslationNotes(notes);
            expect(loadTranslationNotes()).toEqual(notes);
        });
    });

    describe('downloadFile', () => {
        let createObjectURLMock;
        let revokeObjectURLMock;
        let appendChildMock;
        let removeMock;
        let clickMock;

        beforeEach(() => {
            createObjectURLMock = vi.fn().mockReturnValue('blob:test-url');
            revokeObjectURLMock = vi.fn();
            globalThis.URL.createObjectURL = createObjectURLMock;
            globalThis.URL.revokeObjectURL = revokeObjectURLMock;

            clickMock = vi.fn();
            removeMock = vi.fn();
            const mockAnchor = {
                href: '',
                download: '',
                click: clickMock,
                remove: removeMock
            };

            vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
            appendChildMock = vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('creates a blob, anchor and clicks it to download', () => {
            downloadFile('content', 'test.xml', 'application/xml');
            
            expect(createObjectURLMock).toHaveBeenCalled();
            expect(document.createElement).toHaveBeenCalledWith('a');
            expect(appendChildMock).toHaveBeenCalled();
            expect(clickMock).toHaveBeenCalled();
            expect(removeMock).toHaveBeenCalled();
            expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:test-url');
        });
    });
});
