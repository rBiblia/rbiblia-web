import React from "react";
import { useIntl } from "react-intl";
import PropTypes from "prop-types";

/**
 * Error display component with retry functionality
 */
function AppError({ message, onRetry, type = "full" }) {
    const { formatMessage } = useIntl();

    // Full page error (for critical failures)
    if (type === "full") {
        return (
            <div className="container app-preloader">
                <div className="row">
                    <div className="col-12 d-flex flex-column align-items-center justify-content-center">
                        <div className="app-error-icon">
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                            >
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                        </div>
                        <p className="app-error-message">
                            {formatMessage({ id: "unexpectedErrorOccurred" })}
                        </p>
                        <p className="app-error-details">{message}</p>
                        {onRetry && (
                            <button
                                className="app-error-retry"
                                onClick={onRetry}
                            >
                                {formatMessage({ id: "retry" })}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Inline error (for partial failures)
    return (
        <div className="inline-error">
            <div className="inline-error-content">
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>{message}</span>
            </div>
            {onRetry && (
                <button className="inline-error-retry" onClick={onRetry}>
                    {formatMessage({ id: "retry" })}
                </button>
            )}
        </div>
    );
}

/**
 * Toast notification for non-blocking errors
 */
function ErrorToast({ message, onClose, autoHide = 5000 }) {
    React.useEffect(() => {
        if (autoHide) {
            const timer = setTimeout(() => {
                onClose?.();
            }, autoHide);
            return () => clearTimeout(timer);
        }
    }, [autoHide, onClose]);

    return (
        <div className="error-toast">
            <div className="error-toast-content">
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>{message}</span>
            </div>
            <button className="error-toast-close" onClick={onClose}>
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    );
}

/**
 * Error boundary to catch React errors
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("React error boundary caught:", error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <AppError
                    message={this.state.error?.message || "Unknown error"}
                    onRetry={this.handleRetry}
                />
            );
        }

        return this.props.children;
    }
}

AppError.propTypes = {
    message: PropTypes.string,
    onRetry: PropTypes.func,
    type: PropTypes.oneOf(["full", "inline"]),
};

ErrorToast.propTypes = {
    message: PropTypes.string.isRequired,
    onClose: PropTypes.func,
    autoHide: PropTypes.number,
};

ErrorBoundary.propTypes = {
    children: PropTypes.node.isRequired,
};

export default AppError;
export { AppError, ErrorToast, ErrorBoundary };
