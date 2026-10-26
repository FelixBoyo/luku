import React, { useState, useEffect } from 'react';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { signUpUser, signInUser } from '../store/slices/authSlice';
import Button from './common/Button';
import LukuLogo from './icons/LukuLogo';
import Input from './common/Input';
import Card from './common/Card';

const BusinessAuth: React.FC = () => {
    const dispatch = useAppDispatch();
    const { loading, error } = useAppSelector((state) => state.auth);

    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [localError, setLocalError] = useState<string | null>(null);

    useEffect(() => {
        setLocalError(error);
    }, [error]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);
        setMessage(null);

        if (isSignUp) {
            const resultAction = await dispatch(
                signUpUser({ email, password })
            );
            if (signUpUser.fulfilled.match(resultAction)) {
                setMessage(
                    'Success! Please check your email for a confirmation link.'
                );
            }
        } else {
            dispatch(signInUser({ email, password }));
        }
    };

    if (!isSupabaseConfigured) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col justify-center items-center p-4">
                <div className="max-w-lg w-full mx-auto text-center bg-white p-8 rounded-lg shadow-md border border-red-200">
                    <div className="flex justify-center items-center space-x-3 mb-6">
                        <LukuLogo className="h-10 w-10" />
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                            LUKU Business
                        </h1>
                    </div>
                    <h2 className="text-2xl font-bold text-red-700 mb-4">
                        Backend Not Configured
                    </h2>
                    <p className="text-gray-600 mb-4">
                        The authentication service (Supabase) is not set up. To
                        enable login and registration, you need to add your
                        Supabase credentials.
                    </p>
                    <div className="text-left bg-gray-50 p-4 rounded-md space-y-3">
                        <p className="text-sm text-gray-700">
                            <strong>Option 1 (Recommended):</strong> Open the
                            file <code>services/supabaseClient.ts</code> and
                            replace the placeholder values for{' '}
                            <code>supabaseUrl</code> and{' '}
                            <code>supabaseAnonKey</code> with your project's
                            credentials from your Supabase dashboard.
                        </p>
                        <p className="text-sm text-gray-700">
                            <strong>Option 2 (For Development):</strong> To
                            bypass login for testing, open{' '}
                            <code>services/supabaseClient.ts</code> and set the{' '}
                            <code>ENABLE_DEV_BYPASS</code> flag to{' '}
                            <code>true</code>.
                        </p>
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
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                            LUKU Business
                        </h1>
                        <p className="text-base text-gray-600 mt-2 font-light">
                            Sell with confidence on LUKU – reach buyers ready to purchase.
                        </p>
                        <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                            Manage your products, orders, and performance from a single dashboard.
                        </p>
                    </div>
                </div>

                <Card className="p-8">
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
                        {isSignUp ? 'Join LUKU Business' : 'Welcome Back'}
                    </h2>
                    <p className="text-center text-gray-600 mb-2">
                        {isSignUp
                            ? 'Already have a business account?'
                            : 'New to LUKU Business?'}{' '}
                        <button
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setLocalError(null);
                                setMessage(null);
                            }}
                            className="font-medium text-indigo-600 hover:text-indigo-500"
                        >
                            {isSignUp ? 'Sign In' : 'Create a business account'}
                        </button>
                    </p>
                    <p className="text-center text-gray-500 text-sm mb-6">
                        Looking for your personal style account?{' '}
                        <a
                            href="/"
                            className="font-medium text-indigo-600 hover:text-indigo-500"
                        >
                            Go to LUKU
                        </a>
                    </p>

                    <form onSubmit={handleAuth} className="space-y-6">
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            label="Business email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <Input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            label="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />

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
                                className="w-full justify-center"
                            >
                                {isSignUp ? 'Sign Up' : 'Sign In'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default BusinessAuth;

