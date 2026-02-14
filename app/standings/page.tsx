import { Suspense } from 'react';
import StandingsClient from '@/components/standings/StandingsClient';
import { getRaceCalendar, getDriverStandings, getConstructorStandings } from '@/lib/api/jolpica';
import { getFlagUrl } from '@/lib/types/f1';

export const revalidate = 300;

export default async function StandingsPage() {
    const currentYear = new Date().getFullYear().toString();

    // Fetch race calendar and standings in parallel
    const [races, driverStandings, constructorStandings] = await Promise.all([
        getRaceCalendar('current').catch(() => []),
        getDriverStandings('current').catch(() => []),
        getConstructorStandings('current').catch(() => []),
    ]);

    // Determine the latest completed round
    const now = new Date();
    const completedRaces = races.filter((r) => {
        const raceDate = new Date(`${r.date}T${r.time || '23:59:59Z'}`);
        return raceDate < now;
    });
    const latestRound = completedRaces.length > 0
        ? completedRaces[completedRaces.length - 1].round
        : races.length > 0 ? races[0].round : '1';

    // Build country flag map
    const countryFlags: Record<string, string> = {};
    races.forEach((race) => {
        countryFlags[race.Circuit.Location.country] = getFlagUrl(race.Circuit.Location.country);
    });

    // Available seasons (current year back to 2000)
    const availableSeasons = Array.from(
        { length: parseInt(currentYear) - 1999 },
        (_, i) => (parseInt(currentYear) - i).toString()
    );

    return (
        <Suspense fallback={
            <div className="flex items-center justify-center py-20 gap-3">
                <div className="w-5 h-5 border-2 border-f1-red/30 border-t-f1-red rounded-full animate-spin" />
                <span className="text-sm text-f1-text-muted font-mono uppercase tracking-wider">Loading…</span>
            </div>
        }>
            <StandingsClient
                races={races}
                initialRound={latestRound}
                initialSeason={currentYear}
                initialDriverStandings={driverStandings}
                initialConstructorStandings={constructorStandings}
                countryFlags={countryFlags}
                availableSeasons={availableSeasons}
            />
        </Suspense>
    );
}
