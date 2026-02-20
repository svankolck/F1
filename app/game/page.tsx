import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import GameClient from '@/components/game/GameClient';

import { getGameDrivers, getGameSchedule } from '@/lib/api/game';
import { getRaceCalendar } from '@/lib/api/jolpica';
import { GameSessionType, Prediction } from '@/lib/types/f1';

export default async function GamePage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login?redirect=/game');
    }

    const [schedule, drivers, races] = await Promise.all([
        getGameSchedule(),
        getGameDrivers(),
        getRaceCalendar('current').catch(() => []),
    ]);

    // Load user predictions server-side so they're available on first render
    let initialPredictions: Record<GameSessionType, Prediction | null> = {
        qualifying: null,
        race: null,
        sprint_qualifying: null,
        sprint: null,
    };

    if (schedule) {
        const { data: predData } = await supabase
            .from('predictions')
            .select('*')
            .eq('user_id', user.id)
            .eq('season', schedule.season)
            .eq('round', schedule.round);

        if (predData) {
            for (const p of predData) {
                initialPredictions[p.session_type as GameSessionType] = p as Prediction;
            }
        }
    }

    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
                <span className="material-icons text-4xl text-f1-text-muted animate-spin">hourglass_top</span>
            </div>
        }>
            <GameClient
                initialSchedule={schedule}
                initialDrivers={drivers}
                initialRaces={races}
                initialPredictions={initialPredictions}
            />
        </Suspense>
    );
}
