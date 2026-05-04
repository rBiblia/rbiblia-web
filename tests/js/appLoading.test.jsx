import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AppLoading from '../../assets/js/AppLoading';
import { IntlProvider } from 'react-intl';

const renderWithIntl = (component) => {
    return render(
        <IntlProvider locale="pl" messages={{
            preparingApplicationPleaseWait: 'Przygotowuję aplikację, proszę czekać'
        }}>
            {component}
        </IntlProvider>
    );
};

describe('AppLoading', () => {
    it('renders loading message', () => {
        renderWithIntl(<AppLoading />);
        expect(screen.getByText('Przygotowuję aplikację, proszę czekać')).toBeTruthy();
        const container = screen.getByText('Przygotowuję aplikację, proszę czekać').closest('.app-preloader');
        expect(container).toBeDefined();
    });
});
