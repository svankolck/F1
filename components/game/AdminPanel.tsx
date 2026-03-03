'use client';

import { useState, useEffect, useCallback } from 'react';
import { Race, GameSessionType } from '@/lib/types/f1';
import { FALLBACK_2026_DRIVERS } from '@/lib/api/game';

interface ScoringLogEntry {
    season: number;
    round: number;
    session_type: string;
    status: 'provisional' | 'official' | 'failed';
    scored_count: number;
    actual_pole: string | null;
    actual_p1: string | null;
    actual_p2: string | null;
    actual_p3: string | null;
    created_at: string;
    updated_at: string;
}

interface AdminPanelProps {
    season: number;
    races: Race[];
}

function getDriverCode(driverId: string | null): string {
    if (!driverId) return '—';
    const d = FALLBACK_2026_DRIVERS.find(d => d.driverId === driverId);
    return d?.code || driverId.slice(0, 3).toUpperCase();
}

function getStatusBadge(status: string) {
    switch (status) {
        case 'official': return { label: 'Official', color: 'bg-green-500/15 text-green-400 border-green-500/30' };
        case 'provisional': return { label: 'Provisional', color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' };
        case 'failed': return { label: 'Failed', color: 'bg-red-500/15 text-red-400 border-red-500/30' };
        default: return { label: 'Not scored', color: 'bg-white/5 text-f1-text-muted border-f1-border' };
    }
}

export default function AdminPanel({ season, races }: AdminPanelProps) {
    const [scoringLog, setScoringLog] = useState<ScoringLogEntry[]>([]);
    const [selectedRound, setSelectedRound] = useState<string>('');
    const [selectedSession, setSelectedSession] = useState<GameSessionType>('race');
    const [calculating, setCalculating] = useState(false);
    const [lastResult, setLastResult] = useState<string | null>(null);

    const loadScoringLog = useCallback(async () => {
        try {
            const res = await fetch(`/api/game/scoring-status?season=${season}`);
            if (res.ok) {
                const data = await res.json();
                setScoringLog(data);
            }
        } catch (err) {
            console.error('Failed to load scoring log:', err);
        }
    }, [season]);

    useEffect(() => { loadScoringLog(); }, [loadScoringLog]);

    const handleCalculate = async () => {
        if (!selectedRound || calculating) return;
        setCalculating(true);
        setLastResult(null);

        try {
            const res = await fetch('/api/game/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ season: String(season), round: selectedRound, sessionType: selectedSession }),
            });

            const data = await res.json();
            if (res.ok) {
                setLastResult(`✅ Scored ${data.scored} predictions | P1: ${getDriverCode(data.results.actualP1)}, P2: ${getDriverCode(data.results.actualP2)}, P3: ${getDriverCode(data.results.actualP3)}`);
                loadScoringLog();
            } else {
                setLastResult(`❌ ${data.error}`);
            }
        } catch {
            setLastResult('❌ Network error');
        } finally {
            setCalculating(false);
        }
    };

    const handleToggleStatus = async (entry: ScoringLogEntry) => {
        const newStatus = entry.status === 'official' ? 'provisional' : 'official';
        try {
            const res = await fetch('/api/game/calculate', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    season: entry.season,
                    round: entry.round,
                    sessionType: entry.session_type,
                    status: newStatus,
                }),
            });
            if (res.ok) loadScoringLog();
        } catch (err) {
            console.error('Failed to toggle status:', err);
        }
    };

    const getLogForRound = (round: number, sessionType: string) =>
        scoringLog.find(l => l.round === round && l.session_type === sessionType);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <span className="material-icons text-f1-red">admin_panel_settings</span>
                <h3 className="text-sm font-bold uppercase tracking-widest text-f1-text-muted">Admin Panel</h3>
            </div>

            {/* Calculate Scores */}
            <div className="glass-card p-4 border border-f1-border space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-f1-text-muted">Calculate Scores</h4>

                <div className="flex flex-wrap gap-3">
                    <select
                        value={selectedRound}
                        onChange={(e) => setSelectedRound(e.target.value)}
                        className="flex-1 min-w-[160px] px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-f1-red appearance-none cursor-pointer"
                        style={{ backgroundColor: '#1a1a2e', borderColor: '#2a2a3e', border: '1px solid #2a2a3e' }}
                    >
                        <option value="" style={{ backgroundColor: '#1a1a2e', color: '#999' }}>Select round...</option>
                        {races.map((race) => {
                            const log = getLogForRound(parseInt(race.round), selectedSession);
                            const badge = log ? ` [${log.status}]` : '';
                            return (
                                <option key={race.round} value={race.round} style={{ backgroundColor: '#1a1a2e', color: '#fff' }}>
                                    R{race.round}: {race.raceName}{badge}
                                </option>
                            );
                        })}
                    </select>

                    <select
                        value={selectedSession}
                        onChange={(e) => setSelectedSession(e.target.value as GameSessionType)}
                        className="px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-f1-red appearance-none cursor-pointer"
                        style={{ backgroundColor: '#1a1a2e', borderColor: '#2a2a3e', border: '1px solid #2a2a3e' }}
                    >
                        <option value="qualifying" style={{ backgroundColor: '#1a1a2e', color: '#fff' }}>Qualifying</option>
                        <option value="sprint_qualifying" style={{ backgroundColor: '#1a1a2e', color: '#fff' }}>Sprint Qualifying</option>
                        <option value="race" style={{ backgroundColor: '#1a1a2e', color: '#fff' }}>Race</option>
                        <option value="sprint" style={{ backgroundColor: '#1a1a2e', color: '#fff' }}>Sprint</option>
                    </select>

                    <button
                        onClick={handleCalculate}
                        disabled={!selectedRound || calculating}
                        className="px-6 py-2 bg-f1-red text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {calculating ? (
                            <span className="flex items-center gap-2">
                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Calculating...
                            </span>
                        ) : 'Calculate'}
                    </button>
                </div>

                {lastResult && (
                    <p className={`text-xs px-3 py-2 rounded-lg ${lastResult.startsWith('✅') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {lastResult}
                    </p>
                )}
            </div>

            {/* Scoring Log */}
            <div className="glass-card border border-f1-border overflow-hidden">
                <div className="px-4 py-3 border-b border-f1-border bg-white/[0.02]">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-f1-text-muted">
                        Season {season} Scoring Log
                    </h4>
                </div>

                {scoringLog.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-f1-text-muted text-center">
                        No rounds have been scored yet.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px]">
                            <thead className="bg-white/5">
                                <tr className="text-[10px] font-mono uppercase tracking-widest text-f1-text-muted">
                                    <th className="text-left py-2.5 px-3">Round</th>
                                    <th className="text-left py-2.5 px-3">Session</th>
                                    <th className="text-left py-2.5 px-3">Results</th>
                                    <th className="text-left py-2.5 px-3">Scored</th>
                                    <th className="text-left py-2.5 px-3">Status</th>
                                    <th className="text-left py-2.5 px-3">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {scoringLog.map((entry) => {
                                    const race = races.find(r => parseInt(r.round) === entry.round);
                                    const badge = getStatusBadge(entry.status);
                                    return (
                                        <tr key={`${entry.round}-${entry.session_type}`} className="border-b border-f1-border/30">
                                            <td className="py-2.5 px-3 text-xs font-mono">
                                                R{entry.round}
                                                {race && <span className="ml-1.5 text-f1-text-muted">{race.raceName}</span>}
                                            </td>
                                            <td className="py-2.5 px-3 text-xs uppercase">{entry.session_type}</td>
                                            <td className="py-2.5 px-3 text-xs font-mono">
                                                {entry.actual_pole && <span className="text-f1-text-muted mr-2">PP: {getDriverCode(entry.actual_pole)}</span>}
                                                P1: {getDriverCode(entry.actual_p1)}{' '}
                                                P2: {getDriverCode(entry.actual_p2)}{' '}
                                                P3: {getDriverCode(entry.actual_p3)}
                                            </td>
                                            <td className="py-2.5 px-3 text-xs font-mono">{entry.scored_count} users</td>
                                            <td className="py-2.5 px-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badge.color}`}>
                                                    {badge.label}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-3">
                                                <button
                                                    onClick={() => handleToggleStatus(entry)}
                                                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-white/5 border border-f1-border text-f1-text-secondary hover:text-white hover:border-white/20 transition-colors"
                                                >
                                                    {entry.status === 'official' ? 'Revert' : 'Mark Official'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
