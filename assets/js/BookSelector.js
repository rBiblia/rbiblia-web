import React from "react";
import { useIntl } from "react-intl";

const BookSelector = ({
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
};

export default BookSelector;
