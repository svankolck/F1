import { NextRequest, NextResponse } from 'next/server';
import { getTimingBootstrap } from '@/lib/api/timing';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const sessionKeyParam = searchParams.get('sessionKey');
    const sessionKey = sessionKeyParam ? Number.parseInt(sessionKeyParam, 10) : undefined;

    try {
        const payload = await getTimingBootstrap(Number.isFinite(sessionKey || NaN) ? sessionKey : undefined);
        return NextResponse.json(payload);
    } catch (error) {
        console.error('Timing API error:', error);
        return NextResponse.json(
            {
                mode: 'replay',
                liveSession: null,
                replaySession: null,
                selectedSession: null,
                weekendSessions: [],
                nextSession: null,
                snapshot: null,
                error: 'Failed to fetch timing data',
            },
            { status: 500 }
        );
    }
}
