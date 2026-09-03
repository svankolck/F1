import { NextRequest, NextResponse } from 'next/server';
import { getRaceCalendar } from '@/lib/api/jolpica';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculateScores } from '@/lib/api/scoring';
import { buildWeekendSchedule } from '@/lib/api/game';
import { GameSessionType } from '@/lib/types/f1';

// Timing buffers: how many ms after session start to attempt scoring
const SCORING_BUFFERS: Record<string, number> = {
    qualifying: 2.5 * 60 * 60 * 1000,    // 2.5h after start
    race: 3.5 * 60 * 60 * 1000,           // 3.5h after start
    sprint: 1.5 * 60 * 60 * 1000,         // 1.5h after start
    sprint_qualifying: 1.5 * 60 * 60 * 1000,
};

// Only score these session types
const SCORABLE_SESSIONS: GameSessionType[] = ['sprint_qualifying', 'sprint', 'qualifying', 'race'];

export async function GET(request: NextRequest) {
    // Verify cron secret
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
        console.error('CRON_SECRET is not configured');
        return NextResponse.json({ error: 'Cron is not configured' }, { status: 503 });
    }

    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = Date.now();
    const season = new Date().getFullYear();
    const scored: string[] = [];
    const skipped: string[] = [];
    const errors: string[] = [];

    try {
        const admin = createAdminClient();
        const races = await getRaceCalendar(String(season));

        // Get existing scoring log entries
        const { data: existingLogs, error: logQueryError } = await admin
            .from('scoring_log')
            .select('season, round, session_type, status')
            .eq('season', season);

        if (logQueryError) throw new Error(`Unable to read scoring log: ${logQueryError.message}`);

        const scoredSet = new Set(
            (existingLogs || [])
                .filter(log => log.status !== 'failed')
                .map(log => `${log.season}-${log.round}-${log.session_type}`)
        );

        for (const race of races) {
            const schedule = buildWeekendSchedule(race);

            for (const session of schedule.sessions) {
                // Only score race and sprint sessions
                if (!SCORABLE_SESSIONS.includes(session.type)) continue;

                const key = `${season}-${schedule.round}-${session.type}`;

                // Skip if already scored
                if (scoredSet.has(key)) {
                    continue;
                }

                // Check if enough time has passed since session start
                const scoringSession = session.type === 'sprint_qualifying'
                    ? schedule.sessions.find(candidate => candidate.type === 'sprint') ?? session
                    : session;
                const sessionStart = new Date(scoringSession.startTime).getTime();
                const buffer = SCORING_BUFFERS[session.type] || SCORING_BUFFERS.race;

                if (now < sessionStart + buffer) {
                    skipped.push(`R${schedule.round} ${session.type}: too early`);
                    continue;
                }

                // Attempt scoring
                try {
                    const result = await calculateScores(
                        String(season),
                        String(schedule.round),
                        session.type
                    );
                    scored.push(`R${schedule.round} ${session.type}: ${result.scored} users`);
                } catch (err) {
                    const msg = err instanceof Error ? err.message : 'Unknown error';
                    errors.push(`R${schedule.round} ${session.type}: ${msg}`);

                    // Log the failure
                    try {
                        await admin.from('scoring_log').upsert({
                            season,
                            round: schedule.round,
                            session_type: session.type,
                            status: 'failed',
                            scored_count: 0,
                            error_message: msg,
                            attempt_count: 1,
                            last_attempt_at: new Date().toISOString(),
                        }, { onConflict: 'season,round,session_type' });
                    } catch { /* ignore log error */ }
                }
            }
        }

        return NextResponse.json({
            message: 'Auto-score complete',
            scored,
            skipped,
            errors,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Auto-score cron error:', error);
        return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
    }
}
