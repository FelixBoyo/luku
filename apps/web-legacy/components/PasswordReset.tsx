import React, { useState, useEffect } from 'react';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { resetPassword } from '../store/slices/authSlice';
import Button from './common/Button';
import LukuLogo from './icons/LukuLogo';

const PasswordReset: React.FC = () => {
    const dispatch = useAppDispatch();
    const { loading, error } = useAppSelector((state) => state.auth);

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [hasToken, setHasToken] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const calculatePasswordStrength = (pwd: string): { strength: 'weak' | 'medium' | 'strong'; score: number; feedback: string[] } => {
        let score = 0;
        const feedback: string[] = [];

        if (pwd.length >= 8) score += 1;
        else feedback.push('At least 8 characters');
        
        if (pwd.length >= 12) score += 1;
        
        if (/[a-z]/.test(pwd)) score += 1;
        else feedback.push('Lowercase letter');
        
        if (/[A-Z]/.test(pwd)) score += 1;
        else feedback.push('Uppercase letter');
        
        if (/[0-9]/.test(pwd)) score += 1;
        else feedback.push('Number');
        
        if (/[^a-zA-Z0-9]/.test(pwd)) score += 1;
        else feedback.push('Special character');

        let strength: 'weak' | 'medium' | 'strong' = 'weak';
        if (score >= 5) strength = 'strong';
        else if (score >= 3) strength = 'medium';

        return { strength, score, feedback };
    };

    const passwordStrength = password ? calculatePasswordStrength(password) : null;

    useEffect(() => {
        // Check if we have a recovery token in the URL hash
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');

        if (type === 'recovery' && accessToken) {
            setHasToken(true);
            // Clean up the URL
            window.history.replaceState({}, '', '/reset-password');
        } else {
            setLocalError('Invalid or missing password reset token. Please request a new password reset link.');
        }
    }, []);

    useEffect(() => {
        setLocalError(error);
    }, [error]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);
        setMessage(null);

        // Validate passwords match
        if (password !== confirmPassword) {
            setLocalError('Passwords do not match.');
            return;
        }

        // Validate password strength
        if (!passwordStrength || passwordStrength.strength === 'weak') {
            setLocalError('Password is too weak. Please use a stronger password with at least 8 characters, including uppercase, lowercase, numbers, and special characters.');
            return;
        }

        if (password.length < 8) {
            setLocalError('Password must be at least 8 characters long.');
            return;
        }

        const resultAction = await dispatch(resetPassword({ newPassword: password }));
        
        if (resetPassword.fulfilled.match(resultAction)) {
            setMessage('Password reset successfully! Redirecting...');
            // Redirect to home after a short delay
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        }
    };

    if (!isSupabaseConfigured) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col justify-center items-center p-4">
                <div className="max-w-lg w-full mx-auto text-center bg-white p-8 rounded-lg shadow-md border border-red-200">
                    <div className="flex justify-center items-center space-x-3 mb-6">
                        <LukuLogo className="h-10 w-10" />
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                            LUKU
                        </h1>
                    </div>
                    <h2 className="text-2xl font-bold text-red-700 mb-4">
                        Backend Not Configured
                    </h2>
                    <p className="text-gray-600 mb-4">
                        The authentication service (Supabase) is not set up. Password reset cannot be completed.
                    </p>
                </div>
            </div>
        );
    }

    if (!hasToken) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col justify-center items-center p-4">
                <div className="max-w-md w-full mx-auto">
                    <div className="flex flex-col justify-center items-center space-y-4 mb-8">
                        <LukuLogo className="h-16 w-16" />
                        <div className="text-center">
                            <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                                LUKU
                            </h1>
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
                        <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
                            Invalid Reset Link
                        </h2>
                        {localError && (
                            <p className="text-sm text-red-600 text-center mb-4">
                                {localError}
                            </p>
                        )}
                        <p className="text-center text-gray-600 mb-6">
                            Please request a new password reset link from the login page.
                        </p>
                        <Button
                            onClick={() => window.location.href = '/'}
                            className="w-full justify-center"
                        >
                            Go to Login
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col justify-center items-center p-4">
            <div className="max-w-md w-full mx-auto">
                {/* Brand Header */}
                <div className="flex flex-col justify-center items-center space-y-4 mb-8">
                    <LukuLogo className="h-16 w-16" />
                    <div className="text-center">
                        <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                            LUKU
                        </h1>
                        <p className="text-base text-gray-600 mt-2 font-light">
                            Reset Your Password
                        </p>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
                        Create New Password
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700"
                            >
                                New Password
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="Enter your new password"
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="confirmPassword"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Confirm Password
                            </label>
                            <div className="mt-1 relative">
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        setLocalError(null);
                                    }}
                                    className={`appearance-none block w-full px-3 py-2 pr-10 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                                        confirmPassword && password !== confirmPassword
                                            ? 'border-red-300'
                                            : confirmPassword && password === confirmPassword
                                            ? 'border-green-300'
                                            : 'border-gray-300'
                                    }`}
                                    placeholder="Confirm your new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showConfirmPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {confirmPassword && password !== confirmPassword && (
                                <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
                            )}
                            {confirmPassword && password === confirmPassword && password.length > 0 && (
                                <p className="mt-1 text-sm text-green-600">✓ Passwords match</p>
                            )}
                        </div>

                        {localError && (
                            <p className="text-sm text-red-600 text-center">
                                {localError}
                            </p>
                        )}
                        {message && (
                            <p className="text-sm text-green-600 text-center">
                                {message}
                            </p>
                        )}

                        <div>
                            <Button
                                type="submit"
                                isLoading={loading}
                                disabled={!password || !confirmPassword || password !== confirmPassword || (passwordStrength?.strength === 'weak')}
                                className="w-full justify-center bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                            >
                                {loading ? 'Resetting Password...' : 'Reset Password'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PasswordReset;
