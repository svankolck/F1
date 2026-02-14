import { NextRequest, NextResponse } from 'next/server';
import { getDriverStandings, getConstructorStandings } from '@/lib/api/jolpica';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const season = searchParams.get('season') || 'current';
    const round = searchParams.get('round') || undefined;
    const type = searchParams.get('type') || 'drivers';

    try {
        if (type === 'constructors') {
            const standings = await getConstructorStandings(season, round || undefined);
            return NextResponse.json({ standings });
        }

        const standings = await getDriverStandings(season, round || undefined);
        return NextResponse.json({ standings });
    } catch (error) {
        console.error('Standings API error:', error);
        return NextResponse.json({ standings: [], error: 'Failed to fetch standings' }, { status: 500 });
    }
}
