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

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-f1-text-muted">Round Results</h3>
                <p className="text-xs text-f1-text-muted mt-1">Predictions and points breakdown per player for the selected round.</p>
            </div>

            <div className="space-y-3">
                {entries.map((entry, index) => (
                    <div key={entry.userId} className="glass-card p-4 space-y-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 text-center text-sm font-mono font-bold text-f1-text-muted">
                                    {index + 1}
                                </div>
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-f1-surface border border-f1-border flex-shrink-0">
                                    {entry.avatarUrl ? (
                                        <Image src={entry.avatarUrl} alt="" width={40} height={40} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-sm font-bold text-f1-text-muted">
                                            {entry.username.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-base font-bold truncate">{entry.username}</p>
                                    <p className="text-[11px] uppercase tracking-wider text-f1-text-muted">
                                        {entry.results.length} scored {entry.results.length === 1 ? 'session' : 'sessions'}
                                    </p>
                                </div>
                            </div>

                            <div className="text-right">
                                <p className="text-2xl font-bold font-mono text-white">{entry.totalPoints}</p>
                                <p className="text-[11px] uppercase tracking-wider text-f1-text-muted">round points</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {entry.results.map((result) => {
                                const session = sessionMap.get(result.sessionType);
                                const badgeClass = getStatusBadge(session?.status || 'unknown');

                                return (
                                    <div key={`${entry.userId}-${result.sessionType}`} className="rounded-xl border border-f1-border/40 bg-white/[0.02] p-3 space-y-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-xs font-bold uppercase tracking-wider">{result.label}</h4>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badgeClass}`}>
                                                    {session?.status || 'unknown'}
                                                </span>
                                                {result.usedDefaults && (
                                                    <span className="text-[10px] uppercase tracking-wider text-f1-text-muted">
                                                        default picks
                                                    </span>
                                                )}
                                            </div>

                                            <div className="text-sm font-mono font-bold text-f1-red">
                                                {result.totalPoints} pts
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                            <div className="rounded-lg border border-f1-border/30 bg-f1-surface/20 px-2.5 py-2">
                                                <p className="text-[10px] uppercase tracking-wider text-f1-text-muted">Pole</p>
                                                <p className="text-sm font-bold mt-1">{getDriverCode(result.prediction.pole_driver_id)}</p>
                                                <p className="text-[11px] text-f1-red mt-1">+{result.polePoints}</p>
                                            </div>
                                            <div className="rounded-lg border border-f1-border/30 bg-f1-surface/20 px-2.5 py-2">
                                                <p className="text-[10px] uppercase tracking-wider text-f1-text-muted">P1</p>
                                                <p className="text-sm font-bold mt-1">{getDriverCode(result.prediction.p1_driver_id)}</p>
                                                <p className="text-[11px] text-f1-red mt-1">+{result.p1Points}</p>
                                            </div>
                                            <div className="rounded-lg border border-f1-border/30 bg-f1-surface/20 px-2.5 py-2">
                                                <p className="text-[10px] uppercase tracking-wider text-f1-text-muted">P2</p>
                                                <p className="text-sm font-bold mt-1">{getDriverCode(result.prediction.p2_driver_id)}</p>
                                                <p className="text-[11px] text-f1-red mt-1">+{result.p2Points}</p>
                                            </div>
                                            <div className="rounded-lg border border-f1-border/30 bg-f1-surface/20 px-2.5 py-2">
                                                <p className="text-[10px] uppercase tracking-wider text-f1-text-muted">P3</p>
                                                <p className="text-sm font-bold mt-1">{getDriverCode(result.prediction.p3_driver_id)}</p>
                                                <p className="text-[11px] text-f1-red mt-1">+{result.p3Points}</p>
                                            </div>
                                            <div className="rounded-lg border border-f1-border/30 bg-f1-surface/20 px-2.5 py-2">
                                                <p className="text-[10px] uppercase tracking-wider text-f1-text-muted">Bonus</p>
                                                <p className="text-sm font-bold mt-1">Top 3</p>
                                                <p className="text-[11px] text-f1-red mt-1">+{result.bonusPoints}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-f1-text-muted font-mono">
                                            <div>ACTUAL POLE: {getDriverCode(session?.actualPole || null)}</div>
                                            <div>ACTUAL P1: {getDriverCode(session?.actualP1 || null)}</div>
                                            <div>ACTUAL P2: {getDriverCode(session?.actualP2 || null)}</div>
                                            <div>ACTUAL P3: {getDriverCode(session?.actualP3 || null)}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
