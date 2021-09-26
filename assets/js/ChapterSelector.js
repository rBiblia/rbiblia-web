import React, {Component} from "react";

export default class ChapterSelector extends Component {

    constructor(props) {
        super(props);
        this.onSelect = this.onSelect.bind(this);
    }

    onSelect(event) {
        return this.props.changeSelectedChapter(event.target.value)
    }

    render() {
        const {chapters, isStructureLoaded, selectedChapter} = this.props,
              options = [];

        if (isStructureLoaded && chapters && chapters.length) {
            // TODO: do we really need to repack those values, no other option to do it in more elegant way?
            chapters.forEach(chapterId => {
                options.push(chapterId);
            });

            return (
                <select className="form-control" onChange={this.onSelect} value={selectedChapter}>
                    {options.map((chapterId) => (
                        <option value={chapterId} key={chapterId}>{chapterId}</option>
                    ))}
                </select>
            );
        } else
            return (
                <select className="form-control selector-disabled">
                    <option>Lista rozdziałów</option>
                </select>
            );

    }
}
