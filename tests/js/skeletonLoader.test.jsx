import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SkeletonLoader from '../../assets/js/SkeletonLoader';

describe('SkeletonLoader', () => {
    it('renders default number of lines (12)', () => {
        const { container } = render(<SkeletonLoader />);
        const rows = container.querySelectorAll('.skeleton-row');
        expect(rows.length).toBe(12);
    });

    it('renders specified number of lines', () => {
        const { container } = render(<SkeletonLoader lines={5} />);
        const rows = container.querySelectorAll('.skeleton-row');
        expect(rows.length).toBe(5);
    });

    it('renders short lines for every third item', () => {
        const { container } = render(<SkeletonLoader lines={4} />);
        const rows = container.querySelectorAll('.skeleton-row');
        
        expect(rows[0].querySelector('.skeleton-line-short')).not.toBeNull();
        expect(rows[1].querySelector('.skeleton-line-short')).toBeNull();
        expect(rows[2].querySelector('.skeleton-line-short')).toBeNull();
        expect(rows[3].querySelector('.skeleton-line-short')).not.toBeNull();
    });
});
