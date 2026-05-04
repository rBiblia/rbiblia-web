import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IntlProvider } from 'react-intl';
import AppError, { ErrorToast, ErrorBoundary as ReactErrorBoundary } from '../../assets/js/AppError';

describe('AppError', () => {
    const renderWithIntl = (component) => render(
        <IntlProvider locale="en" messages={{ unexpectedErrorOccurred: 'Unexpected', retry: 'Retry' }}>
            {component}
        </IntlProvider>
    );

    it('renders full type by default', () => {
        renderWithIntl(<AppError message="Failed to load" />);
        expect(screen.getByText('Unexpected')).toBeInTheDocument();
        expect(screen.getByText('Failed to load')).toBeInTheDocument();
    });

    it('renders inline type', () => {
        renderWithIntl(<AppError message="Failed inline" type="inline" />);
        expect(screen.getByText('Failed inline')).toBeInTheDocument();
        expect(screen.queryByText('Unexpected')).not.toBeInTheDocument();
    });

    it('calls onRetry when retry button is clicked', () => {
        const onRetry = vi.fn();
        renderWithIntl(<AppError message="Fail" onRetry={onRetry} />);
        
        fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
        expect(onRetry).toHaveBeenCalledTimes(1);
    });
});

describe('ErrorToast', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('renders message and calls onClose on button click', () => {
        const onClose = vi.fn();
        render(<ErrorToast message="Toast Error" onClose={onClose} autoHide={0} />);
        
        expect(screen.getByText('Toast Error')).toBeInTheDocument();
        
        fireEvent.click(screen.getByRole('button'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('auto hides after timeout', () => {
        const onClose = vi.fn();
        render(<ErrorToast message="Toast Error" onClose={onClose} autoHide={3000} />);
        
        act(() => {
            vi.advanceTimersByTime(3000);
        });
        
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});

describe('ReactErrorBoundary', () => {
    beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}));
    afterEach(() => vi.restoreAllMocks());

    const Bomb = () => { throw new Error('React Error'); };

    it('catches error and renders AppError', () => {
        render(
            <IntlProvider locale="en" messages={{ unexpectedErrorOccurred: 'Unexpected', retry: 'Retry' }}>
                <ReactErrorBoundary>
                    <Bomb />
                </ReactErrorBoundary>
            </IntlProvider>
        );

        expect(screen.getByText('React Error')).toBeInTheDocument();
    });
});
