import { Suspense } from 'react';
import BattleClient from '@/components/standings/battle/BattleClient';
import { getBattlePayload } from '@/lib/api/battle';

export const revalidate = 300;

export default async function BattlePage() {
    const currentYear = new Date().getFullYear().toString();
    const payload = await getBattlePayload('current').catch(() => ({
        season: currentYear,
        races: [],
        drivers: [],
        data: [],
        defaultDriverIds: [],
    }));

    const availableSeasons = Array.from(
        { length: parseInt(currentYear, 10) - 1999 },
        (_, index) => (parseInt(currentYear, 10) - index).toString()
    );

    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center py-20 gap-3">
                    <div className="w-5 h-5 border-2 border-f1-red/30 border-t-f1-red rounded-full animate-spin" />
                    <span className="text-sm text-f1-text-muted font-mono uppercase tracking-wider">Loading…</span>
                </div>
            }
        >
            <BattleClient
                initialSeason={currentYear}
                initialDrivers={payload.drivers}
                initialData={payload.data}
                initialDefaultDriverIds={payload.defaultDriverIds}
                availableSeasons={availableSeasons}
            />
        </Suspense>
    );
}
