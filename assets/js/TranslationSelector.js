import React, { Component } from "react";
import { injectIntl } from "react-intl";

class TranslationSelector extends Component {
    constructor(props) {
        super(props);

        this.onSelect = this.onSelect.bind(this);
    }

    onSelect(event) {
        return this.props.changeSelectedTranslation(event.target.value);
    }

    render() {
        const {
                translations,
                selectedTranslation,
                intl: { locale },
            } = this.props,
            translationList = [],
            map = {},
            languageNames = new Intl.DisplayNames([locale], {
                type: "language",
            });

        translations.forEach((trans) => {
            const languageGroup = {};

            if (!map[trans.language]) {
                map[trans.language] = [];
                languageGroup.languageName = languageNames.of(trans.language);
                languageGroup.children = map[trans.language];
                translationList.push(languageGroup);
            }

            map[trans.language].push(trans);
        });

        return (
            <select
                className="form-control"
                onChange={this.onSelect}
                value={selectedTranslation}
            >
                {translationList.map(({ languageName, children }, key) => (
                    <optgroup label={languageName} key={key}>
                        {children
                            .sort((a, b) => (a.name > b.name ? 1 : -1))
                            .map(({ id, name, date }) => (
                                <option value={id} key={id}>
                                    {name} {date === "" ? "" : "[" + date + "]"}
                                </option>
                            ))}
                    </optgroup>
                ))}
            </select>
        );
    }
}

export default injectIntl(TranslationSelector);
