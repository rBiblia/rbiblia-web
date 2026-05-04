import React from "react";
import { useIntl } from "react-intl";

function AppLoading() {
    const { formatMessage } = useIntl();
    return (
        <div className="container app-preloader">
            <div className="row">
                <div className="col-12 d-flex align-items-center justify-content-center">
                    {formatMessage({
                        id: "preparingApplicationPleaseWait",
                    })}
                </div>
            </div>
        </div>
    );
}

export default AppLoading;
