import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import GameClient from '@/components/game/GameClient';
import { GameDriver, WeekendSchedule } from '@/lib/types/f1';

async function fetchSchedule(): Promise<WeekendSchedule | null> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/game/schedule`, {
            next: { revalidate: 300 },
        });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

async function fetchDrivers(): Promise<GameDriver[]> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/drivers`, {
            next: { revalidate: 86400 },
        });
        if (!res.ok) return [];
        return res.json();
    } catch {
        return [];
    }
}

export default async function GamePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login?redirect=/game');
    }

    const [schedule, drivers] = await Promise.all([
        fetchSchedule(),
        fetchDrivers(),
    ]);

    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
                <span className="material-icons text-4xl text-f1-text-muted animate-spin">hourglass_top</span>
            </div>
        }>
            <GameClient
                initialSchedule={schedule}
                initialDrivers={drivers}
            />
        </Suspense>
    );
}
