import { NextRequest, NextResponse } from 'next/server';
import { getRaceCalendar } from '@/lib/api/jolpica';
import { parseSeason, PUBLIC_CACHE_HEADERS } from '@/lib/api/params';

export async function GET(request: NextRequest) {
    const season = parseSeason(request.nextUrl.searchParams.get('season'));
    if (!season) return NextResponse.json({ error: 'Invalid season' }, { status: 400 });

    try {
        return NextResponse.json({ races: await getRaceCalendar(season) }, { headers: PUBLIC_CACHE_HEADERS });
    } catch (error) {
        console.error('Calendar API error:', error);
        return NextResponse.json({ error: 'Failed to fetch calendar' }, { status: 502 });
    }
}
