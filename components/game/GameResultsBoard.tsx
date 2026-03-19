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

    const formatPoints = (points: number) => `${points > 0 ? '+' : ''}${points}`;

    const getPickTone = (points: number, predictedDriverId: string | null, actualDriverId: string | null) => {
        if (predictedDriverId && actualDriverId && predictedDriverId === actualDriverId) {
            return 'border-f1-red/45 bg-f1-red/10 text-white shadow-[0_0_20px_rgba(225,6,0,0.08)]';
        }

        if (points > 0) {
            return 'border-orange-400/25 bg-orange-500/10 text-white';
        }

        return 'border-f1-border/25 bg-f1-surface/15 text-white';
    };

    if (!entries.length) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
                <span className="material-icons text-4xl text-f1-text-muted">fact_check</span>
                <p className="text-sm text-f1-text-muted">No scored results for this round yet</p>
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
            <div className="rounded-xl border border-f1-border/30 bg-white/[0.03] px-2.5 py-2 xl:flex-1">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">{title}</h4>
                        {poleSummary && (
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getStatusBadge(poleSummary.status)}`}>
                                {badgePrefix}Q {poleSummary.status}
                            </span>
                        )}
                        {raceSummary && (
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getStatusBadge(raceSummary.status)}`}>
                                {badgePrefix}R {raceSummary.status}
                            </span>
                        )}
                        {usedDefaults && (
                            <span className="rounded-full border border-f1-border/20 bg-white/[0.04] px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-f1-text-muted">
                                default picks used
                            </span>
                        )}
                    </div>

                    <div className="rounded-full border border-f1-red/20 bg-f1-red/10 px-2 py-0.5 text-[10px] font-mono font-bold text-f1-red">
                        {totalPoints} pts
                    </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                    {cells.map((cell) => (
                        <div
                            key={`${title}-${cell.label}`}
                            className={`min-w-[104px] flex-1 rounded-lg border px-2 py-1.5 ${getPickTone(cell.points, cell.driverId, cell.actual)}`}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-[9px] uppercase tracking-[0.18em] text-f1-text-muted">{cell.label}</p>
                                <p className="text-[10px] font-mono text-f1-text-muted">{getDriverCode(cell.actual)}</p>
                            </div>
                            <div className="mt-1 flex items-end justify-between gap-2">
                                <p className="text-[13px] font-bold leading-none">{getDriverCode(cell.driverId)}</p>
                                <p className={`text-[10px] font-mono font-bold leading-none ${cell.points > 0 ? 'text-f1-red' : 'text-f1-text-muted'}`}>
                                    {formatPoints(cell.points)}
                                </p>
                            </div>
                        </div>
                    ))}

                    {!!raceResult?.bonusPoints && (
                        <div className="flex min-w-[116px] flex-1 items-center justify-between rounded-lg border border-f1-red/20 bg-f1-red/10 px-2 py-1.5">
                            <span className="text-[9px] uppercase tracking-[0.18em] text-f1-text-muted">Bonus Top 3</span>
                            <span className="text-[10px] font-mono font-bold text-f1-red">{formatPoints(raceResult.bonusPoints)}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-f1-text-muted">Round Results</h3>
                <p className="mt-1 text-xs text-f1-text-muted">Predictions and points breakdown per player for the selected round.</p>
            </div>

            <div className="space-y-2.5">
                {entries.map((entry, index) => (
                    <div key={entry.userId} className="glass-card px-3 py-2.5">
                        <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center">
                            <div className="flex min-w-0 items-center gap-2.5 xl:w-[220px] xl:flex-none">
                                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-f1-border/30 bg-white/[0.04] text-[11px] font-mono font-bold text-f1-text-muted">
                                    {index + 1}
                                </div>
                                <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border border-f1-border/70 bg-f1-surface">
                                    {entry.avatarUrl ? (
                                        <Image src={entry.avatarUrl} alt="" width={32} height={32} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-xs font-bold text-f1-text-muted">
                                            {entry.username.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-bold">{entry.username}</p>
                                    <p className="text-[10px] uppercase tracking-[0.18em] text-f1-text-muted">
                                        {entry.results.length} scored {entry.results.length === 1 ? 'session' : 'sessions'}
                                    </p>
                                </div>

                                <div className="ml-auto text-right xl:hidden">
                                    <p className="text-lg font-bold font-mono leading-none text-white">{entry.totalPoints}</p>
                                    <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-f1-text-muted">round pts</p>
                                </div>
                            </div>

                            <div className="min-w-0 flex-1 space-y-2 xl:flex xl:items-stretch xl:gap-2 xl:space-y-0">
                                {renderCombinedBlock(entry, 'Grand Prix', '', 'qualifying', 'race')}
                                {renderCombinedBlock(entry, 'Sprint Weekend', 'S', 'sprint_qualifying', 'sprint')}
                            </div>

                            <div className="hidden xl:flex xl:w-[92px] xl:flex-none xl:flex-col xl:items-end xl:justify-center xl:border-l xl:border-f1-border/20 xl:pl-3 xl:text-right">
                                <p className="text-2xl font-bold font-mono leading-none text-white">{entry.totalPoints}</p>
                                <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-f1-text-muted">round pts</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
