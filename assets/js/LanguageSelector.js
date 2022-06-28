import React, { useCallback } from "react";
import { useIntl } from "react-intl";
import {LANGUAGES} from '../consts';

const LanguageSelector = ({setLocale}) => {
    const {locale} = useIntl();
    const handleOnChange = useCallback(e => setLocale(e.target.value), [setLocale]);

    const options = Object.keys(LANGUAGES).map(langCode =>
        <option key={langCode} value={langCode}>{LANGUAGES[langCode]}</option>
    );
    
    return (
        <select value={locale} onChange={handleOnChange}>
            {options}
        </select>
    );
};

export default LanguageSelector;
