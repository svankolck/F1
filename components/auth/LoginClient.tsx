'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type AuthMode = 'login' | 'register';

interface FormErrors {
    email?: string;
    password?: string;
    confirmPassword?: string;
    username?: string;
    general?: string;
}

export default function LoginClient() {
    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams.get('redirect') || '/';
    const supabase = createClient();

    const validate = useCallback((): boolean => {
        const newErrors: FormErrors = {};

        if (!email.trim()) newErrors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email address';

        if (!password) newErrors.password = 'Password is required';
        else if (password.length < 8) newErrors.password = 'Minimum 8 characters';

        if (mode === 'register') {
            if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
            if (!username.trim()) newErrors.username = 'Username is required';
            else if (username.length < 3) newErrors.username = 'Minimum 3 characters';
            else if (!/^[a-zA-Z0-9_]+$/.test(username)) newErrors.username = 'Only letters, numbers, and underscores';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [email, password, confirmPassword, username, mode]);

    const handleLogin = useCallback(async () => {
        setLoading(true);
        setErrors({});

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            setErrors({ general: error.message === 'Invalid login credentials' ? 'Incorrect email or password' : error.message });
            setLoading(false);
            return;
        }

        router.push(redirect);
        router.refresh();
    }, [email, password, redirect, router, supabase]);

    const handleRegister = useCallback(async () => {
        setLoading(true);
        setErrors({});

        // Check if username is unique
        const { data: existingUser } = await supabase
            .from('profiles')
            .select('username')
            .eq('username', username)
            .single();

        if (existingUser) {
            setErrors({ username: 'Username is already taken' });
            setLoading(false);
            return;
        }

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName,
                    username,
                },
            },
        });

        if (error) {
            setErrors({ general: error.message });
            setLoading(false);
            return;
        }

        setSuccessMessage('Confirmation email sent! Check your inbox to activate your account.');
        setLoading(false);
    }, [email, password, firstName, lastName, username, supabase]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        if (mode === 'login') {
            await handleLogin();
        } else {
            await handleRegister();
        }
    }, [mode, validate, handleLogin, handleRegister]);

    if (successMessage) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
                <div className="glass-card p-8 max-w-md w-full text-center border border-green-500/30">
                    <span className="material-icons text-5xl text-green-400 mb-4 block">check_circle</span>
                    <h2 className="text-xl font-bold mb-2">Registration Successful</h2>
                    <p className="text-f1-text-secondary text-sm">{successMessage}</p>
                    <button
                        onClick={() => { setSuccessMessage(''); setMode('login'); }}
                        className="mt-6 px-6 py-2 bg-f1-red text-white font-bold uppercase text-xs tracking-widest rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="glass-card p-8 max-w-md w-full border border-f1-border">
                <h1 className="text-2xl font-bold uppercase tracking-tight text-center mb-1">
                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                </h1>
                <p className="text-f1-text-muted text-xs text-center mb-6">
                    {mode === 'login' ? 'Sign in to join the prediction game' : 'Create an account to get started'}
                </p>

                {errors.general && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-4">
                        <p className="text-red-400 text-xs">{errors.general}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {mode === 'register' && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-mono uppercase tracking-widest text-f1-text-muted mb-1 block">First Name</label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-white/5 border border-f1-border rounded-lg text-sm text-white placeholder:text-f1-text-muted focus:border-f1-red focus:outline-none transition-colors"
                                    placeholder="Max"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-mono uppercase tracking-widest text-f1-text-muted mb-1 block">Last Name</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-white/5 border border-f1-border rounded-lg text-sm text-white placeholder:text-f1-text-muted focus:border-f1-red focus:outline-none transition-colors"
                                    placeholder="Verstappen"
                                />
                            </div>
                        </div>
                    )}

                    {mode === 'register' && (
                        <div>
                            <label className="text-[10px] font-mono uppercase tracking-widest text-f1-text-muted mb-1 block">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className={`w-full px-3 py-2.5 bg-white/5 border rounded-lg text-sm text-white placeholder:text-f1-text-muted focus:outline-none transition-colors ${errors.username ? 'border-red-500 focus:border-red-500' : 'border-f1-border focus:border-f1-red'}`}
                                placeholder="maxv33"
                            />
                            {errors.username && <p className="text-red-400 text-[10px] mt-1">{errors.username}</p>}
                        </div>
                    )}

                    <div>
                        <label className="text-[10px] font-mono uppercase tracking-widest text-f1-text-muted mb-1 block">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={`w-full px-3 py-2.5 bg-white/5 border rounded-lg text-sm text-white placeholder:text-f1-text-muted focus:outline-none transition-colors ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-f1-border focus:border-f1-red'}`}
                            placeholder="max@redbull.com"
                        />
                        {errors.email && <p className="text-red-400 text-[10px] mt-1">{errors.email}</p>}
                    </div>

                    <div>
                        <label className="text-[10px] font-mono uppercase tracking-widest text-f1-text-muted mb-1 block">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`w-full px-3 py-2.5 bg-white/5 border rounded-lg text-sm text-white placeholder:text-f1-text-muted focus:outline-none transition-colors ${errors.password ? 'border-red-500 focus:border-red-500' : 'border-f1-border focus:border-f1-red'}`}
                            placeholder="Minimum 8 characters"
                        />
                        {errors.password && <p className="text-red-400 text-[10px] mt-1">{errors.password}</p>}
                    </div>

                    {mode === 'register' && (
                        <div>
                            <label className="text-[10px] font-mono uppercase tracking-widest text-f1-text-muted mb-1 block">Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`w-full px-3 py-2.5 bg-white/5 border rounded-lg text-sm text-white placeholder:text-f1-text-muted focus:outline-none transition-colors ${errors.confirmPassword ? 'border-red-500 focus:border-red-500' : 'border-f1-border focus:border-f1-red'}`}
                                placeholder="Repeat password"
                            />
                            {errors.confirmPassword && <p className="text-red-400 text-[10px] mt-1">{errors.confirmPassword}</p>}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-f1-red text-white font-bold uppercase text-xs tracking-widest rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="animate-spin material-icons text-sm">autorenew</span>
                                Loading...
                            </span>
                        ) : mode === 'login' ? 'Sign In' : 'Register'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErrors({}); setSuccessMessage(''); }}
                        className="text-f1-text-secondary text-xs hover:text-white transition-colors"
                    >
                        {mode === 'login' ? "Don't have an account? Register here" : 'Already have an account? Sign in here'}
                    </button>
                </div>
            </div>
        </div>
    );
}
