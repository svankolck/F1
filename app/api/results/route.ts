import { NextRequest, NextResponse } from 'next/server';
import { getQualifyingResults, getRaceCalendar, getRaceResults, getSprintResults } from '@/lib/api/jolpica';
import { getOpenF1ResultsForRound } from '@/lib/api/openf1-results';
import { parseRound, parseSeason, PUBLIC_CACHE_HEADERS } from '@/lib/api/params';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const season = parseSeason(searchParams.get('season'));
    const round = parseRound(searchParams.get('round'), '1');
    const circuitId = searchParams.get('circuitId');

    if (!season || !round) return NextResponse.json({ error: 'Invalid results parameters' }, { status: 400 });

    const year = season === 'current' ? new Date().getFullYear() : parseInt(season);

    try {
        const [racePayload, qualifying, sprintPayload, openf1Data] = await Promise.all([
            getRaceResults(season, round).catch(() => ({ race: null, results: [] })),
            getQualifyingResults(season, round).catch(() => []),
            getSprintResults(season, round).catch(() => ({ race: null, results: [] })),
            circuitId ? getOpenF1ResultsForRound(year, circuitId).catch(() => ({ practiceResults: {}, practiceErrors: {}, sprintQualifying: [] })) : Promise.resolve({ practiceResults: {}, practiceErrors: {}, sprintQualifying: [] }),
        ]);

        if (racePayload.race) {
            return NextResponse.json({
                race: racePayload.race,
                results: racePayload.results,
                qualifying,
                sprintResults: sprintPayload.results || [],
                practiceResults: openf1Data.practiceResults,
                practiceErrors: openf1Data.practiceErrors,
                openf1SprintQualifying: openf1Data.sprintQualifying,
            }, { headers: PUBLIC_CACHE_HEADERS });
        }

        const races = await getRaceCalendar(season).catch(() => []);
        const race = races.find((item) => item.round === round) || null;

        return NextResponse.json({
            race,
            results: [],
            qualifying,
            sprintResults: sprintPayload.results || [],
            practiceResults: openf1Data.practiceResults,
            practiceErrors: openf1Data.practiceErrors,
            openf1SprintQualifying: openf1Data.sprintQualifying,
        }, { headers: PUBLIC_CACHE_HEADERS });
    } catch (error) {
        console.error('Results API error:', error);
        return NextResponse.json(
            { 
                race: null, 
                results: [], 
                qualifying: [], 
                sprintResults: [], 
                practiceResults: {}, 
                practiceErrors: {},
                openf1SprintQualifying: [],
                error: 'Failed to fetch race results' 
            },
            { status: 502 }
        );
    }
}
