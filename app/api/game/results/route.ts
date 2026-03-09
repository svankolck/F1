import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { GameSessionType } from '@/lib/types/f1';

const SESSION_LABELS: Record<GameSessionType, string> = {
    qualifying: 'Qualifying',
    sprint_qualifying: 'Sprint Qualifying',
    sprint: 'Sprint',
    race: 'Race',
};

const SESSION_ORDER: Record<GameSessionType, number> = {
    qualifying: 1,
    sprint_qualifying: 2,
    sprint: 3,
    race: 4,
};

function fallbackPrediction(sessionType: GameSessionType, profile: {
    default_pole_driver: string | null;
    default_p1_driver: string | null;
    default_p2_driver: string | null;
    default_p3_driver: string | null;
}) {
    const hasPole = sessionType === 'qualifying' || sessionType === 'sprint_qualifying';

    return {
        pole_driver_id: hasPole ? profile.default_pole_driver : null,
        p1_driver_id: hasPole ? null : profile.default_p1_driver,
        p2_driver_id: hasPole ? null : profile.default_p2_driver,
        p3_driver_id: hasPole ? null : profile.default_p3_driver,
    };
}

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const season = parseInt(searchParams.get('season') || '');
        const round = parseInt(searchParams.get('round') || '');

        if (!season || !round) {
            return NextResponse.json({ error: 'Missing season or round' }, { status: 400 });
        }

        const admin = createAdminClient();

        const [{ data: scores, error: scoresError }, { data: predictions, error: predictionsError }, { data: logEntries, error: logError }] = await Promise.all([
            admin
                .from('game_scores')
                .select('user_id, session_type, pole_points, p1_points, p2_points, p3_points, bonus_points, total_points')
                .eq('season', season)
                .eq('round', round),
            admin
                .from('predictions')
                .select('user_id, session_type, pole_driver_id, p1_driver_id, p2_driver_id, p3_driver_id')
                .eq('season', season)
                .eq('round', round),
            admin
                .from('scoring_log')
                .select('session_type, status, actual_pole, actual_p1, actual_p2, actual_p3')
                .eq('season', season)
                .eq('round', round),
        ]);

        if (scoresError || predictionsError || logError) {
            return NextResponse.json({
                error: scoresError?.message || predictionsError?.message || logError?.message || 'Failed to fetch results',
            }, { status: 500 });
        }

        if (!scores || scores.length === 0) {
            return NextResponse.json({ entries: [], sessions: [] });
        }

        const userIds = Array.from(new Set(scores.map((score) => score.user_id)));
        const { data: profiles, error: profilesError } = await admin
            .from('profiles')
            .select('id, username, avatar_url, default_pole_driver, default_p1_driver, default_p2_driver, default_p3_driver')
            .in('id', userIds);

        if (profilesError) {
            return NextResponse.json({ error: profilesError.message }, { status: 500 });
        }

        const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));
        const predictionMap = new Map(
            (predictions || []).map((prediction) => [`${prediction.user_id}:${prediction.session_type}`, prediction])
        );
        const logMap = new Map(
            (logEntries || []).map((entry) => [entry.session_type as GameSessionType, entry])
        );

        const sessions = Array.from(logMap.entries())
            .sort((a, b) => SESSION_ORDER[a[0]] - SESSION_ORDER[b[0]])
            .map(([sessionType, entry]) => ({
                sessionType,
                label: SESSION_LABELS[sessionType],
                status: entry.status,
                actualPole: entry.actual_pole,
                actualP1: entry.actual_p1,
                actualP2: entry.actual_p2,
                actualP3: entry.actual_p3,
            }));

        const entries = userIds.map((userId) => {
            const profile = profileMap.get(userId);
            const userScores = scores
                .filter((score) => score.user_id === userId)
                .sort((a, b) => SESSION_ORDER[a.session_type as GameSessionType] - SESSION_ORDER[b.session_type as GameSessionType]);

            const results = userScores.map((score) => {
                const sessionType = score.session_type as GameSessionType;
                const savedPrediction = predictionMap.get(`${userId}:${sessionType}`);
                const fallback = profile ? fallbackPrediction(sessionType, profile) : {
                    pole_driver_id: null,
                    p1_driver_id: null,
                    p2_driver_id: null,
                    p3_driver_id: null,
                };

                return {
                    sessionType,
                    label: SESSION_LABELS[sessionType],
                    totalPoints: score.total_points,
                    polePoints: score.pole_points,
                    p1Points: score.p1_points,
                    p2Points: score.p2_points,
                    p3Points: score.p3_points,
                    bonusPoints: score.bonus_points,
                    prediction: {
                        pole_driver_id: savedPrediction?.pole_driver_id ?? fallback.pole_driver_id,
                        p1_driver_id: savedPrediction?.p1_driver_id ?? fallback.p1_driver_id,
                        p2_driver_id: savedPrediction?.p2_driver_id ?? fallback.p2_driver_id,
                        p3_driver_id: savedPrediction?.p3_driver_id ?? fallback.p3_driver_id,
                    },
                    usedDefaults: !savedPrediction,
                };
            });

            return {
                userId,
                username: profile?.username || 'Unknown',
                avatarUrl: profile?.avatar_url || undefined,
                totalPoints: results.reduce((sum, result) => sum + result.totalPoints, 0),
                results,
            };
        }).sort((a, b) => b.totalPoints - a.totalPoints);

        return NextResponse.json({ entries, sessions });
    } catch (error) {
        console.error('Game results fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch game results' }, { status: 500 });
    }
}
