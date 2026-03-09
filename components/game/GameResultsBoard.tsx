'use client';

import Image from 'next/image';
import { GameDriver } from '@/lib/types/f1';

interface SessionSummary {
    sessionType: string;
    label: string;
    status: string;
    actualPole: string | null;
    actualP1: string | null;
    actualP2: string | null;
    actualP3: string | null;
}

interface UserSessionResult {
    sessionType: string;
    label: string;
    totalPoints: number;
    polePoints: number;
    p1Points: number;
    p2Points: number;
    p3Points: number;
    bonusPoints: number;
    prediction: {
        pole_driver_id: string | null;
        p1_driver_id: string | null;
        p2_driver_id: string | null;
        p3_driver_id: string | null;
    };
    usedDefaults: boolean;
}

interface UserRoundResult {
    userId: string;
    username: string;
    avatarUrl?: string;
    totalPoints: number;
    results: UserSessionResult[];
}

interface GameResultsBoardProps {
    entries: UserRoundResult[];
    sessions: SessionSummary[];
    drivers: GameDriver[];
}

function getStatusBadge(status: string) {
    switch (status) {
        case 'official':
            return 'bg-green-500/15 text-green-400 border-green-500/30';
        case 'provisional':
            return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
        case 'failed':
            return 'bg-red-500/15 text-red-400 border-red-500/30';
        default:
            return 'bg-white/5 text-f1-text-muted border-f1-border';
    }
}

export default function GameResultsBoard({ entries, sessions, drivers }: GameResultsBoardProps) {
    const driverMap = new Map(drivers.map((driver) => [driver.driverId, driver]));
    const sessionMap = new Map(sessions.map((session) => [session.sessionType, session]));

    const getDriverCode = (driverId: string | null) => {
        if (!driverId) return '—';
        return driverMap.get(driverId)?.code || driverId.slice(0, 3).toUpperCase();
    };

    if (!entries.length) {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
                <span className="material-icons text-4xl text-f1-text-muted">fact_check</span>
                <p className="text-f1-text-muted text-sm">No scored results for this round yet</p>
            </div>
        );
    }

    const renderCombinedBlock = (
        entry: UserRoundResult,
        title: string,
        badgePrefix: string,
        poleSessionType: string,
        raceSessionType: string,
    ) => {
        const poleResult = entry.results.find((result) => result.sessionType === poleSessionType);
        const raceResult = entry.results.find((result) => result.sessionType === raceSessionType);

        if (!poleResult && !raceResult) return null;

        const poleSummary = sessionMap.get(poleSessionType);
        const raceSummary = sessionMap.get(raceSessionType);
        const totalPoints = (poleResult?.totalPoints || 0) + (raceResult?.totalPoints || 0);
        const usedDefaults = Boolean(poleResult?.usedDefaults || raceResult?.usedDefaults);

        const cells = [
            {
                label: 'Pole',
                driverId: poleResult?.prediction.pole_driver_id || null,
                points: poleResult?.polePoints || 0,
                actual: poleSummary?.actualPole || null,
            },
            {
                label: 'P1',
                driverId: raceResult?.prediction.p1_driver_id || null,
                points: raceResult?.p1Points || 0,
                actual: raceSummary?.actualP1 || null,
            },
            {
                label: 'P2',
                driverId: raceResult?.prediction.p2_driver_id || null,
                points: raceResult?.p2Points || 0,
                actual: raceSummary?.actualP2 || null,
            },
            {
                label: 'P3',
                driverId: raceResult?.prediction.p3_driver_id || null,
                points: raceResult?.p3Points || 0,
                actual: raceSummary?.actualP3 || null,
            },
        ];

        return (
            <div className="rounded-xl border border-f1-border/35 bg-white/[0.02] p-3 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-white">{title}</h4>
                        {poleSummary && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(poleSummary.status)}`}>
                                {badgePrefix}Q {poleSummary.status}
                            </span>
                        )}
                        {raceSummary && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(raceSummary.status)}`}>
                                {badgePrefix}R {raceSummary.status}
                            </span>
                        )}
                        {usedDefaults && (
                            <span className="text-[10px] uppercase tracking-wider text-f1-text-muted">
                                default picks used
                            </span>
                        )}
                    </div>

                    <div className="text-sm font-mono font-bold text-f1-red">
                        {totalPoints} pts
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {cells.map((cell) => (
                        <div key={`${title}-${cell.label}`} className="rounded-lg border border-f1-border/25 bg-f1-surface/15 px-2.5 py-2">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-[10px] uppercase tracking-wider text-f1-text-muted">{cell.label}</p>
                                <p className="text-[11px] font-mono text-f1-text-muted">{getDriverCode(cell.actual)}</p>
                            </div>
                            <p className="text-base font-bold mt-1">{getDriverCode(cell.driverId)}</p>
                            <p className="text-[11px] text-f1-red mt-1">+{cell.points}</p>
                        </div>
                    ))}
                </div>

                {!!raceResult?.bonusPoints && (
                    <div className="flex items-center justify-between rounded-lg border border-f1-border/20 bg-f1-surface/10 px-2.5 py-2">
                        <span className="text-[10px] uppercase tracking-wider text-f1-text-muted">Bonus Top 3</span>
                        <span className="text-[11px] font-bold text-f1-red">+{raceResult.bonusPoints}</span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-f1-text-muted">Round Results</h3>
                <p className="text-xs text-f1-text-muted mt-1">Predictions and points breakdown per player for the selected round.</p>
            </div>

            <div className="space-y-3">
                {entries.map((entry, index) => (
                    <div key={entry.userId} className="glass-card p-3 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-7 text-center text-sm font-mono font-bold text-f1-text-muted">
                                    {index + 1}
                                </div>
                                <div className="w-9 h-9 rounded-full overflow-hidden bg-f1-surface border border-f1-border flex-shrink-0">
                                    {entry.avatarUrl ? (
                                        <Image src={entry.avatarUrl} alt="" width={36} height={36} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-sm font-bold text-f1-text-muted">
                                            {entry.username.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[15px] font-bold truncate">{entry.username}</p>
                                    <p className="text-[11px] uppercase tracking-wider text-f1-text-muted">
                                        {entry.results.length} scored {entry.results.length === 1 ? 'session' : 'sessions'}
                                    </p>
                                </div>
                            </div>

                            <div className="text-right">
                                <p className="text-xl font-bold font-mono text-white">{entry.totalPoints}</p>
                                <p className="text-[11px] uppercase tracking-wider text-f1-text-muted">round points</p>
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            {renderCombinedBlock(entry, 'Grand Prix', '', 'qualifying', 'race')}
                            {renderCombinedBlock(entry, 'Sprint Weekend', 'S', 'sprint_qualifying', 'sprint')}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
