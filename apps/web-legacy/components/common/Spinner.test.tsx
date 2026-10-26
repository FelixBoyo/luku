import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Spinner from './Spinner';

describe('Spinner', () => {
    it('should render spinner component', () => {
        const { container } = render(<Spinner />);
        const spinner = container.querySelector('.animate-spin');
        expect(spinner).toBeInTheDocument();
    });

    it('should have correct CSS classes', () => {
        const { container } = render(<Spinner />);
        const spinner = container.querySelector('.animate-spin');
        expect(spinner).toHaveClass('rounded-full');
        expect(spinner).toHaveClass('h-8');
        expect(spinner).toHaveClass('w-8');
        expect(spinner).toHaveClass('border-b-2');
        expect(spinner).toHaveClass('border-indigo-500');
    });
});
