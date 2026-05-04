import { describe, it, expect, beforeEach } from 'vitest';
import { 
  getVerseKey, 
  getTranslationVerseKey, 
  parseTranslationVerseKey,
  loadNotes,
  saveNotes,
  loadGeneralNotes,
  saveGeneralNotes
} from '../../assets/js/Notes';

describe('Notes utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getVerseKey', () => {
    it('generates correct format', () => {
      expect(getVerseKey("gen", 1, 1)).toBe("gen_1_1");
      expect(getVerseKey("1co", 13, 4)).toBe("1co_13_4");
    });
  });

  describe('getTranslationVerseKey', () => {
    it('generates correct format with translation prefix', () => {
      expect(getTranslationVerseKey("pl_bb", "gen", 4, 6)).toBe("pl_bb:gen_4_6");
      expect(getTranslationVerseKey("pl_pns_2018", "1co", 13, 4)).toBe("pl_pns_2018:1co_13_4");
    });
  });

  describe('parseTranslationVerseKey', () => {
    it('parses correctly', () => {
      expect(parseTranslationVerseKey("pl_bb:gen_4_6")).toEqual({
        translationId: "pl_bb",
        book: "gen",
        chapter: "4",
        verse: "6"
      });
      
      expect(parseTranslationVerseKey("pl_pns_2018:1co_13_4")).toEqual({
        translationId: "pl_pns_2018",
        book: "1co",
        chapter: "13",
        verse: "4"
      });
    });
  });

  describe('Storage functions', () => {
    it('loadNotes returns empty object when no notes', () => {
      expect(loadNotes()).toEqual({});
    });

    it('saveNotes and loadNotes work together', () => {
      const notes = { "gen_1_1": "Test note" };
      saveNotes(notes);
      expect(loadNotes()).toEqual(notes);
      expect(JSON.parse(localStorage.getItem('rbiblia_notes'))).toEqual(notes);
    });

    it('loadGeneralNotes returns empty array when no notes', () => {
      expect(loadGeneralNotes()).toEqual([]);
    });

    it('saveGeneralNotes and loadGeneralNotes work together', () => {
      const notes = [{ id: 1, text: "Test general note" }];
      saveGeneralNotes(notes);
      expect(loadGeneralNotes()).toEqual(notes);
      expect(JSON.parse(localStorage.getItem('rbiblia_general_notes'))).toEqual(notes);
    });
  });
});
