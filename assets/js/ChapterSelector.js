import React, {Component} from "react";

export default class ChapterSelector extends Component {
    render() {
        const {chapters, isStructureLoaded, onChapterSelectorChange} = this.props,
              options = [];

        if (isStructureLoaded) {
            // TODO: do we really need to repack those values, no other option to do it in more elegant way?
            chapters.forEach(chapterId => {
                options.push(chapterId);
            });

            return (
                <select className="form-control" onChange={(event) => onChapterSelectorChange(event)}>
                    {options.map((chapterId) => {
                        return (<option value={chapterId} key={chapterId}>{chapterId}</option>);
                    })}
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
