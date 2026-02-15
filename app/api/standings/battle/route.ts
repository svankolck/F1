import { NextRequest, NextResponse } from 'next/server';
import { getBattlePayload } from '@/lib/api/battle';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const season = searchParams.get('season') || 'current';

    try {
        const payload = await getBattlePayload(season);
        return NextResponse.json(payload);
    } catch (error) {
        console.error('Battle API error:', error);
        return NextResponse.json(
            { season, races: [], drivers: [], data: [], defaultDriverIds: [], error: 'Failed to fetch battle data' },
            { status: 500 }
        );
    }
}
