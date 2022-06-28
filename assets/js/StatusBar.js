import React from "react";
import { useIntl } from "react-intl";
import LanguageSelector from "./LanguageSelector";

const StatusBar = ({translations, setLocale}) => {
    const {formatMessage} = useIntl();

    return (
        <footer className="row">
            <div className="col-8">
                <LanguageSelector setLocale={setLocale} /> {formatMessage({id: 'availableTranslationsCounter'})} {translations.length}
            </div>
            <div className="col-4 text-end">
                <a href="/assets/changelog.txt" target="_blank" title="Zobacz dziennik zmian">changelog.txt</a>
            </div>
        </footer>
    );
};

export default StatusBar;
