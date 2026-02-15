import { NextResponse } from 'next/server';
import { getDriverStandings } from '@/lib/api/jolpica';
import { GameDriver, getTeamColor, getDriverImageUrl } from '@/lib/types/f1';

export async function GET() {
    try {
        const standings = await getDriverStandings('current');

        const drivers: GameDriver[] = standings.map(s => ({
            driverId: s.Driver.driverId,
            code: s.Driver.code,
            firstName: s.Driver.givenName,
            lastName: s.Driver.familyName,
            teamName: s.Constructors[0]?.name || 'Unknown',
            teamColor: getTeamColor(s.Constructors[0]?.constructorId || ''),
            headshotUrl: getDriverImageUrl(s.Driver.driverId),
            number: s.Driver.permanentNumber || '',
        }));

        return NextResponse.json(drivers, {
            headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' },
        });
    } catch (error) {
        console.error('Failed to fetch drivers:', error);
        return NextResponse.json({ error: 'Failed to fetch drivers' }, { status: 500 });
    }
}
