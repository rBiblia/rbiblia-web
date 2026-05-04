import { describe, it, expect, vi, beforeEach } from 'vitest';
import updateHistory from '../../assets/js/updateHistory';
import Cookies from 'js-cookie';
import { URL_PREFIX } from '../../assets/consts';

vi.mock('js-cookie', () => ({
    default: {
        set: vi.fn(),
    }
}));

describe('updateHistory', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        globalThis.history.pushState = vi.fn();
    });

    it('sets cookies and calls pushState without verse', () => {
        updateHistory('pl', 'ubg', 'gen', 1);

        expect(Cookies.set).toHaveBeenCalledTimes(4);
        expect(Cookies.set).toHaveBeenCalledWith('recent_language', 'pl', expect.any(Object));
        expect(Cookies.set).toHaveBeenCalledWith('recent_translation', 'ubg', expect.any(Object));
        expect(Cookies.set).toHaveBeenCalledWith('recent_book', 'gen', expect.any(Object));
        expect(Cookies.set).toHaveBeenCalledWith('recent_chapter', 1, expect.any(Object));

        expect(globalThis.history.pushState).toHaveBeenCalledWith(
            {},
            '',
            `${URL_PREFIX}/pl/ubg/gen/1`
        );
    });

    it('sets cookies and calls pushState with verse hash', () => {
        updateHistory('en', 'kjv', 'jhn', 3, 16);

        expect(globalThis.history.pushState).toHaveBeenCalledWith(
            {},
            '',
            `${URL_PREFIX}/en/kjv/jhn/3#16`
        );
    });
});
