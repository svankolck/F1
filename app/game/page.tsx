import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import GameClient from '@/components/game/GameClient';
// Removed unused type imports

import { getGameDrivers, getGameSchedule } from '@/lib/api/game';

// Removed internal fetch functions to avoid build-time localhost dependency


export default async function GamePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login?redirect=/game');
    }

    const [schedule, drivers] = await Promise.all([
        getGameSchedule(),
        getGameDrivers(),
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
