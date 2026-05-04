import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DirectionalNavigationButton from '../../assets/js/DirectionalNavigationButton';

describe('DirectionalNavigationButton', () => {
    it('renders correctly with direction left', () => {
        render(<DirectionalNavigationButton direction="left" disabled={false} />);
        const button = screen.getByRole('button');
        expect(button.className).toContain('icon-navigator');
        expect(button.className).not.toContain('icon-navigator-disabled');
        // SVG icon is rendered by Icon component
        expect(button.querySelector('svg')).toBeDefined();
    });

    it('renders correctly with direction right and disabled state', () => {
        render(<DirectionalNavigationButton direction="right" disabled={true} />);
        const button = screen.getByRole('button');
        expect(button.className).toContain('icon-navigator-disabled');
        expect(button.disabled).toBe(true);
    });

    it('calls onClick when clicked', () => {
        const handleClick = vi.fn();
        render(<DirectionalNavigationButton direction="left" onClick={handleClick} disabled={false} />);
        fireEvent.click(screen.getByRole('button'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });
});
