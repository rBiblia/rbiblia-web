import React from "react";
import { AppError } from "./AppError";

/**
 * Error Boundary component for catching JavaScript errors in React component tree
 * Provides a fallback UI and error recovery mechanism
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error, errorInfo) {
        // Log error details for debugging
        console.error("ErrorBoundary caught an error:", error);
        console.error("Error info:", errorInfo);

        this.setState({ errorInfo });

        // You could also send the error to a logging service here
        // logErrorToService(error, errorInfo);
    }

    handleRetry = () => {
        // Reset error state and attempt to recover
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });

        // Optionally reload the page for complete reset
        if (this.props.reloadOnRetry) {
            window.location.reload();
        }
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI if provided
            if (this.props.fallback) {
                return this.props.fallback({
                    error: this.state.error,
                    retry: this.handleRetry,
                });
            }

            // Default fallback UI using AppError component
            return (
                <AppError
                    message={
                        this.state.error?.message ||
                        "An unexpected error occurred"
                    }
                    onRetry={this.handleRetry}
                />
            );
        }

        return this.props.children;
    }
}

/**
 * Higher-order component version of ErrorBoundary
 * @param {React.Component} WrappedComponent - Component to wrap
 * @param {Object} options - ErrorBoundary options
 * @returns {React.Component} Wrapped component with error boundary
 */
export const withErrorBoundary = (WrappedComponent, options = {}) => {
    const WithErrorBoundary = (props) => (
        <ErrorBoundary {...options}>
            <WrappedComponent {...props} />
        </ErrorBoundary>
    );

    WithErrorBoundary.displayName = `WithErrorBoundary(${
        WrappedComponent.displayName || WrappedComponent.name || "Component"
    })`;

    return WithErrorBoundary;
};

export default ErrorBoundary;
