import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getRaceResults, getSprintResults, getQualifyingResults } from '@/lib/api/jolpica';
import { RACE_SCORING, SPRINT_SCORING, GameSessionType } from '@/lib/types/f1';

interface StoredPrediction {
    user_id: string;
    pole_driver_id: string | null;
    p1_driver_id: string | null;
    p2_driver_id: string | null;
    p3_driver_id: string | null;
}

interface UserDefaults {
    id: string;
    default_pole_driver: string | null;
    default_p1_driver: string | null;
    default_p2_driver: string | null;
    default_p3_driver: string | null;
}

function scoreTop3(
    prediction: StoredPrediction,
    actualP1: string | null,
    actualP2: string | null,
    actualP3: string | null,
    bonus: number
) {
    const actualTop3 = [actualP1, actualP2, actualP3].filter((d): d is string => !!d);
    const exactMatched = new Set<string>();
    let bonusPoints = 0;

    const predictionOrder = [
        { driver: prediction.p1_driver_id, actual: actualP1 },
        { driver: prediction.p2_driver_id, actual: actualP2 },
        { driver: prediction.p3_driver_id, actual: actualP3 },
    ];

    for (const slot of predictionOrder) {
        if (slot.driver && slot.actual && slot.driver === slot.actual) {
            exactMatched.add(slot.driver);
        }
    }

    const bonusCandidates = new Set<string>();
    for (const slot of predictionOrder) {
        if (!slot.driver) continue;
        if (slot.actual && slot.driver === slot.actual) continue;
        if (exactMatched.has(slot.driver)) continue;
        bonusCandidates.add(slot.driver);
    }

    for (const driverId of Array.from(bonusCandidates)) {
        if (actualTop3.includes(driverId)) {
            bonusPoints += bonus;
        }
    }

    return bonusPoints;
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const admin = createAdminClient();

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

        if (sessionType !== 'race' && sessionType !== 'sprint') {
            return NextResponse.json({ error: 'Only race and sprint scoring are supported' }, { status: 400 });
        }

        // Get actual results based on session type
        let actualPole: string | null = null;
        let actualP1: string | null = null;
        let actualP2: string | null = null;
        let actualP3: string | null = null;

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

        // Get all predictions for this round/session
        const { data: predictions } = await admin
            .from('predictions')
            .select('user_id, pole_driver_id, p1_driver_id, p2_driver_id, p3_driver_id')
            .eq('season', parseInt(season))
            .eq('round', parseInt(round))
            .eq('session_type', sessionType);

        const { data: profileDefaults } = await admin
            .from('profiles')
            .select('id, default_pole_driver, default_p1_driver, default_p2_driver, default_p3_driver')
            .or('default_pole_driver.not.is.null,default_p1_driver.not.is.null,default_p2_driver.not.is.null,default_p3_driver.not.is.null');

        const predictionMap = new Map<string, StoredPrediction>();
        for (const pred of (predictions || [])) {
            predictionMap.set(pred.user_id, pred as StoredPrediction);
        }

        for (const profile of (profileDefaults || []) as UserDefaults[]) {
            const hasSaved = predictionMap.has(profile.id);
            const hasPole = sessionType === 'race';
            const fallback: StoredPrediction = {
                user_id: profile.id,
                pole_driver_id: hasPole ? profile.default_pole_driver : null,
                p1_driver_id: profile.default_p1_driver,
                p2_driver_id: profile.default_p2_driver,
                p3_driver_id: profile.default_p3_driver,
            };

            if (!hasSaved) {
                if (!fallback.pole_driver_id && !fallback.p1_driver_id && !fallback.p2_driver_id && !fallback.p3_driver_id) {
                    continue;
                }
                predictionMap.set(profile.id, fallback);
                continue;
            }

            const existing = predictionMap.get(profile.id)!;
            predictionMap.set(profile.id, {
                user_id: existing.user_id,
                pole_driver_id: existing.pole_driver_id || fallback.pole_driver_id,
                p1_driver_id: existing.p1_driver_id || fallback.p1_driver_id,
                p2_driver_id: existing.p2_driver_id || fallback.p2_driver_id,
                p3_driver_id: existing.p3_driver_id || fallback.p3_driver_id,
            });
        }

        const effectivePredictions = Array.from(predictionMap.values());
        if (effectivePredictions.length === 0) {
            return NextResponse.json({ message: 'No predictions or defaults to score', scored: 0 });
        }

        const scoring = sessionType === 'sprint' ? SPRINT_SCORING : RACE_SCORING;

        // Calculate scores for each prediction/default
        const scores = effectivePredictions.map(pred => {
            let polePoints = 0;
            let p1Points = 0;
            let p2Points = 0;
            let p3Points = 0;

            if (sessionType === 'race' && pred.pole_driver_id) {
                if (pred.pole_driver_id === actualPole) {
                    polePoints = scoring.pole;
                }
            }

            // P1 check
            if (pred.p1_driver_id) {
                if (pred.p1_driver_id === actualP1) {
                    p1Points = scoring.p1;
                }
            }

            // P2 check
            if (pred.p2_driver_id) {
                if (pred.p2_driver_id === actualP2) {
                    p2Points = scoring.p2;
                }
            }

            // P3 check
            if (pred.p3_driver_id) {
                if (pred.p3_driver_id === actualP3) {
                    p3Points = scoring.p3;
                }
            }

            const bonusPoints = scoreTop3(pred, actualP1, actualP2, actualP3, scoring.bonus);
            const totalPoints = polePoints + p1Points + p2Points + p3Points + bonusPoints;

            return {
                user_id: pred.user_id,
                season: parseInt(season),
                round: parseInt(round),
                session_type: sessionType,
                pole_points: polePoints,
                p1_points: p1Points,
                p2_points: p2Points,
                p3_points: p3Points,
                bonus_points: bonusPoints,
                total_points: totalPoints,
            };
        });

        // Upsert scores
        const { error } = await admin
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
