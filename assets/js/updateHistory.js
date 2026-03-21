import Cookies from "js-cookie";
import { COOKIE_EXPIRES, URL_PREFIX } from "../consts";

/*
 * Note:
 * The history (url path) should be updated when
 * the last call is finished and verses are ready to be displayed
 */
function updateHistory(language, translation, book, chapter, verse = null) {
    Cookies.set("recent_language", language, { expires: COOKIE_EXPIRES });
    Cookies.set("recent_translation", translation, {
        expires: COOKIE_EXPIRES,
    });
    Cookies.set("recent_book", book, { expires: COOKIE_EXPIRES });
    Cookies.set("recent_chapter", chapter, { expires: COOKIE_EXPIRES });

    const hash = verse ? `#${verse}` : "";

    globalThis.history.pushState(
        {},
        "",
        `${URL_PREFIX}/${language}/${translation}/${book}/${chapter}${hash}`
    );
}

export default updateHistory;
