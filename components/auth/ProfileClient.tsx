'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import AvatarUpload from './AvatarUpload';
import DefaultDriverSettings from '@/components/game/DefaultDriverSettings';
import type { User } from '@supabase/supabase-js';

interface Profile {
    id: string;
    username: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    is_active: boolean;
}

import { GameDriver } from '@/lib/types/f1';

interface ProfileClientProps {
    user: User;
    initialProfile: Profile | null;
    drivers: GameDriver[];
}

export default function ProfileClient({ user, initialProfile, drivers }: ProfileClientProps) {
    const [profile, setProfile] = useState<Profile | null>(initialProfile);
    const [firstName, setFirstName] = useState(initialProfile?.first_name || '');
    const [lastName, setLastName] = useState(initialProfile?.last_name || '');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const router = useRouter();
    const { signOut, refreshProfile } = useAuth();
    const supabase = createClient();

    const handleSaveProfile = useCallback(async () => {
        if (!profile) return;
        setSaving(true);
        setSaved(false);

        const { error } = await supabase
            .from('profiles')
            .update({ first_name: firstName, last_name: lastName })
            .eq('id', profile.id);

        if (!error) {
            setSaved(true);
            await refreshProfile();
            setTimeout(() => setSaved(false), 2000);
        }
        setSaving(false);
    }, [profile, firstName, lastName, supabase, refreshProfile]);

    const handleChangePassword = useCallback(async () => {
        setPasswordMessage('');
        if (newPassword.length < 8) {
            setPasswordMessage('Minimaal 8 tekens');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordMessage('Wachtwoorden komen niet overeen');
            return;
        }

        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
            setPasswordMessage(error.message);
        } else {
            setPasswordMessage('Wachtwoord gewijzigd!');
            setNewPassword('');
            setConfirmPassword('');
            setShowPasswordSection(false);
        }
    }, [newPassword, confirmPassword, supabase]);

    const handleAvatarUpdate = useCallback((url: string) => {
        setProfile((prev) => prev ? { ...prev, avatar_url: url } : prev);
        refreshProfile();
    }, [refreshProfile]);

    const handleSignOut = useCallback(async () => {
        await signOut();
        router.push('/');
        router.refresh();
    }, [signOut, router]);

    const avatarUrl = profile?.avatar_url;
    const initials = `${(firstName || '?')[0]}${(lastName || '?')[0]}`.toUpperCase();

    return (
        <div className="flex flex-col items-center gap-6 max-w-lg mx-auto w-full">
            <h1 className="text-2xl font-bold uppercase tracking-tight">Profile</h1>

            {/* Avatar */}
            <div className="relative group">
                {avatarUrl ? (
                    <Image
                        src={avatarUrl}
                        alt="Avatar"
                        width={96}
                        height={96}
                        className="w-24 h-24 rounded-full object-cover border-2 border-f1-border"
                        unoptimized
                    />
                ) : (
                    <div className="w-24 h-24 rounded-full bg-f1-red/20 border-2 border-f1-border flex items-center justify-center">
                        <span className="text-2xl font-bold text-f1-red">{initials}</span>
                    </div>
                )}
                <AvatarUpload userId={user.id} onUpload={handleAvatarUpdate} />
            </div>

            {/* Profile Card */}
            <div className="glass-card p-6 w-full border border-f1-border">
                <div className="flex flex-col gap-4">
                    {/* Username (read-only) */}
                    <div>
                        <label className="text-[10px] font-mono uppercase tracking-widest text-f1-text-muted mb-1 block">Username</label>
                        <div className="px-3 py-2.5 bg-white/5 border border-f1-border rounded-lg text-sm text-f1-text-muted flex items-center gap-2">
                            <span className="material-icons text-sm">lock</span>
                            {profile?.username || '—'}
                        </div>
                    </div>

                    {/* Email (read-only) */}
                    <div>
                        <label className="text-[10px] font-mono uppercase tracking-widest text-f1-text-muted mb-1 block">Email</label>
                        <div className="px-3 py-2.5 bg-white/5 border border-f1-border rounded-lg text-sm text-f1-text-muted">
                            {user.email}
                        </div>
                    </div>

                    {/* Names (editable) */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-mono uppercase tracking-widest text-f1-text-muted mb-1 block">First Name</label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full px-3 py-2.5 bg-white/5 border border-f1-border rounded-lg text-sm text-white focus:border-f1-red focus:outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-mono uppercase tracking-widest text-f1-text-muted mb-1 block">Last Name</label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full px-3 py-2.5 bg-white/5 border border-f1-border rounded-lg text-sm text-white focus:border-f1-red focus:outline-none transition-colors"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="w-full py-2.5 bg-f1-red text-white font-bold uppercase text-xs tracking-widest rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Profile'}
                    </button>
                </div>
            </div>

            {/* Password Section */}
            <div className="glass-card p-6 w-full border border-f1-border">
                <button
                    onClick={() => setShowPasswordSection(!showPasswordSection)}
                    className="flex items-center justify-between w-full text-sm font-bold uppercase tracking-wider text-f1-text-secondary hover:text-white transition-colors"
                >
                    Change Password
                    <span className="material-icons text-sm">{showPasswordSection ? 'expand_less' : 'expand_more'}</span>
                </button>

                {showPasswordSection && (
                    <div className="flex flex-col gap-3 mt-4">
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Nieuw wachtwoord (min. 8 tekens)"
                            className="w-full px-3 py-2.5 bg-white/5 border border-f1-border rounded-lg text-sm text-white placeholder:text-f1-text-muted focus:border-f1-red focus:outline-none transition-colors"
                        />
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm password"
                            className="w-full px-3 py-2.5 bg-white/5 border border-f1-border rounded-lg text-sm text-white placeholder:text-f1-text-muted focus:border-f1-red focus:outline-none transition-colors"
                        />
                        {passwordMessage && (
                            <p className={`text-xs ${passwordMessage.includes('changed') ? 'text-green-400' : 'text-red-400'}`}>
                                {passwordMessage.includes('changed') ? 'Password changed!' : passwordMessage}
                            </p>
                        )}
                        <button
                            onClick={handleChangePassword}
                            className="w-full py-2.5 bg-white/10 text-white font-bold uppercase text-xs tracking-widest rounded-lg hover:bg-white/20 transition-colors"
                        >
                            Save Password
                        </button>
                    </div>
                )}
            </div>

            {/* Default Game Predictions */}
            <div className="glass-card p-6 w-full border border-f1-border">
                <DefaultDriverSettings drivers={drivers} />
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 w-full">
                <button
                    onClick={handleSignOut}
                    className="w-full py-3 bg-white/10 text-white font-bold uppercase text-xs tracking-widest rounded-lg hover:bg-white/20 transition-colors"
                >
                    Sign Out
                </button>

                {!showDeleteConfirm ? (
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full py-3 text-red-400 text-xs font-mono uppercase tracking-widest hover:text-red-300 transition-colors"
                    >
                        Delete Account
                    </button>
                ) : (
                    <div className="glass-card p-4 border border-red-500/30">
                        <p className="text-red-400 text-xs mb-3">
                            Are you sure you want to delete your account? This action cannot be undone.
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-2 bg-white/10 text-white text-xs font-bold uppercase rounded-lg hover:bg-white/20 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    // Note: admin-level delete requires a server-side function
                                    await signOut();
                                    router.push('/');
                                }}
                                className="flex-1 py-2 bg-red-600 text-white text-xs font-bold uppercase rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
