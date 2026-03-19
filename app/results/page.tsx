import { Suspense } from 'react';
import ResultsClient from '@/components/results/ResultsClient';
import { getQualifyingResults, getRaceCalendar, getRaceResults, getSprintResults } from '@/lib/api/jolpica';
import { getOpenF1ResultsForRound } from '@/lib/api/openf1-results';
import { getFlagUrl } from '@/lib/types/f1';

export const revalidate = 300;

function getLatestCompletedRound(races: Array<{ round: string; date: string; time?: string }>): string {
    const now = new Date();
    const completed = races.filter((race) => {
        const dt = new Date(`${race.date}T${race.time || '23:59:59Z'}`);
        return dt < now;
    });

    if (completed.length > 0) {
        return completed[completed.length - 1].round;
    }

    return races.length > 0 ? races[0].round : '1';
}

export default async function ResultsPage() {
    const currentYear = new Date().getFullYear().toString();
    const races = await getRaceCalendar('current').catch(() => []);
    const initialRound = getLatestCompletedRound(races);
    const initialRace = races.find(r => r.round === initialRound);

    const [racePayload, qualifying, sprintPayload, openf1Data] = await Promise.all([
        getRaceResults('current', initialRound).catch(() => ({ race: null, results: [] })),
        getQualifyingResults('current', initialRound).catch(() => []),
        getSprintResults('current', initialRound).catch(() => ({ race: null, results: [] })),
        initialRace ? getOpenF1ResultsForRound(parseInt(currentYear), initialRace.Circuit.circuitId).catch(() => ({ practiceResults: {}, sprintQualifying: [] })) : Promise.resolve({ practiceResults: {}, sprintQualifying: [] }),
    ]);

    const countryFlags: Record<string, string> = {};
    races.forEach((race) => {
        countryFlags[race.Circuit.Location.country] = getFlagUrl(race.Circuit.Location.country);
    });

    const availableSeasons = Array.from(
        { length: parseInt(currentYear) - 1999 },
        (_, i) => (parseInt(currentYear) - i).toString()
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
            <ResultsClient
                initialSeason={currentYear}
                initialRound={initialRound}
                initialRace={racePayload.race || null}
                initialRaces={races}
                initialResults={racePayload.results || []}
                initialQualifying={qualifying}
                initialSprintResults={sprintPayload.results || []}
                initialPracticeResults={openf1Data.practiceResults}
                initialOpenF1SprintQualifying={openf1Data.sprintQualifying}
                availableSeasons={availableSeasons}
                countryFlags={countryFlags}
            />
        </Suspense>
    );
}
