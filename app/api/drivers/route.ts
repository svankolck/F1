import { NextResponse } from 'next/server';
import { getGameDrivers } from '@/lib/api/game';

export async function GET() {
    try {
        const drivers = await getGameDrivers();
        return NextResponse.json(drivers, {
            headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' },
        });
    } catch (error) {
        console.error('Failed to fetch drivers:', error);
        return NextResponse.json({ error: 'Failed to fetch drivers' }, { status: 500 });
    }
}
