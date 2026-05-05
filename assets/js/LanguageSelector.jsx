import React, { useCallback } from "react";
import PropTypes from "prop-types";
import { useIntl } from "react-intl";
import { LANGUAGES } from "../consts";

const LanguageSelector = ({ setLocaleAndUpdateHistory }) => {
    const { locale } = useIntl();
    const handleOnChange = useCallback(
        (e) => setLocaleAndUpdateHistory(e.target.value),
        [setLocaleAndUpdateHistory]
    );

    const options = Object.keys(LANGUAGES).map((langCode) => (
        <option key={langCode} value={langCode}>
            {LANGUAGES[langCode]}
        </option>
    ));

    return (
        <select value={locale} onChange={handleOnChange}>
            {options}
        </select>
    );
};

LanguageSelector.propTypes = {
    setLocaleAndUpdateHistory: PropTypes.func.isRequired,
};

export default LanguageSelector;
