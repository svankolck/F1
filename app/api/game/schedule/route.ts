import { NextRequest, NextResponse } from 'next/server';
import { getWeekendSchedule } from '@/lib/api/game';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const season = searchParams.get('season');
        const round = searchParams.get('round');

        const schedule = await getWeekendSchedule(
            season ? parseInt(season) : undefined,
            round ? parseInt(round) : undefined
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
