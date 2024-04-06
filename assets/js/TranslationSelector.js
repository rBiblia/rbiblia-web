import React from "react";
import { useIntl } from "react-intl";

const TranslationSelector = ({
    translations,
    selectedTranslation,
    changeSelectedTranslation,
}) => {
    const { locale } = useIntl();
    const onSelect = (event) => {
        changeSelectedTranslation(event.target.value);
    };

    const translationList = [];
    const map = {};
    const languageNames = new Intl.DisplayNames([locale], {
        type: "language",
    });

    translations.forEach((trans) => {
        if (!map[trans.language]) {
            const languageGroup = {
                languageName: languageNames.of(trans.language),
                children: [],
            };
            map[trans.language] = languageGroup.children;
            translationList.push(languageGroup);
        }

        map[trans.language].push(trans);
    });

    return (
        <select
            className="form-control"
            onChange={onSelect}
            value={selectedTranslation}
        >
            {translationList.map(({ languageName, children }, index) => (
                <optgroup label={languageName} key={index}>
                    {children
                        .sort((a, b) => (a.name > b.name ? 1 : -1))
                        .map(({ id, name, date }) => (
                            <option value={id} key={id}>
                                {name} {date === "" ? "" : `[${date}]`}
                            </option>
                        ))}
                </optgroup>
            ))}
        </select>
    );
};

export default TranslationSelector;
