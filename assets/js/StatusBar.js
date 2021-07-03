import React, {Component} from "react";

export default class StatusBar extends Component {
    render() {
        return (
            <footer className="row">
                <div className="col-9">Dostępnych tłumaczeń: {this.props.translations.length}</div>
                <div className="col-3 text-end">
                    <a href="/docs/changelog.txt" target="_blank" title="Zobacz dziennik zmian">changelog.txt</a>
                </div>
            </footer>
        );
    }
}
