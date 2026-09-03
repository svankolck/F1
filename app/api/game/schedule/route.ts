import { NextRequest, NextResponse } from 'next/server';
import { getWeekendSchedule } from '@/lib/api/game';
import { parseRound, parseSeason } from '@/lib/api/params';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const requestedSeason = searchParams.get('season');
        const requestedRound = searchParams.get('round');
        const season = parseSeason(requestedSeason, String(new Date().getFullYear()));
        const round = requestedRound ? parseRound(requestedRound) : undefined;

        if (!season || (requestedRound && !round)) {
            return NextResponse.json({ error: 'Invalid schedule parameters' }, { status: 400 });
        }

        const schedule = await getWeekendSchedule(
            Number(season),
            round ? Number(round) : undefined
        );

        if (!schedule) {
            return NextResponse.json({ error: 'No race data available' }, { status: 404 });
        }
        return NextResponse.json(schedule);
    } catch (error) {
        console.error('Failed to fetch schedule:', error);
        return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
    }
}
