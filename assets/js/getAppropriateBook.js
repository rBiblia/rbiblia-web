import { DEFAULT_BOOK } from "../consts";

const getAppropriateBook = (structure, selectedBook) => {
    if (structure[selectedBook]) {
        return selectedBook;
    }

    if (structure[DEFAULT_BOOK]) {
        return DEFAULT_BOOK;
    }

    // otherwise, get first book
    return Object.keys(structure)[0];
};

export default getAppropriateBook;
