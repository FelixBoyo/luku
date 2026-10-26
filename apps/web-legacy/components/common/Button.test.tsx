// Import the mock first to set up environment
import '@/src/test/mocks/supabaseClient';

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/src/test/utils';
import userEvent from '@testing-library/user-event';
import Button from './Button';

describe('Button Component', () => {
    it('renders button with children', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('applies primary variant by default', () => {
        render(<Button>Primary Button</Button>);
        const button = screen.getByRole('button');
        // Check for primary variant classes (may include gradient)
        expect(button.className).toMatch(/indigo-600|from-indigo-600/);
    });

    it('applies secondary variant when specified', () => {
        render(<Button variant="secondary">Secondary Button</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('bg-indigo-100');
    });

    it('applies ghost variant when specified', () => {
        render(<Button variant="ghost">Ghost Button</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('bg-transparent');
    });

    it('applies small size when specified', () => {
        render(<Button size="sm">Small Button</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('px-3', 'py-1.5', 'text-xs');
    });

    it('applies medium size by default', () => {
        render(<Button>Medium Button</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('px-4', 'py-2', 'text-sm');
    });

    it('applies large size when specified', () => {
        render(<Button size="lg">Large Button</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('px-6', 'py-3', 'text-base');
    });

    it('calls onClick handler when clicked', async () => {
        const handleClick = vi.fn();
        const user = userEvent.setup();
        render(<Button onClick={handleClick}>Click me</Button>);
        
        await user.click(screen.getByRole('button'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('disables button when isLoading is true', () => {
        render(<Button isLoading>Loading Button</Button>);
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
    });

    it('shows loading spinner when isLoading is true', () => {
        render(<Button isLoading>Loading Button</Button>);
        const button = screen.getByRole('button');
        const spinner = button.querySelector('svg.animate-spin');
        expect(spinner).toBeInTheDocument();
    });

    it('disables button when disabled prop is true', () => {
        render(<Button disabled>Disabled Button</Button>);
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
    });

    it('applies custom className', () => {
        render(<Button className="custom-class">Custom Button</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('custom-class');
    });

    it('passes through other HTML button attributes', () => {
        render(<Button type="submit" aria-label="Submit form">Submit</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('type', 'submit');
        expect(button).toHaveAttribute('aria-label', 'Submit form');
    });
});
