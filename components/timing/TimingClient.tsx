'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { OpenF1Session } from '@/lib/types/f1';
import { TimingBootstrap, TimingSnapshot } from '@/lib/api/timing';
import SessionSelector from './SessionSelector';
import LiveTimingTable from './LiveTimingTable';
import QualifyingView from './QualifyingView';
import TrackMap from './TrackMap';
import TimelinePlayer from './TimelinePlayer';
import { useReplayEngine } from './hooks/useReplayEngine';

interface TimingClientProps {
    initialData: TimingBootstrap;
}

function formatSessionLabel(session: OpenF1Session | null): string {
    if (!session) return 'No session';
    const date = new Date(session.date_start);
    const dateLabel = date.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Amsterdam',
    });
    return `${session.country_name} • ${session.session_name} • ${dateLabel}`;
}

function useCountdown(targetDate: string | null): string {
    const [value, setValue] = useState('—');

    useEffect(() => {
        if (!targetDate) {
            setValue('—');
            return;
        }

        const timer = setInterval(() => {
            const diff = new Date(targetDate).getTime() - Date.now();
            if (diff <= 0) {
                setValue('Starting now');
                return;
            }
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const mins = Math.floor((diff / (1000 * 60)) % 60);
            setValue(`${days}d ${hours}h ${mins}m`);
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    return value;
}

export default function TimingClient({ initialData }: TimingClientProps) {
    const [data, setData] = useState<TimingBootstrap>(initialData);
    const [loading, setLoading] = useState(false);
    const [selectedSessionKey, setSelectedSessionKey] = useState<number | null>(initialData.selectedSession?.session_key || null);

    // Replay state
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentLap, setCurrentLap] = useState(1);

    const refresh = useCallback(async (sessionKey?: number | null) => {
        setLoading(true);
        try {
            const query = sessionKey ? `?sessionKey=${sessionKey}` : '';
            const res = await fetch(`/api/timing${query}`);
            if (!res.ok) throw new Error('Failed to refresh timing data');
            const payload: TimingBootstrap = await res.json();
            setData(payload);
            setSelectedSessionKey(payload.selectedSession?.session_key || null);
            setCurrentLap(1);
            setIsPlaying(false);
        } catch (error) {
            console.error('Timing refresh failed:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSelectSession = useCallback((sessionKey: number) => {
        setSelectedSessionKey(sessionKey);
        refresh(sessionKey);
    }, [refresh]);

    useEffect(() => {
        const interval = data.mode === 'live' ? 7000 : 15000;
        const timer = setInterval(() => {
            refresh(selectedSessionKey);
        }, interval);
        return () => clearInterval(timer);
    }, [data.mode, refresh, selectedSessionKey]);

    const selectedSession = data.selectedSession;

    // Compute max lap for replay
    const maxLap = useMemo(() => {
        if (!data.replayData) return 1;
        let max = 1;
        data.replayData.laps.forEach(l => { if (l.lap_number > max) max = l.lap_number; });
        return max;
    }, [data.replayData]);

    const replaySnapshot = useReplayEngine(data.replayData, currentLap);
    const snapshot: TimingSnapshot | null = data.mode === 'replay' && replaySnapshot ? replaySnapshot : data.snapshot;

    const isQualifying = selectedSession?.session_type === 'Qualifying';
    const countdown = useCountdown(data.nextSession?.date_start || null);

    const raceControlLines = useMemo(() => snapshot?.raceControl || [], [snapshot]);

    return (
        <div className="flex flex-col gap-5 w-full">
            <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest ${data.mode === 'live' ? 'bg-red-500/10 border-red-400/30 text-red-300 animate-pulse' : 'bg-amber-500/10 border-amber-400/30 text-amber-300'}`}>
                        {data.mode === 'live' ? 'Live Weekend' : 'Replay Mode'}
                    </span>
                    {loading && <span className="text-[10px] text-f1-text-muted font-mono uppercase tracking-widest">Refreshing…</span>}
                </div>

                <h1 className="text-2xl md:text-4xl font-bold uppercase tracking-tight">Live Timing</h1>
                <p className="text-sm text-f1-text-secondary">{formatSessionLabel(selectedSession)}</p>

                {data.mode === 'replay' && data.replaySession && (
                    <p className="text-xs text-f1-text-muted">
                        No live weekend active. Default replay on last race: {data.replaySession.country_name} ({new Date(data.replaySession.date_start).toLocaleDateString('en-GB')}).
                    </p>
                )}

                {!data.liveSession && data.nextSession && (
                    <p className="text-xs text-f1-text-muted">
                        Next session: {data.nextSession.country_name} {data.nextSession.session_name} in {countdown}.
                    </p>
                )}
            </div>

            <SessionSelector
                sessions={data.weekendSessions}
                selectedSessionKey={selectedSessionKey}
                onSelectSession={handleSelectSession}
            />

            {snapshot && (
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 items-start">
                    <div className="xl:col-span-3">
                        {isQualifying ? (
                            <QualifyingView rows={snapshot.rows} />
                        ) : (
                            <LiveTimingTable rows={snapshot.rows} />
                        )}

                        {data.mode === 'replay' && maxLap > 1 && (
                            <TimelinePlayer
                                currentLap={currentLap}
                                maxLap={maxLap}
                                isPlaying={isPlaying}
                                onTogglePlay={() => setIsPlaying(!isPlaying)}
                                onChangeLap={setCurrentLap}
                                sessionName={selectedSession?.country_name}
                            />
                        )}
                    </div>
                    <div className="xl:col-span-1">
                        <TrackMap rows={snapshot.rows} session={selectedSession} />
                        <div className="glass-card border border-f1-border p-3 mt-4">
                            <h3 className="text-xs font-mono text-f1-red uppercase tracking-widest mb-2">Race Control</h3>
                            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                                {raceControlLines.length === 0 && (
                                    <p className="text-xs text-f1-text-muted">No messages.</p>
                                )}
                                {raceControlLines.map((line, idx) => (
                                    <div key={`${line.date}-${idx}`} className="text-xs border-l-2 border-f1-border pl-2">
                                        <p className="text-f1-text-secondary font-mono">{new Date(line.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                                        <p className="text-white/90">{line.message}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!snapshot && (
                <div className="glass-card p-8 text-center border border-f1-border">
                    <span className="material-icons text-3xl text-f1-text-muted mb-2 block">timer_off</span>
                    <p className="text-f1-text-secondary">Timing data currently not available.</p>
                </div>
            )}
        </div>
    );
}
