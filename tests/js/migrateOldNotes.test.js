import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import migrateOldNotes from '../../assets/js/migrateOldNotes';

describe('migrateOldNotes', () => {
  let logSpy, errorSpy;

  beforeEach(() => {
    localStorage.clear();
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('skips migration if no old notes exist', () => {
    migrateOldNotes();
    expect(localStorage.getItem('rbiblia_notes_migrated')).toBe('1');
  });

  it('migrates valid verse notes and chapter notes to new format', () => {
    // Setup legacy notes
    localStorage.setItem('note_verse_gen_1_1', 'A note on genesis 1:1');
    localStorage.setItem('note_chapter_gen_1', 'Chapter note');

    migrateOldNotes();

    const newVerseNotes = JSON.parse(localStorage.getItem('rbiblia_notes') || '{}');
    expect(newVerseNotes['gen_1_1']).toBe('A note on genesis 1:1');
    
    const newGeneralNotes = JSON.parse(localStorage.getItem('rbiblia_general_notes') || '[]');
    expect(newGeneralNotes.length).toBe(1);
    expect(newGeneralNotes[0].text).toBe('[gen 1] Chapter note');

    expect(localStorage.getItem('rbiblia_notes_migrated')).toBe('1');
    expect(localStorage.getItem('note_verse_gen_1_1')).toBeNull(); // should be removed
    expect(localStorage.getItem('note_chapter_gen_1')).toBeNull(); // should be removed
  });

  it('does not overwrite existing notes in the new format', () => {
    localStorage.setItem('note_verse_gen_1_1', 'Old note');
    localStorage.setItem('rbiblia_notes', JSON.stringify({ gen_1_1: 'Existing unified note' }));
    
    migrateOldNotes();
    
    const newNotes = JSON.parse(localStorage.getItem('rbiblia_notes') || '{}');
    expect(newNotes['gen_1_1']).toBe('Existing unified note');
  });

  it('skips migration if already migrated', () => {
    localStorage.setItem('rbiblia_notes_migrated', '1');
    localStorage.setItem('note_verse_gen_1_1', 'note');
    
    migrateOldNotes();
    
    const newNotes = localStorage.getItem('rbiblia_notes');
    expect(newNotes).toBeNull(); // Shouldn't have migrated
    expect(localStorage.getItem('note_verse_gen_1_1')).toBe('note'); // Shouldn't have been removed
  });
});
