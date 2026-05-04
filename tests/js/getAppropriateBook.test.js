import { describe, it, expect } from 'vitest';
import getAppropriateBook from '../../assets/js/getAppropriateBook';
import { DEFAULT_BOOK } from '../../assets/consts';

describe('getAppropriateBook', () => {
    const structure = {
        'gen': {},
        'exo': {},
        'jhn': {}
    };

    it('returns selectedBook if it exists in structure', () => {
        expect(getAppropriateBook(structure, 'exo')).toBe('exo');
    });

    it('returns DEFAULT_BOOK if selectedBook does not exist but DEFAULT_BOOK exists', () => {
        const structWithDefault = { ...structure, [DEFAULT_BOOK]: {} };
        expect(getAppropriateBook(structWithDefault, 'unknown')).toBe(DEFAULT_BOOK);
    });

    it('returns first book if neither selectedBook nor DEFAULT_BOOK exist', () => {
        expect(getAppropriateBook({'foo': {}, 'bar': {}}, 'unknown')).toBe('foo');
    });
});
