import { NextRequest, NextResponse } from 'next/server';
import { getQualifyingResults, getRaceCalendar, getRaceResults, getSprintResults } from '@/lib/api/jolpica';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const season = searchParams.get('season') || 'current';
    const round = searchParams.get('round') || '1';

    try {
        const [racePayload, qualifying, sprintPayload] = await Promise.all([
            getRaceResults(season, round).catch(() => ({ race: null, results: [] })),
            getQualifyingResults(season, round).catch(() => []),
            getSprintResults(season, round).catch(() => ({ race: null, results: [] })),
        ]);

        if (racePayload.race) {
            return NextResponse.json({
                race: racePayload.race,
                results: racePayload.results,
                qualifying,
                sprintResults: sprintPayload.results || [],
            });
        }

        const races = await getRaceCalendar(season).catch(() => []);
        const race = races.find((item) => item.round === round) || null;

        return NextResponse.json({
            race,
            results: [],
            qualifying,
            sprintResults: sprintPayload.results || [],
        });
    } catch (error) {
        console.error('Results API error:', error);
        return NextResponse.json(
            { race: null, results: [], qualifying: [], sprintResults: [], error: 'Failed to fetch race results' },
            { status: 500 }
        );
    }
}
