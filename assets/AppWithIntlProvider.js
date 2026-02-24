import React, { useState } from "react";
import { IntlProvider } from "react-intl";
import pl from "./translations/pl.json";
import en from "./translations/en.json";
import de from "./translations/de.json";

import Bible from "./js/Bible";
import ErrorBoundary from "./js/ErrorBoundary";
import getDataFromCurrentPathname from "./js/getDataFromCurrentPathname";

const translations = {
    pl,
    en,
    de,
};

export default function AppWithIntlProvider() {
    const [locale, setLocale] = useState(getDataFromCurrentPathname().language);

    return (
        <IntlProvider locale={locale} messages={translations[locale]}>
            <ErrorBoundary>
                <Bible setLocale={setLocale} />
            </ErrorBoundary>
        </IntlProvider>
    );
}
