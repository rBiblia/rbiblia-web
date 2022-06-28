import React, {Component} from 'react';

export default class BookSelector extends Component {
    constructor(props) {
        super(props);
        this.onSelect = this.onSelect.bind(this);
    }

    onSelect(event) {
        return this.props.changeSelectedBook(event.target.value)
    }

    render() {
        const {books, structure, isStructureLoaded, selectedBook} = this.props;

        if (!isStructureLoaded) {
            return (
                <select className="form-control selector-disabled">
                    <option>Lista ksiąg</option>
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
