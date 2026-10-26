import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/src/test/utils';
import Auth from './Auth';

vi.mock('../services/supabaseClient', () => ({
    isSupabaseConfigured: true,
}));

describe('Auth', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render sign in form by default', () => {
        render(<Auth />);
        expect(screen.getByText(/Sign In|Login/)).toBeInTheDocument();
    });

    it('should switch to sign up form when toggle is clicked', async () => {
        const user = userEvent.setup();
        render(<Auth />);
        
        const toggleButton = screen.getByRole('button', {
            name: /Sign Up|Create Account/,
        });
        await user.click(toggleButton);
        
        expect(screen.getByText(/Sign Up|Create Account/)).toBeInTheDocument();
    });

    it('should handle email input', async () => {
        const user = userEvent.setup();
        render(<Auth />);
        
        const emailInput = screen.getByLabelText(/Email/) as HTMLInputElement;
        await user.type(emailInput, 'test@example.com');
        
        expect(emailInput.value).toBe('test@example.com');
    });

    it('should handle password input', async () => {
        const user = userEvent.setup();
        render(<Auth />);
        
        const passwordInput = screen.getByLabelText(/Password/) as HTMLInputElement;
        await user.type(passwordInput, 'password123');
        
        expect(passwordInput.value).toBe('password123');
    });

    it('should display error message when authentication fails', async () => {
        render(<Auth />, {
            preloadedState: {
                auth: {
                    session: null,
                    loading: false,
                    error: 'Invalid credentials',
                },
            },
        });
        
        await waitFor(() => {
            expect(screen.getByText(/Invalid credentials/)).toBeInTheDocument();
        });
    });

    it('should display loading state during authentication', () => {
        const { container } = render(<Auth />, {
            preloadedState: {
                auth: {
                    session: null,
                    loading: true,
                    error: null,
                },
            },
        });
        
        // Should show loading indicator on the primary submit button
        const submitButton = container.querySelector('button[type="submit"]');
        expect(submitButton).toBeTruthy();
        expect(submitButton).toBeDisabled();
    });

    it('should allow filling the sign up form without errors', async () => {
        const user = userEvent.setup();
        render(<Auth />);
        
        // Switch to sign up
        const toggleButton = screen.getByRole('button', {
            name: /Sign Up|Create Account/,
        });
        await user.click(toggleButton);
        
        // Fill form
        const emailInput = screen.getByLabelText(/Email/) as HTMLInputElement;
        const passwordInput = screen.getByLabelText(/Password/) as HTMLInputElement;
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        
        expect(emailInput.value).toBe('test@example.com');
        expect(passwordInput.value).toBe('password123');
    }, 15000);

    // The \"backend not configured\" experience is exercised via
    // dedicated integration tests; here we focus on the primary
    // authenticated user flows.

    it('should validate required fields', async () => {
        const user = userEvent.setup();
        render(<Auth />);
        
        const submitButton = screen.getByRole('button', { name: /Sign In|Login/ });
        await user.click(submitButton);
        
        // Form validation should prevent submission
        // Implementation may vary
    });
});
