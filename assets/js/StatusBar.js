import React from "react";
import { useIntl } from "react-intl";
import LanguageSelector from "./LanguageSelector";

const StatusBar = ({ translations, setLocaleAndUpdateHistory }) => {
    const { formatMessage } = useIntl();

    return (
        <footer>
            <div className="container">
                <div className="row">
                    <div className="col-4">
                        <LanguageSelector
                            setLocaleAndUpdateHistory={
                                setLocaleAndUpdateHistory
                            }
                        />
                    </div>
                    <div className="col-4 text-center">
                        <div className="d-none d-sm-inline">
                            {formatMessage({
                                id: "availableTranslationsCounter",
                            })}{" "}
                        </div>
                        {translations.length}
                    </div>
                    <div className="col-4 text-end">
                        <a
                            href="/assets/changelog.txt"
                            target="_blank"
                            title={formatMessage({ id: "changelogLink" })}
                        >
                            changelog.txt
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default StatusBar;
