'use client';

import { Prediction, GameDriver, GameScore, RACE_SCORING, SPRINT_SCORING } from '@/lib/types/f1';

interface PredictionReviewProps {
    prediction: Prediction;
    drivers: GameDriver[];
    score?: GameScore | null;
    actualResults?: {
        pole?: string;
        p1?: string;
        p2?: string;
        p3?: string;
    };
}

export default function PredictionReview({ prediction, drivers, score, actualResults }: PredictionReviewProps) {
    const findDriver = (id: string | null) => drivers.find(d => d.driverId === id);
    const isSprint = prediction.session_type === 'sprint' || prediction.session_type === 'sprint_qualifying';
    const scoring = isSprint ? SPRINT_SCORING : RACE_SCORING;
    const hasPole = prediction.session_type === 'qualifying' || prediction.session_type === 'sprint_qualifying';

    const slots = [
        ...(hasPole ? [{ key: 'pole', label: 'Pole', predicted: prediction.pole_driver_id, actual: actualResults?.pole, points: score?.pole_points, maxPoints: scoring.pole }] : []),
        { key: 'p1', label: 'P1', predicted: prediction.p1_driver_id, actual: actualResults?.p1, points: score?.p1_points, maxPoints: scoring.p1 },
        { key: 'p2', label: 'P2', predicted: prediction.p2_driver_id, actual: actualResults?.p2, points: score?.p2_points, maxPoints: scoring.p2 },
        { key: 'p3', label: 'P3', predicted: prediction.p3_driver_id, actual: actualResults?.p3, points: score?.p3_points, maxPoints: scoring.p3 },
    ];

    return (
        <div className="space-y-2">
            {slots.map(slot => {
                const predictedDriver = findDriver(slot.predicted);
                const isCorrect = slot.predicted && slot.predicted === slot.actual;
                const earnedPoints = slot.points || 0;

                return (
                    <div
                        key={slot.key}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all
                            ${isCorrect
                                ? 'border-green-500/30 bg-green-500/5'
                                : earnedPoints > 0
                                    ? 'border-yellow-500/30 bg-yellow-500/5'
                                    : 'border-f1-border/20 bg-f1-surface/20'
                            }`}
                    >
                        {/* Position label */}
                        <span className="text-xs font-mono font-bold text-f1-text-muted w-10">
                            {slot.label}
                        </span>

                        {/* Predicted driver */}
                        {predictedDriver ? (
                            <div className="flex items-center gap-2 flex-grow">
                                <div className="w-6 h-6 rounded-full overflow-hidden bg-f1-surface border" style={{ borderColor: predictedDriver.teamColor }}>
                                    {predictedDriver.headshotUrl ? (
                                        <img src={predictedDriver.headshotUrl} alt="" className="w-full h-full object-cover object-top" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[8px] font-bold">{predictedDriver.code}</div>
                                    )}
                                </div>
                                <span className="text-sm font-bold" style={{ color: predictedDriver.teamColor }}>
                                    {predictedDriver.code}
                                </span>
                            </div>
                        ) : (
                            <span className="text-xs text-f1-text-muted flex-grow">Niet ingevuld</span>
                        )}

                        {/* Result indicator */}
                        {actualResults && (
                            <div className="flex items-center gap-1">
                                {isCorrect ? (
                                    <span className="material-icons text-green-500 text-sm">check_circle</span>
                                ) : earnedPoints > 0 ? (
                                    <span className="material-icons text-yellow-500 text-sm">swap_horiz</span>
                                ) : (
                                    <span className="material-icons text-f1-text-muted text-sm">cancel</span>
                                )}
                                <span className={`text-xs font-mono font-bold
                                    ${isCorrect ? 'text-green-400' : earnedPoints > 0 ? 'text-yellow-400' : 'text-f1-text-muted'}
                                `}>
                                    {earnedPoints}/{slot.maxPoints}
                                </span>
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Bonus points */}
            {score && score.bonus_points > 0 && (
                <div className="flex items-center justify-between p-3 rounded-xl border border-blue-500/30 bg-blue-500/5">
                    <span className="text-xs font-bold text-blue-400">Bonus (juiste coureur, andere positie)</span>
                    <span className="text-xs font-mono font-bold text-blue-400">+{score.bonus_points}pt</span>
                </div>
            )}

            {/* Total */}
            {score && (
                <div className="flex items-center justify-between p-3 rounded-xl border border-f1-red/30 bg-f1-red/5">
                    <span className="text-sm font-bold">Totaal</span>
                    <span className="text-lg font-mono font-bold text-f1-red">{score.total_points}pt</span>
                </div>
            )}
        </div>
    );
}
