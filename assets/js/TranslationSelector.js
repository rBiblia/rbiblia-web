import React, {Component} from "react";

export default class TranslationSelector extends Component {
    constructor(props) {
        super(props);

        this.state = {
            selectedTranslation: null
        };
    }

    handleTranslationSelect(id, event) {
        this.setState({selectedTranslation: event.target.value});
    }

    render() {
        const {translations} = this.props,
              translationList = [],
              map = {},
              languageNames = new Intl.DisplayNames(['pl'], {type: 'language'});

        translations.forEach(trans => {
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
            <select className="form-control" onChange={(event) => this.handleTranslationSelect(this.selectedIndex, event)}>
                {translationList.map(({languageName, children}, key) => {
                    return (
                        <optgroup label={languageName} key={key}>{
                            children.map(({id, name}) => (
                                <option value={id} key={id}>{name}</option>
                            ))
                        }</optgroup>
                    );
                })}
            </select>
        );
    }
}
