import { NextResponse } from 'next/server';
import { getGameSchedule } from '@/lib/api/game';

export async function GET() {
    try {
        const schedule = await getGameSchedule();
        if (!schedule) {
            return NextResponse.json({ error: 'No race data available' }, { status: 404 });
        }
        return NextResponse.json(schedule);
    } catch (error) {
        console.error('Failed to fetch schedule:', error);
        return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
    }
}
