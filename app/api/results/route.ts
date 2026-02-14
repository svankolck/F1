import { NextRequest, NextResponse } from 'next/server';
import { getQualifyingResults, getRaceCalendar, getRaceResults } from '@/lib/api/jolpica';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const season = searchParams.get('season') || 'current';
    const round = searchParams.get('round') || '1';

    try {
        const [racePayload, qualifying] = await Promise.all([
            getRaceResults(season, round).catch(() => ({ race: null, results: [] })),
            getQualifyingResults(season, round).catch(() => []),
        ]);

        if (racePayload.race) {
            return NextResponse.json({
                race: racePayload.race,
                results: racePayload.results,
                qualifying,
            });
        }

        const races = await getRaceCalendar(season).catch(() => []);
        const race = races.find((item) => item.round === round) || null;

        return NextResponse.json({
            race,
            results: [],
            qualifying,
        });
    } catch (error) {
        console.error('Results API error:', error);
        return NextResponse.json(
            { race: null, results: [], qualifying: [], error: 'Failed to fetch race results' },
            { status: 500 }
        );
    }
}
