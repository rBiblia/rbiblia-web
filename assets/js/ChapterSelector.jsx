import React, { memo } from "react";
import PropTypes from "prop-types";
import { useIntl } from "react-intl";

const ChapterSelector = memo(
    ({
        chapters,
        isStructureLoading,
        selectedChapter,
        changeSelectedChapter,
    }) => {
        const { formatMessage } = useIntl();

        const onSelect = (event) => {
            changeSelectedChapter(event.target.value);
        };

        if (!isStructureLoading && chapters?.length) {
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
    }
);

ChapterSelector.displayName = "ChapterSelector";

ChapterSelector.propTypes = {
    chapters: PropTypes.arrayOf(
        PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    ),
    isStructureLoading: PropTypes.bool,
    selectedChapter: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    changeSelectedChapter: PropTypes.func.isRequired,
};

export default ChapterSelector;
