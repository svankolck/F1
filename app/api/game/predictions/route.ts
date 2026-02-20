import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getRaceCalendar } from '@/lib/api/jolpica';
import { GameSessionType, Race } from '@/lib/types/f1';

interface SavePredictionRequest {
    season: number;
    round: number;
    sessionType: GameSessionType;
    pole_driver_id: string | null;
    p1_driver_id: string | null;
    p2_driver_id: string | null;
    p3_driver_id: string | null;
    is_default?: boolean;
}

function getSessionStartTime(race: Race, sessionType: GameSessionType): string | null {
    if (sessionType === 'qualifying') {
        if (!race.Qualifying) return null;
        return `${race.Qualifying.date}T${race.Qualifying.time}`;
    }

    if (sessionType === 'sprint_qualifying') {
        if (!race.SprintQualifying) return null;
        return `${race.SprintQualifying.date}T${race.SprintQualifying.time}`;
    }

    if (sessionType === 'sprint') {
        if (!race.Sprint) return null;
        return `${race.Sprint.date}T${race.Sprint.time}`;
    }

    const raceTime = race.time || '14:00:00Z';
    return `${race.date}T${raceTime}`;
}

function hasDuplicateDrivers(drivers: Array<string | null>): boolean {
    const filtered = drivers.filter((d): d is string => !!d);
    return new Set(filtered).size !== filtered.length;
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json() as SavePredictionRequest;
        const season = Number(body.season);
        const round = Number(body.round);
        const sessionType = body.sessionType;
        const hasPole = sessionType === 'qualifying' || sessionType === 'sprint_qualifying';

        if (!Number.isInteger(season) || !Number.isInteger(round)) {
            return NextResponse.json({ error: 'Invalid season or round' }, { status: 400 });
        }

        const calendar = await getRaceCalendar(String(season));
        const race = calendar.find(r => Number(r.round) === round);

        if (!race) {
            return NextResponse.json({ error: 'Race not found for season/round' }, { status: 404 });
        }

        const startTime = getSessionStartTime(race, sessionType);
        if (!startTime) {
            return NextResponse.json({ error: 'Session not available for this weekend' }, { status: 400 });
        }

        if (new Date() >= new Date(startTime)) {
            return NextResponse.json({ error: 'Prediction is locked for this session' }, { status: 423 });
        }

        const poleDriverId = hasPole ? body.pole_driver_id || null : null;
        const p1DriverId = body.p1_driver_id || null;
        const p2DriverId = body.p2_driver_id || null;
        const p3DriverId = body.p3_driver_id || null;

        if (hasDuplicateDrivers([poleDriverId, p1DriverId, p2DriverId, p3DriverId])) {
            return NextResponse.json({ error: 'Duplicate drivers are not allowed' }, { status: 400 });
        }

        let admin;
        try {
            admin = createAdminClient();
        } catch (e) {
            console.error('Admin client creation failed:', e);
            return NextResponse.json({ error: 'Server configuration error: service role key missing or invalid' }, { status: 500 });
        }

        const payload = {
            user_id: user.id,
            season,
            round,
            session_type: sessionType,
            pole_driver_id: poleDriverId,
            p1_driver_id: p1DriverId,
            p2_driver_id: p2DriverId,
            p3_driver_id: p3DriverId,
            is_default: Boolean(body.is_default),
        };

        const { data, error } = await admin
            .from('predictions')
            .upsert(payload, { onConflict: 'user_id,season,round,session_type' })
            .select('*')
            .single();

        if (error) {
            console.error('Prediction upsert error:', error);
            return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Prediction save error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: `Server error: ${message}` }, { status: 500 });
    }
}
