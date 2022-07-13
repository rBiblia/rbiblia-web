import Cookies from "js-cookie";
import { DEFAULT_LANGUAGE } from "../consts";

export default function getDefaultLanguage() {
    const cookieLanguage = Cookies.get("recent_language");
    const browserLanguage = navigator.language || navigator.userLanguage;

    if (cookieLanguage) {
        return cookieLanguage;
    }

    if (browserLanguage) {
        return browserLanguage.split("-")[0];
    }

    return DEFAULT_LANGUAGE;
}
