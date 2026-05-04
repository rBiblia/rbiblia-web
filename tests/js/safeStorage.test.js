import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    safeLocalStorageGetItem,
    safeLocalStorageSetItem,
    safeLocalStorageRemoveItem,
    safeLocalStorageLength,
    safeLocalStorageKey,
} from '../../assets/js/safeStorage';

describe('safeStorage', () => {
    let mockStorage;

    beforeEach(() => {
        mockStorage = new Map();
        
        const storageMock = {
            getItem: vi.fn((key) => mockStorage.get(key) || null),
            setItem: vi.fn((key, value) => mockStorage.set(key, value)),
            removeItem: vi.fn((key) => mockStorage.delete(key)),
            get length() { return mockStorage.size; },
            key: vi.fn((idx) => Array.from(mockStorage.keys())[idx] || null)
        };

        vi.stubGlobal('localStorage', storageMock);
    });

    it('gets item successfully', () => {
        mockStorage.set('test_key', 'test_val');
        expect(safeLocalStorageGetItem('test_key')).toBe('test_val');
    });

    it('returns null when getItem throws', () => {
        localStorage.getItem.mockImplementation(() => { throw new Error('Access denied'); });
        expect(safeLocalStorageGetItem('test_key')).toBeNull();
    });

    it('sets item successfully', () => {
        expect(safeLocalStorageSetItem('test_key', 'test_val')).toBe(true);
        expect(mockStorage.get('test_key')).toBe('test_val');
    });

    it('returns false when setItem throws', () => {
        localStorage.setItem.mockImplementation(() => { throw new Error('Access denied'); });
        expect(safeLocalStorageSetItem('test_key', 'test_val')).toBe(false);
    });

    it('removes item successfully', () => {
        mockStorage.set('test_key', 'test_val');
        expect(safeLocalStorageRemoveItem('test_key')).toBe(true);
        expect(mockStorage.has('test_key')).toBe(false);
    });

    it('returns false when removeItem throws', () => {
        localStorage.removeItem.mockImplementation(() => { throw new Error('Access denied'); });
        expect(safeLocalStorageRemoveItem('test_key')).toBe(false);
    });

    it('gets length successfully', () => {
        mockStorage.set('k1', 'v1');
        mockStorage.set('k2', 'v2');
        expect(safeLocalStorageLength()).toBe(2);
    });

    it('returns 0 when length throws', () => {
        vi.stubGlobal('localStorage', {
            get length() { throw new Error('Access denied'); }
        });
        expect(safeLocalStorageLength()).toBe(0);
    });

    it('gets key by index successfully', () => {
        mockStorage.set('k1', 'v1');
        mockStorage.set('k2', 'v2');
        expect(safeLocalStorageKey(1)).toBe('k2');
    });

    it('returns null when key throws', () => {
        localStorage.key.mockImplementation(() => { throw new Error('Access denied'); });
        expect(safeLocalStorageKey(1)).toBeNull();
    });
});
