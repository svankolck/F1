'use client';

import { useCallback, useEffect, useState } from 'react';
import { OpenF1Session } from '@/lib/types/f1';
import { TimingResponse } from '@/lib/api/timing';
import SessionSelector from './SessionSelector';
import LiveTimingTable from './LiveTimingTable';

interface TimingClientProps {
    initialData: TimingResponse;
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

        const tick = () => {
            const diff = new Date(targetDate).getTime() - Date.now();
            if (diff <= 0) {
                setValue('Starting now');
                return;
            }
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const mins = Math.floor((diff / (1000 * 60)) % 60);
            setValue(`${days}d ${hours}h ${mins}m`);
        };

        tick();
        const timer = setInterval(tick, 60000); // Update every minute
        return () => clearInterval(timer);
    }, [targetDate]);

    return value;
}

export default function TimingClient({ initialData }: TimingClientProps) {
    const [data, setData] = useState<TimingResponse>(initialData);
    const [loading, setLoading] = useState(false);
    const [selectedSessionKey, setSelectedSessionKey] = useState<number | null>(
        initialData.session?.session_key || null
    );

    const refresh = useCallback(async (sessionKey?: number | null) => {
        setLoading(true);
        try {
            const query = sessionKey ? `?sessionKey=${sessionKey}` : '';
            const res = await fetch(`/api/timing${query}`);
            if (!res.ok) throw new Error('Failed to refresh timing data');
            const payload: TimingResponse = await res.json();
            setData(payload);
            setSelectedSessionKey(payload.session?.session_key || null);
        } catch (error) {
            console.error('Timing refresh failed:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSelectSession = useCallback(
        (sessionKey: number) => {
            setSelectedSessionKey(sessionKey);
            refresh(sessionKey);
        },
        [refresh]
    );

    // Auto-refresh: 8s when live, 60s when idle
    useEffect(() => {
        const interval = data.mode === 'live' ? 8000 : 60000;
        const timer = setInterval(() => {
            refresh(selectedSessionKey);
        }, interval);
        return () => clearInterval(timer);
    }, [data.mode, refresh, selectedSessionKey]);

    const countdown = useCountdown(data.nextSession?.date_start || null);

    return (
        <div className="flex flex-col gap-5 w-full">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                    <span
                        className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest ${data.mode === 'live'
                                ? 'bg-red-500/10 border-red-400/30 text-red-300 animate-pulse'
                                : 'bg-white/5 border-f1-border text-f1-text-muted'
                            }`}
                    >
                        {data.mode === 'live' ? '● Live' : 'Latest Session'}
                    </span>
                    {loading && (
                        <span className="text-[10px] text-f1-text-muted font-mono uppercase tracking-widest">
                            Refreshing…
                        </span>
                    )}
                </div>

                <h1 className="text-2xl md:text-4xl font-bold uppercase tracking-tight">
                    Live Timing
                </h1>
                <p className="text-sm text-f1-text-secondary">
                    {formatSessionLabel(data.session)}
                </p>

                {data.mode === 'idle' && data.nextSession && (
                    <p className="text-xs text-f1-text-muted">
                        Next session: {data.nextSession.country_name}{' '}
                        {data.nextSession.session_name} in {countdown}.
                    </p>
                )}
            </div>

            {/* Session Selector */}
            <SessionSelector
                sessions={data.weekendSessions}
                selectedSessionKey={selectedSessionKey}
                onSelectSession={handleSelectSession}
            />

            {/* Timing Table */}
            {data.rows.length > 0 ? (
                <LiveTimingTable rows={data.rows} />
            ) : (
                <div className="glass-card p-8 text-center border border-f1-border">
                    <span className="material-icons text-3xl text-f1-text-muted mb-2 block">
                        timer_off
                    </span>
                    <p className="text-f1-text-secondary">
                        Timing data currently not available.
                    </p>
                </div>
            )}
        </div>
    );
}
