'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface Profile {
    id: string;
    username: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    is_active: boolean;
}

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    signOut: async () => { },
    refreshProfile: async () => { },
});

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

async function fetchProfile(userId: string): Promise<Profile | null> {
    const supabase = createClient();
    const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    return data;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const refreshProfile = useCallback(async () => {
        if (!user) {
            setProfile(null);
            return;
        }
        const p = await fetchProfile(user.id);
        setProfile(p);
    }, [user]);

    useEffect(() => {
        // Get initial session
        const getSession = async () => {
            try {
                const { data: { user: currentUser } } = await supabase.auth.getUser();
                setUser(currentUser);
                if (currentUser) {
                    const p = await fetchProfile(currentUser.id);
                    setProfile(p);
                }
            } catch {
                // Session may not exist yet
            } finally {
                setLoading(false);
            }
        };

        getSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                const currentUser = session?.user ?? null;
                setUser(currentUser);
                if (currentUser) {
                    const p = await fetchProfile(currentUser.id);
                    setProfile(p);
                } else {
                    setProfile(null);
                }
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, [supabase]);

    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
    }, [supabase]);

    return (
        <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}
