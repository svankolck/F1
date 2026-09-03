import { NextRequest, NextResponse } from 'next/server';
import { getDriverStandings, getConstructorStandings } from '@/lib/api/jolpica';
import { parseRound, parseSeason, PUBLIC_CACHE_HEADERS } from '@/lib/api/params';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const season = parseSeason(searchParams.get('season'));
    const round = parseRound(searchParams.get('round'));
    const type = searchParams.get('type') || 'drivers';

    if (!season || (searchParams.has('round') && !round) || !['drivers', 'constructors'].includes(type)) {
        return NextResponse.json({ error: 'Invalid standings parameters' }, { status: 400 });
    }

    try {
        if (type === 'constructors') {
            const standings = await getConstructorStandings(season, round || undefined);
            return NextResponse.json({ standings }, { headers: PUBLIC_CACHE_HEADERS });
        }

        const standings = await getDriverStandings(season, round || undefined);
        return NextResponse.json({ standings }, { headers: PUBLIC_CACHE_HEADERS });
    } catch (error) {
        console.error('Standings API error:', error);
        return NextResponse.json({ standings: [], error: 'Failed to fetch standings' }, { status: 502 });
    }
}
