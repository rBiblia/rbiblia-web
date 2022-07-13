import { formatMessage } from "@formatjs/intl";
import React, { Component } from "react";
import { injectIntl } from "react-intl";

class ChapterSelector extends Component {
    constructor(props) {
        super(props);
        this.onSelect = this.onSelect.bind(this);
    }

    onSelect(event) {
        return this.props.changeSelectedChapter(event.target.value);
    }

    render() {
        const {
            chapters,
            isStructureLoaded,
            selectedChapter,
            intl: { formatMessage },
        } = this.props;

        if (isStructureLoaded && chapters && chapters.length) {
            return (
                <select
                    className="form-control"
                    onChange={this.onSelect}
                    value={selectedChapter}
                >
                    {chapters.map((chapterId) => (
                        <option value={chapterId} key={chapterId}>
                            {chapterId}
                        </option>
                    ))}
                </select>
            );
        }

        return (
            <select className="form-control selector-disabled">
                <option>{formatMessage({ id: "chapterList" })}</option>
            </select>
        );
    }
}

export default injectIntl(ChapterSelector);
