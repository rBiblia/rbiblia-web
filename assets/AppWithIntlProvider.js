import React, { useState } from "react";
import { IntlProvider } from "react-intl";
import pl from "./translations/pl.json";
import en from "./translations/en.json";

import Bible from "./js/Bible";
import getDataFromCurrentPathname from "./js/getDataFromCurrentPathname";

const translations = {
    pl,
    en
};

export default function AppWithIntlProvider() {
    const [locale, setLocale] = useState(getDataFromCurrentPathname().language);

    return (
        <IntlProvider locale={locale} messages={translations[locale]}>
            <Bible setLocale={setLocale} />
        </IntlProvider>
    );
}
