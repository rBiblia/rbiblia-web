import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
    getComparisonLimit,
    setComparisonLimitValue,
    getFavoriteTranslations,
    saveFavoriteTranslations,
    isDiffModeStrict,
    setDiffModeStrict,
    FAVORITE_TRANSLATIONS_UPDATED_EVENT
} from '../../assets/js/SideMenu';

describe('SideMenu Helpers', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    describe('getComparisonLimit / setComparisonLimitValue', () => {
        it('returns default value 4 when missing or null in localStorage', () => {
            expect(getComparisonLimit()).toBe(4);
        });

        it('reads saved value', () => {
            localStorage.setItem('rbiblia_comparison_limit', '5');
            expect(getComparisonLimit()).toBe(5);
        });

        it('saves and reads value (round-trip)', () => {
            setComparisonLimitValue(6);
            expect(getComparisonLimit()).toBe(6);
            expect(localStorage.getItem('rbiblia_comparison_limit')).toBe('6');
        });
    });

    describe('getFavoriteTranslations / saveFavoriteTranslations', () => {
        it('returns default value [] when empty in localStorage', () => {
            expect(getFavoriteTranslations()).toEqual([]);
        });

        it('round-trips save and load of list', () => {
            const list = ['pl_bb', 'en_kjv'];
            saveFavoriteTranslations(list);
            expect(getFavoriteTranslations()).toEqual(list);
            expect(JSON.parse(localStorage.getItem('rbiblia_favorite_translations'))).toEqual(list);
        });

        it('dispatches CustomEvent rbiblia:favorite-translations-updated', () => {
            const spy = vi.spyOn(window, 'dispatchEvent');
            const list = ['pl_ubg'];
            
            saveFavoriteTranslations(list);
            
            expect(spy).toHaveBeenCalledTimes(1);
            const event = spy.mock.calls[0][0];
            expect(event.type).toBe(FAVORITE_TRANSLATIONS_UPDATED_EVENT);
            expect(event.detail).toEqual(list);
        });
    });

    describe('isDiffModeStrict / setDiffModeStrict', () => {
        it('defaults to false when key missing', () => {
            expect(isDiffModeStrict()).toBe(false);
        });

        it('sets and gets strict diff mode correctly', () => {
            setDiffModeStrict(true);
            expect(isDiffModeStrict()).toBe(true);
            expect(localStorage.getItem('rbiblia_comparison_diff_strict')).toBe('1');
            
            setDiffModeStrict(false);
            expect(isDiffModeStrict()).toBe(false);
            expect(localStorage.getItem('rbiblia_comparison_diff_strict')).toBe('0');
        });
    });

    describe('Edge cases', () => {
        it('getFavoriteTranslations returns [] for corrupted JSON', () => {
            localStorage.setItem('rbiblia_favorite_translations', '{ invalid json }');
            expect(getFavoriteTranslations()).toEqual([]);
        });

        it('getComparisonLimit parses invalid value as NaN (but handles appropriately usually)', () => {
            localStorage.setItem('rbiblia_comparison_limit', 'invalid');
            expect(getComparisonLimit()).toBeNaN();
        });
    });
});
