import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IntlProvider } from 'react-intl';
import ErrorBoundary, { withErrorBoundary } from '../../assets/js/ErrorBoundary';

const Bomb = ({ shouldThrow }) => {
    if (shouldThrow) {
        throw new Error('Boom!');
    }
    return <div>Normal rendering</div>;
};

describe('ErrorBoundary', () => {
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.stubGlobal('location', { reload: vi.fn() });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('renders children when there is no error', () => {
        render(
            <ErrorBoundary>
                <Bomb shouldThrow={false} />
            </ErrorBoundary>
        );
        expect(screen.getByText('Normal rendering')).toBeInTheDocument();
    });

    it('renders default fallback UI on error', () => {
        render(
            <IntlProvider locale="en" messages={{ unexpectedErrorOccurred: 'Error', retry: 'Retry' }}>
                <ErrorBoundary>
                    <Bomb shouldThrow={true} />
                </ErrorBoundary>
            </IntlProvider>
        );
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText('Boom!')).toBeInTheDocument();
    });

    it('renders custom fallback UI if provided', () => {
        const fallback = ({ error, retry }) => (
            <div>
                <span>Custom: {error.message}</span>
                <button onClick={retry}>Custom Retry</button>
            </div>
        );

        render(
            <ErrorBoundary fallback={fallback}>
                <Bomb shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText('Custom: Boom!')).toBeInTheDocument();
    });

    it('recovers from error when retry is clicked', () => {
        const { rerender } = render(
            <IntlProvider locale="en" messages={{ unexpectedErrorOccurred: 'Error', retry: 'Retry' }}>
                <ErrorBoundary>
                    <Bomb shouldThrow={true} />
                </ErrorBoundary>
            </IntlProvider>
        );
        
        expect(screen.getByText('Boom!')).toBeInTheDocument();

        // Fix the component and retry
        rerender(
            <IntlProvider locale="en" messages={{ unexpectedErrorOccurred: 'Error', retry: 'Retry' }}>
                <ErrorBoundary>
                    <Bomb shouldThrow={false} />
                </ErrorBoundary>
            </IntlProvider>
        );
        
        fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
        expect(screen.getByText('Normal rendering')).toBeInTheDocument();
    });

    it('reloads page on retry if reloadOnRetry is true', () => {
        render(
            <IntlProvider locale="en" messages={{ unexpectedErrorOccurred: 'Error', retry: 'Retry' }}>
                <ErrorBoundary reloadOnRetry={true}>
                    <Bomb shouldThrow={true} />
                </ErrorBoundary>
            </IntlProvider>
        );
        
        fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
        expect(globalThis.location.reload).toHaveBeenCalledTimes(1);
    });

    it('withErrorBoundary HOC works', () => {
        const SafeBomb = withErrorBoundary(Bomb);
        render(
            <IntlProvider locale="en" messages={{ unexpectedErrorOccurred: 'Error', retry: 'Retry' }}>
                <SafeBomb shouldThrow={true} />
            </IntlProvider>
        );
        expect(screen.getByText('Boom!')).toBeInTheDocument();
    });
});
