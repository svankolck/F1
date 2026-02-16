import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProfileClient from '@/components/auth/ProfileClient';
import { getGameDrivers } from '@/lib/api/game';

export default async function ProfilePage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    let { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    // Auto-create profile if it doesn't exist (fallback for trigger failures)
    if (!profile) {
        const username = user.user_metadata?.username || user.email?.split('@')[0] || 'user';
        const { data: newProfile } = await supabase
            .from('profiles')
            .insert({
                id: user.id,
                username,
                first_name: user.user_metadata?.first_name || '',
                last_name: user.user_metadata?.last_name || '',
            })
            .select()
            .single();
        profile = newProfile;
    }

    const drivers = await getGameDrivers();

    return <ProfileClient user={user} initialProfile={profile} drivers={drivers} />;
}
