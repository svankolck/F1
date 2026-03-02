import { NextRequest, NextResponse } from 'next/server';
import { getTimingData } from '@/lib/api/timing';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const sessionKeyParam = searchParams.get('sessionKey');
    const sessionKey = sessionKeyParam ? Number.parseInt(sessionKeyParam, 10) : undefined;

    try {
        const payload = await getTimingData(
            Number.isFinite(sessionKey || NaN) ? sessionKey : undefined
        );

        return NextResponse.json(payload, {
            headers: {
                'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10',
            },
        });
    } catch (error) {
        console.error('Timing API error:', error);
        return NextResponse.json(
            {
                mode: 'idle',
                session: null,
                rows: [],
                updatedAt: new Date().toISOString(),
                weekendSessions: [],
                nextSession: null,
                error: 'Failed to fetch timing data',
            },
            { status: 500 }
        );
    }
}
