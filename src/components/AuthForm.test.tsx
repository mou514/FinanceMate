import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AuthForm } from './AuthForm';
import { BrowserRouter } from 'react-router-dom';

const renderWithRouter = (component: React.ReactNode) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('AuthForm Component', () => {
    it('should render login form by default', () => {
        renderWithRouter(
            <AuthForm mode="login" onSubmit={vi.fn()} onModeChange={vi.fn()} />
        );
        expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
        expect(screen.getByText('Sign in')).toBeInTheDocument();
    });

    it('should render signup form when mode is signup', () => {
        renderWithRouter(
            <AuthForm mode="signup" onSubmit={vi.fn()} onModeChange={vi.fn()} />
        );
        expect(screen.getByRole('heading', { name: /create an account/i })).toBeInTheDocument();
        expect(screen.getByText('Sign up')).toBeInTheDocument();
    });

    it('should show validation errors for invalid input', async () => {
        renderWithRouter(
            <AuthForm mode="login" onSubmit={vi.fn()} onModeChange={vi.fn()} />
        );

        const submitButton = screen.getByRole('button', { name: 'Sign in' });
        fireEvent.click(submitButton);

        // Expect validation errors
        await waitFor(() => {
            expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
            expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
        });
    });

    it('should call onSubmit with correct data when form is valid', async () => {
        const mockSubmit = vi.fn().mockResolvedValue({ success: true });
        renderWithRouter(
            <AuthForm mode="login" onSubmit={mockSubmit} onModeChange={vi.fn()} />
        );

        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });

        fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

        await waitFor(() => {
            expect(mockSubmit).toHaveBeenCalledWith('test@example.com', 'password123');
        });
    });

    it('should display error message when submission fails', async () => {
        const mockSubmit = vi.fn().mockResolvedValue({ success: false, error: 'Invalid credentials' });
        renderWithRouter(
            <AuthForm mode="login" onSubmit={mockSubmit} onModeChange={vi.fn()} />
        );

        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });

        fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

        await waitFor(() => {
            expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
        });
    });
});
