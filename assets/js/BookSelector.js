import React, {Component} from 'react';

export default class BookSelector extends Component {
    render() {
        const {books, structure, isStructureLoaded, onBookSelectorChange} = this.props,
              options = [];

        if (isStructureLoaded) {
            // TODO: do we really need to repack those values, no other option to do it in more elegant way?
            Object.keys(structure).forEach(bookId => {
                options.push(bookId);
            });

            return (
                <select className="form-control" onChange={(event) => onBookSelectorChange(event)}>
                    {options.map((bookId) => {
                        return (<option value={bookId} key={bookId}>{books[bookId].name}</option>);
                    })}
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
