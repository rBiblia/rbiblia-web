import Cookies from "js-cookie";
import {
    DEFAULT_BOOK,
    DEFAULT_CHAPTER,
    DEFAULT_TRANSLATION,
    URL_PREFIX,
} from "../consts";
import getDefaultLanguage from "./getDefaultLanguage";
/**
 * It gets specific resource id with the following priorities:
 * 1. From the URL
 * 2. From the cookies
 * 3. If not exist, get default value from constants.
 */
export default function getDataFromCurrentPathname() {
    const [
        ,
        //ignore first element ""
        defaultLanguage,
        defaultTranslation,
        defaultBook,
        defaultChapter,
    ] = window.location.pathname
        .replace(URL_PREFIX, "")
        // remove trailing slash from the end of path
        .replace(/\/$/, "")
        .split("/");

    const language = defaultLanguage || getDefaultLanguage();
    const translation =
        defaultTranslation ||
        Cookies.get("recent_translation") ||
        DEFAULT_TRANSLATION;
    const book = defaultBook || Cookies.get("recent_book") || DEFAULT_BOOK;
    const chapter =
        defaultChapter || Cookies.get("recent_chapter") || DEFAULT_CHAPTER;

    return { language, translation, book, chapter };
}
