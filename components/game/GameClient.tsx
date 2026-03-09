'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { GameDriver, WeekendSchedule, Prediction, GameSessionType, Race, getFlagUrl } from '@/lib/types/f1';
import RoundSlider from '@/components/standings/RoundSlider';
import GameLeaderboard from './GameLeaderboard';
import GamePointsChart from './GamePointsChart';
import AdminPanel from './AdminPanel';
import WeekendSessionsBoard from './WeekendSessionsBoard';

interface GameClientProps {
    initialSchedule: WeekendSchedule | null;
    initialDrivers: GameDriver[];
    initialRaces: Race[];
    initialPredictions?: Record<GameSessionType, Prediction | null>;
    isAdmin?: boolean;
}

type TabType = 'prediction' | 'stand' | 'admin';

export default function GameClient({ initialSchedule, initialDrivers, initialRaces, initialPredictions, isAdmin }: GameClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const supabase = useMemo(() => createClient(), []);
    const [activeTab, setActiveTab] = useState<TabType>('prediction');
    const [schedule, setSchedule] = useState<WeekendSchedule | null>(initialSchedule);
    const [drivers] = useState<GameDriver[]>(initialDrivers);
    const [activeRound, setActiveRound] = useState<string>(searchParams.get('round') || initialSchedule?.round.toString() || '1');
    const [isLoading, setIsLoading] = useState(false);

    // Build country flag map
    const countryFlags: Record<string, string> = {};
    initialRaces.forEach((race) => {
        countryFlags[race.Circuit.Location.country] = getFlagUrl(race.Circuit.Location.country);
    });

    const emptyPredictions: Record<GameSessionType, Prediction | null> = {
        qualifying: null, race: null, sprint_qualifying: null, sprint: null,
    };

    const [predictions, setPredictions] = useState<Record<GameSessionType, Prediction | null>>(initialPredictions || emptyPredictions);

    const [leaderboardData, setLeaderboardData] = useState<Array<{
        userId: string;
        username: string;
        avatarUrl?: string;
        totalPoints: number;
        raceCount: number;
        scores: never[];
    }>>([]);
    const [chartData, setChartData] = useState<Array<{
        round: number;
        raceName: string;
        points: number;
        cumulative: number;
    }>>([]);

    const loadLeaderboard = useCallback(async () => {
        if (!schedule) return;

        const { data: scores } = await supabase
            .from('game_scores')
            .select('user_id, total_points, season, round, session_type')
            .eq('season', schedule.season);

        if (!scores || scores.length === 0) {
            setLeaderboardData([]);
            setChartData([]);
            return;
        }

        const userMap = new Map<string, { total: number; rounds: Set<number> }>();
        for (const s of scores) {
            const existing = userMap.get(s.user_id) || { total: 0, rounds: new Set<number>() };
            existing.total += s.total_points;
            existing.rounds.add(s.round);
            userMap.set(s.user_id, existing);
        }

        const userIds = Array.from(userMap.keys());
        const { data: profiles } = await supabase
            .from('public_profiles')
            .select('id, username')
            .in('id', userIds);

        const entries = Array.from(userMap.entries()).map(([userId, data]) => {
            const profile = profiles?.find(p => p.id === userId);
            return {
                userId,
                username: profile?.username || 'Unknown',
                avatarUrl: undefined,
                totalPoints: data.total,
                raceCount: data.rounds.size,
                scores: [] as never[],
            };
        });

        setLeaderboardData(entries);

        if (!user) {
            setChartData([]);
            return;
        }

        const userScores = scores
            .filter(s => s.user_id === user.id)
            .sort((a, b) => a.round - b.round);

        const byRound = new Map<number, number>();
        for (const score of userScores) {
            byRound.set(score.round, (byRound.get(score.round) || 0) + score.total_points);
        }

        let cumulative = 0;
        const chart = Array.from(byRound.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([round, points]) => {
                cumulative += points;
                return {
                    round,
                    raceName: `R${round}`,
                    points,
                    cumulative,
                };
            });
        setChartData(chart);
    }, [schedule, supabase, user]);

    // Load predictions for a specific round via server-side API (avoids RLS issues with client-side Supabase)
    const loadPredictionsForRound = async (season: number, round: number) => {
        console.log('[GameClient] Loading predictions for round', round, 'season', season);
        try {
            const res = await fetch(`/api/game/predictions/load?season=${season}&round=${round}`);
            if (!res.ok) {
                console.error('[GameClient] Prediction load API returned', res.status);
                return;
            }
            const preds = await res.json();
            console.log('[GameClient] Loaded predictions for round', round, preds);
            setPredictions(preds);
        } catch (error) {
            console.error('[GameClient] Failed to load predictions:', error);
        }
    };

    // Initial load fallback: if no initialPredictions from SSR
    useEffect(() => {
        if (!user || !schedule) return;
        if (initialPredictions && Object.values(initialPredictions).some(Boolean)) return;
        loadPredictionsForRound(schedule.season, schedule.round);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    useEffect(() => {
        loadLeaderboard();
    }, [loadLeaderboard]);

    useEffect(() => {
        if (activeTab !== 'stand') return;
        loadLeaderboard();
    }, [activeTab, loadLeaderboard]);

    const handleRoundSelect = async (round: string, updateUrl: boolean = true) => {
        if (round === activeRound || isLoading) return;
        setIsLoading(true);
        setActiveRound(round);

        // IMMEDIATELY clear predictions so old round data doesn't persist
        setPredictions({ ...emptyPredictions });

        try {
            const season = initialSchedule?.season || new Date().getFullYear();
            if (updateUrl) {
                router.replace(`/game?round=${round}`, { scroll: false });
            }

            const res = await fetch(`/api/game/schedule?season=${season}&round=${round}`);
            if (res.ok) {
                const newSchedule = await res.json();
                setSchedule(newSchedule);
            } else {
                console.error('Failed to load schedule for round', round);
            }
        } catch (error) {
            console.error('Error switching round:', error);
        } finally {
            setIsLoading(false);
        }

        // Load predictions in background (non-blocking, after spinner is cleared)
        if (user) {
            const season = initialSchedule?.season || new Date().getFullYear();
            loadPredictionsForRound(season, parseInt(round)).catch(e =>
                console.error('[GameClient] Background prediction load failed:', e)
            );
        }
    };

    useEffect(() => {
        const roundFromUrl = searchParams.get('round');
        if (!roundFromUrl || !schedule) return;
        if (roundFromUrl === schedule.round.toString()) return;
        handleRoundSelect(roundFromUrl, false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, schedule]);

    if (!schedule) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
                <span className="material-icons text-5xl text-f1-text-muted animate-pulse">sports_motorsports</span>
                <p className="text-f1-text-muted text-center">No race weekend available</p>
            </div>
        );
    }


    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <div className="mb-6">
                    <h2 className="text-f1-red font-mono tracking-widest uppercase text-xs mb-1">GAME CENTER</h2>
                    <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-tight">
                        {schedule.season} PREDICTION
                    </h1>
                </div>

                <div className="mb-6">
                    <RoundSlider
                        races={initialRaces}
                        selectedRound={activeRound}
                        onSelectRound={handleRoundSelect}
                        countryFlags={countryFlags}
                    />
                </div>

                {/* Active Race Info */}
                {/* Active Race Info */}
                <div className="glass-card px-4 py-3 flex items-center gap-4">
                    <div className="w-10 h-6 rounded-sm overflow-hidden flex-shrink-0 border border-white/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={countryFlags[schedule.country]}
                            alt={schedule.country}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <div className="h-6 w-px bg-f1-border" />

                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold uppercase tracking-wide">{schedule.raceName}</h2>
                            {schedule.isSprint && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                    Sprint
                                </span>
                            )}
                        </div>
                        <p className="text-[11px] text-f1-text-muted">
                            {schedule.circuitName} — {schedule.country}
                        </p>
                    </div>
                </div>
            </div>



            {/* Tab toggle */}
            <div className="flex gap-1 p-1 rounded-xl bg-f1-surface/30 border border-f1-border/20">
                <button
                    onClick={() => setActiveTab('prediction')}
                    className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all
                        ${activeTab === 'prediction'
                            ? 'bg-f1-red text-white shadow-lg shadow-f1-red/20'
                            : 'text-f1-text-muted hover:text-white'
                        }`}
                >
                    <span className="material-icons text-sm mr-1 align-middle">sports_motorsports</span>
                    Prediction
                </button>
                <button
                    onClick={() => setActiveTab('stand')}
                    className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all
                        ${activeTab === 'stand'
                            ? 'bg-f1-red text-white shadow-lg shadow-f1-red/20'
                            : 'text-f1-text-muted hover:text-white'
                        }`}
                >
                    <span className="material-icons text-sm mr-1 align-middle">leaderboard</span>
                    Standings
                </button>
                {isAdmin && (
                    <button
                        onClick={() => setActiveTab('admin')}
                        className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all
                            ${activeTab === 'admin'
                                ? 'bg-f1-red text-white shadow-lg shadow-f1-red/20'
                                : 'text-f1-text-muted hover:text-white'
                            }`}
                    >
                        <span className="material-icons text-sm mr-1 align-middle">admin_panel_settings</span>
                        Admin
                    </button>
                )}
            </div>

            {/* Content */}
            {activeTab === 'prediction' ? (
                <div className="space-y-8">
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-2 border-f1-red/30 border-t-f1-red rounded-full animate-spin" />
                        </div>
                    ) : (() => {
                        if (!schedule.sessions.length) return <div>Invalid schedule configuration</div>;

                        return (
                            <WeekendSessionsBoard
                                drivers={drivers}
                                season={schedule.season}
                                round={schedule.round}
                                sessions={schedule.sessions}
                                predictions={predictions}
                                onPredictionSaved={(sessionType, prediction) => {
                                    setPredictions((prev) => ({ ...prev, [sessionType]: prediction }));
                                }}
                            />
                        );
                    })()}
                </div>
            ) : activeTab === 'stand' ? (
                <div className="space-y-8">
                    <GameLeaderboard
                        entries={leaderboardData}
                        currentUserId={user?.id}
                    />
                    <GamePointsChart
                        data={chartData}
                        userName={user?.user_metadata?.username}
                    />
                </div>
            ) : activeTab === 'admin' && isAdmin ? (
                <AdminPanel
                    season={schedule.season}
                    races={initialRaces}
                    onScoresUpdated={loadLeaderboard}
                />
            ) : null}
        </div>
    );
}
