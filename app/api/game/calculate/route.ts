import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRaceResults, getSprintResults, getQualifyingResults } from '@/lib/api/jolpica';
import { RACE_SCORING, SPRINT_SCORING, GameSessionType } from '@/lib/types/f1';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Admin only' }, { status: 403 });
        }

        const { season, round, sessionType } = await request.json() as {
            season: string;
            round: string;
            sessionType: GameSessionType;
        };

        // Get actual results based on session type
        let actualPole: string | null = null;
        let actualP1: string | null = null;
        let actualP2: string | null = null;
        let actualP3: string | null = null;

        if (sessionType === 'qualifying' || sessionType === 'sprint_qualifying') {
            const qualiResults = await getQualifyingResults(season, round);
            if (qualiResults.length > 0) {
                actualPole = qualiResults[0]?.Driver.driverId || null;
            }
        }

        if (sessionType === 'race') {
            const { results } = await getRaceResults(season, round);
            actualP1 = results[0]?.Driver.driverId || null;
            actualP2 = results[1]?.Driver.driverId || null;
            actualP3 = results[2]?.Driver.driverId || null;
            // Also check qualifying for pole
            try {
                const qualiResults = await getQualifyingResults(season, round);
                if (qualiResults.length > 0) {
                    actualPole = qualiResults[0]?.Driver.driverId || null;
                }
            } catch { /* ignore */ }
        }

        if (sessionType === 'sprint') {
            const { results } = await getSprintResults(season, round);
            actualP1 = results[0]?.Driver.driverId || null;
            actualP2 = results[1]?.Driver.driverId || null;
            actualP3 = results[2]?.Driver.driverId || null;
        }

        const actualTop3 = [actualP1, actualP2, actualP3].filter(Boolean);

        // Get all predictions for this round/session
        const predSessionType = sessionType === 'race' ? 'race' : sessionType === 'sprint' ? 'sprint' : sessionType;
        const { data: predictions } = await supabase
            .from('predictions')
            .select('*')
            .eq('season', parseInt(season))
            .eq('round', parseInt(round))
            .eq('session_type', predSessionType);

        if (!predictions || predictions.length === 0) {
            return NextResponse.json({ message: 'No predictions to score', scored: 0 });
        }

        const scoring = (sessionType === 'sprint' || sessionType === 'sprint_qualifying') ? SPRINT_SCORING : RACE_SCORING;

        // Calculate scores for each prediction
        const scores = predictions.map(pred => {
            let polePoints = 0;
            let p1Points = 0;
            let p2Points = 0;
            let p3Points = 0;
            let bonusPoints = 0;

            // Pole check (only for qualifying sessions)
            if ((sessionType === 'qualifying' || sessionType === 'sprint_qualifying') && pred.pole_driver_id) {
                if (pred.pole_driver_id === actualPole) {
                    polePoints = scoring.pole;
                }
            }

            // P1 check
            if (pred.p1_driver_id) {
                if (pred.p1_driver_id === actualP1) {
                    p1Points = scoring.p1;
                } else if (actualTop3.includes(pred.p1_driver_id)) {
                    bonusPoints += scoring.bonus;
                }
            }

            // P2 check
            if (pred.p2_driver_id) {
                if (pred.p2_driver_id === actualP2) {
                    p2Points = scoring.p2;
                } else if (actualTop3.includes(pred.p2_driver_id)) {
                    bonusPoints += scoring.bonus;
                }
            }

            // P3 check
            if (pred.p3_driver_id) {
                if (pred.p3_driver_id === actualP3) {
                    p3Points = scoring.p3;
                } else if (actualTop3.includes(pred.p3_driver_id)) {
                    bonusPoints += scoring.bonus;
                }
            }

            const totalPoints = polePoints + p1Points + p2Points + p3Points + bonusPoints;

            return {
                user_id: pred.user_id,
                season: parseInt(season),
                round: parseInt(round),
                session_type: predSessionType,
                pole_points: polePoints,
                p1_points: p1Points,
                p2_points: p2Points,
                p3_points: p3Points,
                bonus_points: bonusPoints,
                total_points: totalPoints,
            };
        });

        // Upsert scores
        const { error } = await supabase
            .from('game_scores')
            .upsert(scores, { onConflict: 'user_id,season,round,session_type' });

        if (error) {
            console.error('Failed to upsert scores:', error);
            return NextResponse.json({ error: 'Failed to save scores' }, { status: 500 });
        }

        return NextResponse.json({
            message: `Scored ${scores.length} predictions`,
            scored: scores.length,
            results: { actualPole, actualP1, actualP2, actualP3 },
        });
    } catch (error) {
        console.error('Score calculation error:', error);
        return NextResponse.json({ error: 'Failed to calculate scores' }, { status: 500 });
    }
}
