'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { GameDriver, WeekendSchedule, Prediction, GameSessionType, Race, getFlagUrl } from '@/lib/types/f1';
import WeekendPredictionBoard from './WeekendPredictionBoard';
import RoundSlider from '@/components/standings/RoundSlider';
import PredictionLockTimer from './PredictionLockTimer';
import GameLeaderboard from './GameLeaderboard';
import GamePointsChart from './GamePointsChart';

interface GameClientProps {
    initialSchedule: WeekendSchedule | null;
    initialDrivers: GameDriver[];
    initialRaces: Race[];
    initialPredictions?: Record<GameSessionType, Prediction | null>;
}

type TabType = 'prediction' | 'stand';

export default function GameClient({ initialSchedule, initialDrivers, initialRaces, initialPredictions }: GameClientProps) {
    const { user } = useAuth();
    const supabase = createClient();
    const [activeTab, setActiveTab] = useState<TabType>('prediction');
    const [schedule, setSchedule] = useState<WeekendSchedule | null>(initialSchedule);
    const [drivers] = useState<GameDriver[]>(initialDrivers);
    const [activeRound, setActiveRound] = useState<string>(initialSchedule?.round.toString() || '1');
    const [isLoading, setIsLoading] = useState(false);

    // Build country flag map
    const countryFlags: Record<string, string> = {};
    initialRaces.forEach((race) => {
        countryFlags[race.Circuit.Location.country] = getFlagUrl(race.Circuit.Location.country);
    });

    const [predictions, setPredictions] = useState<Record<GameSessionType, Prediction | null>>(initialPredictions || {
        qualifying: null,
        race: null,
        sprint_qualifying: null,
        sprint: null,
    });
    const [predictionsLoaded, setPredictionsLoaded] = useState(!!initialPredictions);

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

    // Determine active session from schedule


    // Load user predictions (only when switching rounds, initial data comes from server)
    useEffect(() => {
        if (!user || !schedule) return;
        // Skip client-side fetch for initial round — server already provided the data
        if (schedule.round.toString() === (initialSchedule?.round.toString() || '') && initialPredictions) {
            return;
        }
        async function loadPredictions() {
            setPredictionsLoaded(false);
            const { data } = await supabase
                .from('predictions')
                .select('*')
                .eq('user_id', user!.id)
                .eq('season', schedule!.season)
                .eq('round', schedule!.round);

            if (data) {
                const preds: Record<GameSessionType, Prediction | null> = {
                    qualifying: null, race: null, sprint_qualifying: null, sprint: null,
                };
                for (const p of data) {
                    preds[p.session_type as GameSessionType] = p as Prediction;
                }
                setPredictions(preds);
            }
            setPredictionsLoaded(true);
        }
        loadPredictions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, schedule, supabase]);

    // Load leaderboard
    useEffect(() => {
        async function loadLeaderboard() {
            if (!schedule) return;
            const { data: scores } = await supabase
                .from('game_scores')
                .select('user_id, total_points, season, round, session_type')
                .eq('season', schedule.season);

            if (!scores || scores.length === 0) return;

            // Group by user
            const userMap = new Map<string, { total: number; rounds: Set<number> }>();
            for (const s of scores) {
                const existing = userMap.get(s.user_id) || { total: 0, rounds: new Set<number>() };
                existing.total += s.total_points;
                existing.rounds.add(s.round);
                userMap.set(s.user_id, existing);
            }

            // Fetch profiles
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

            // Build chart data for current user
            if (user) {
                const userScores = scores
                    .filter(s => s.user_id === user.id)
                    .sort((a, b) => a.round - b.round);

                let cumulative = 0;
                const chart = userScores.map(s => {
                    cumulative += s.total_points;
                    return {
                        round: s.round,
                        raceName: `R${s.round}`,
                        points: s.total_points,
                        cumulative,
                    };
                });
                setChartData(chart);
            }
        }
        loadLeaderboard();
    }, [schedule, supabase, user]);

    // Apply default drivers if no prediction exists
    useEffect(() => {
        if (!user || !schedule || !predictionsLoaded) return;
        const activeSchedule = schedule;

        async function applyDefaults() {
            const { data: profile } = await supabase
                .from('profiles')
                .select('default_pole_driver, default_p1_driver, default_p2_driver, default_p3_driver')
                .eq('id', user!.id)
                .single();

            if (!profile) return;

            // For each session without a prediction, create one from defaults
            for (const session of activeSchedule.sessions) {
                if (predictions[session.type]) continue; // already has prediction
                if (session.isLocked) continue; // can't create anymore

                const hasPole = session.type === 'qualifying' || session.type === 'sprint_qualifying';

                const defaultPred: Partial<Prediction> = {
                    user_id: user!.id,
                    season: activeSchedule.season,
                    round: activeSchedule.round,
                    session_type: session.type,
                    pole_driver_id: hasPole ? profile.default_pole_driver : null,
                    p1_driver_id: profile.default_p1_driver,
                    p2_driver_id: profile.default_p2_driver,
                    p3_driver_id: profile.default_p3_driver,
                    is_default: true,
                };

                // Only if there are any defaults set
                if (defaultPred.p1_driver_id || defaultPred.pole_driver_id) {
                    const res = await fetch('/api/game/predictions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            season: activeSchedule.season,
                            round: activeSchedule.round,
                            sessionType: session.type,
                            pole_driver_id: defaultPred.pole_driver_id || null,
                            p1_driver_id: defaultPred.p1_driver_id || null,
                            p2_driver_id: defaultPred.p2_driver_id || null,
                            p3_driver_id: defaultPred.p3_driver_id || null,
                            is_default: true,
                        }),
                    });

                    if (!res.ok) continue;

                    const saved = await res.json() as Prediction;
                    setPredictions(prev => ({ ...prev, [session.type]: saved }));
                }
            }
        }
        applyDefaults();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, schedule, predictionsLoaded, predictions, supabase]);



    const handleRoundSelect = async (round: string) => {
        if (round === activeRound || isLoading) return;
        setIsLoading(true);
        setActiveRound(round);

        try {
            // Assume current season for now (2026 as per user request context "2026 PREDICTION" implies we are looking at 2026, 
            // but the app dynamic. `initialRaces` has the season. 
            // Actually `initialSchedule.season` or `initialRaces[0].season`.
            const season = initialSchedule?.season || new Date().getFullYear();

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
    };

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
            </div>

            {/* Content */}
            {activeTab === 'prediction' ? (
                <div className="space-y-8">
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-2 border-f1-red/30 border-t-f1-red rounded-full animate-spin" />
                        </div>
                    ) : (() => {
                        // Identify sessions
                        const quali = schedule.sessions.find(s => s.type === 'qualifying' || s.type === 'sprint_qualifying');
                        const race = schedule.sessions.find(s => s.type === 'race'); // Assuming standard race for now, handle sprints later if needed

                        if (!quali || !race) return <div>Invalid schedule configuration</div>;

                        return (
                            <div className="space-y-4">
                                {/* Lock Timers */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {!quali.isLocked && (
                                        <PredictionLockTimer
                                            sessionStartTime={quali.startTime}
                                            sessionLabel={quali.label}
                                        />
                                    )}
                                    {!race.isLocked && (
                                        <PredictionLockTimer
                                            sessionStartTime={race.startTime}
                                            sessionLabel={race.label}
                                        />
                                    )}
                                </div>

                                <WeekendPredictionBoard
                                    drivers={drivers}
                                    season={schedule.season}
                                    round={schedule.round}
                                    qualiSession={{
                                        type: quali.type,
                                        label: quali.label,
                                        isLocked: quali.isLocked,
                                        prediction: predictions[quali.type]
                                    }}
                                    raceSession={{
                                        type: race.type,
                                        label: race.label,
                                        isLocked: race.isLocked,
                                        prediction: predictions[race.type]
                                    }}
                                />
                            </div>
                        );
                    })()}
                </div>
            ) : (
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
            )}
        </div>
    );
}
