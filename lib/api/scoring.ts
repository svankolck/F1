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

export async function calculateScores(
    season: string,
    round: string,
    sessionType: GameSessionType,
    scoredBy?: string
): Promise<{ scored: number; results: { actualPole: string | null; actualP1: string | null; actualP2: string | null; actualP3: string | null } }> {
    const admin = createAdminClient();

    // Get actual results
    let actualPole: string | null = null;
    let actualP1: string | null = null;
    let actualP2: string | null = null;
    let actualP3: string | null = null;

    if (sessionType === 'qualifying') {
        const qualiResults = await getQualifyingResults(season, round);
        if (!qualiResults || qualiResults.length === 0) throw new Error('No qualifying results available yet');
        actualPole = qualiResults[0]?.Driver.driverId || null;
    } else if (sessionType === 'sprint_qualifying') {
        const { results } = await getSprintResults(season, round);
        if (!results || results.length === 0) throw new Error('No sprint results available yet');

        // Jolpica does not currently expose dedicated sprint qualifying results;
        // use sprint grid P1 as the closest available pole indicator.
        const gridPole = results.find((r) => r.grid === '1');
        actualPole = (gridPole || results[0])?.Driver.driverId || null;
    } else if (sessionType === 'race') {
        const { results } = await getRaceResults(season, round);
        if (!results || results.length === 0) throw new Error('No race results available yet');
        actualP1 = results[0]?.Driver.driverId || null;
        actualP2 = results[1]?.Driver.driverId || null;
        actualP3 = results[2]?.Driver.driverId || null;
        try {
            const qualiResults = await getQualifyingResults(season, round);
            if (qualiResults.length > 0) {
                actualPole = qualiResults[0]?.Driver.driverId || null;
            }
        } catch { /* ignore */ }
    } else if (sessionType === 'sprint') {
        const { results } = await getSprintResults(season, round);
        if (!results || results.length === 0) throw new Error('No sprint results available yet');
        actualP1 = results[0]?.Driver.driverId || null;
        actualP2 = results[1]?.Driver.driverId || null;
        actualP3 = results[2]?.Driver.driverId || null;
    } else {
        throw new Error(`Unsupported session type: ${sessionType}`);
    }

    // Get all predictions + defaults
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
        const hasPole = sessionType === 'qualifying' || sessionType === 'sprint_qualifying';
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
        await admin.from('scoring_log').upsert({
            season: parseInt(season),
            round: parseInt(round),
            session_type: sessionType,
            status: 'provisional',
            scored_by: scoredBy || null,
            scored_count: 0,
            actual_pole: actualPole,
            actual_p1: actualP1,
            actual_p2: actualP2,
            actual_p3: actualP3,
        }, { onConflict: 'season,round,session_type' });

        return { scored: 0, results: { actualPole, actualP1, actualP2, actualP3 } };
    }

    const scoring = sessionType === 'sprint' || sessionType === 'sprint_qualifying'
        ? SPRINT_SCORING
        : RACE_SCORING;

    const scores = effectivePredictions.map(pred => {
        let polePoints = 0;
        let p1Points = 0;
        let p2Points = 0;
        let p3Points = 0;
        let bonusPoints = 0;

        if ((sessionType === 'qualifying' || sessionType === 'sprint_qualifying') && pred.pole_driver_id) {
            if (pred.pole_driver_id === actualPole) polePoints = scoring.pole;
        }
        if (sessionType === 'race' || sessionType === 'sprint') {
            if (pred.p1_driver_id && pred.p1_driver_id === actualP1) p1Points = scoring.p1;
            if (pred.p2_driver_id && pred.p2_driver_id === actualP2) p2Points = scoring.p2;
            if (pred.p3_driver_id && pred.p3_driver_id === actualP3) p3Points = scoring.p3;
            bonusPoints = scoreTop3(pred, actualP1, actualP2, actualP3, scoring.bonus);
        }

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

    const { error } = await admin
        .from('game_scores')
        .upsert(scores, { onConflict: 'user_id,season,round,session_type' });

    if (error) throw new Error(`Failed to save scores: ${error.message}`);

    await admin.from('scoring_log').upsert({
        season: parseInt(season),
        round: parseInt(round),
        session_type: sessionType,
        status: 'provisional',
        scored_by: scoredBy || null,
        scored_count: scores.length,
        actual_pole: actualPole,
        actual_p1: actualP1,
        actual_p2: actualP2,
        actual_p3: actualP3,
    }, { onConflict: 'season,round,session_type' });

    return { scored: scores.length, results: { actualPole, actualP1, actualP2, actualP3 } };
}
