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
        const {books, structure, isStructureLoaded, selectedBook} = this.props,
              options = [];

        if (isStructureLoaded) {
            // TODO: do we really need to repack those values, no other option to do it in more elegant way?
            Object.keys(structure).forEach(bookId => {
                options.push(bookId);
            });

            return (
                <select className="form-control" onChange={this.onSelect} value={selectedBook}>
                    {options.map((bookId) => (
                        <option value={bookId} key={bookId}>{books[bookId].name}</option>
                    ))}
                </select>
            );
        } else
            return (
                <select className="form-control selector-disabled">
                    <option>Lista ksiąg</option>
                </select>
            );
    }
}
