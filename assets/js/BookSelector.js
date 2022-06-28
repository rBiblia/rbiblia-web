import React, {Component} from 'react';
import { injectIntl } from 'react-intl';

class BookSelector extends Component {
    constructor(props) {
        super(props);
        this.onSelect = this.onSelect.bind(this);
    }

    onSelect(event) {
        return this.props.changeSelectedBook(event.target.value)
    }

    render() {
        const {books, structure, isStructureLoaded, selectedBook, intl: {formatMessage}} = this.props;

        if (!isStructureLoaded) {
            return (
                <select className="form-control selector-disabled">
                    <option>{formatMessage({id:'bookList'})}</option>
                </select>
            );
        }

        return (
            <select className="form-control" onChange={this.onSelect} value={selectedBook}>
                {Object.keys(structure).map(bookId => (
                    <option value={bookId} key={bookId}>{books[bookId].name}</option>
                ))}
            </select>
        );
    }
}

export default injectIntl(BookSelector);
