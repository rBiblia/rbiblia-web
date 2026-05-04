import React, { memo } from "react";
import PropTypes from "prop-types";
import { useIntl } from "react-intl";

const BookSelector = memo(
    ({
        books,
        structure,
        isStructureLoading,
        selectedBook,
        changeSelectedBook,
    }) => {
        const { formatMessage } = useIntl();
        const onSelect = (event) => {
            changeSelectedBook(event.target.value);
        };

        if (isStructureLoading) {
            return (
                <select className="form-control selector-disabled">
                    <option>{formatMessage({ id: "bookList" })}</option>
                </select>
            );
        }

        return (
            <select
                className="form-control"
                onChange={onSelect}
                value={selectedBook}
            >
                {Object.keys(structure).map((bookId) => (
                    <option value={bookId} key={bookId}>
                        {books[bookId].name}
                    </option>
                ))}
            </select>
        );
    }
);

BookSelector.displayName = "BookSelector";

BookSelector.propTypes = {
    books: PropTypes.objectOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
        })
    ),
    structure: PropTypes.object,
    isStructureLoading: PropTypes.bool,
    selectedBook: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    changeSelectedBook: PropTypes.func.isRequired,
};

export default BookSelector;
