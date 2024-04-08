import React from "react";
import { useIntl } from "react-intl";

function AppError({ message }) {
    const { formatMessage } = useIntl();
    return (
        <div className="container app-preloader">
            <div className="row">
                <div className="col-12 d-flex align-items-center justify-content-center">
                    {formatMessage({ id: "unexpectedErrorOccurred" })} {message}
                </div>
            </div>
        </div>
    );
}

export default AppError;
