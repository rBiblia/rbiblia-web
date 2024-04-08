import React from "react";
import { useIntl } from "react-intl";

const ChapterSelector = ({
    chapters,
    isStructureLoading,
    selectedChapter,
    changeSelectedChapter,
}) => {
    const { formatMessage } = useIntl();

    const onSelect = (event) => {
        changeSelectedChapter(event.target.value);
    };

    if (!isStructureLoading && chapters && chapters.length) {
        return (
            <select
                className="form-control"
                onChange={onSelect}
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
};

export default ChapterSelector;
