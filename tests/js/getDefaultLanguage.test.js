import { describe, it, expect, vi, beforeEach } from 'vitest';
import getDefaultLanguage from '../../assets/js/getDefaultLanguage';
import Cookies from 'js-cookie';
import { DEFAULT_LANGUAGE } from '../../assets/consts';

vi.mock('js-cookie', () => ({
    default: {
        get: vi.fn(),
    }
}));

describe('getDefaultLanguage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal('navigator', {});
    });

    it('returns language from cookie if available', () => {
        Cookies.get.mockReturnValue('de');
        expect(getDefaultLanguage()).toBe('de');
    });

    it('returns language from navigator.language if no cookie', () => {
        Cookies.get.mockReturnValue(undefined);
        vi.stubGlobal('navigator', { language: 'fr-FR' });
        expect(getDefaultLanguage()).toBe('fr');
    });

    it('returns language from navigator.userLanguage if no cookie', () => {
        Cookies.get.mockReturnValue(undefined);
        vi.stubGlobal('navigator', { userLanguage: 'es-ES' });
        expect(getDefaultLanguage()).toBe('es');
    });

    it('returns DEFAULT_LANGUAGE as fallback', () => {
        Cookies.get.mockReturnValue(undefined);
        vi.stubGlobal('navigator', {});
        expect(getDefaultLanguage()).toBe(DEFAULT_LANGUAGE);
    });
});
