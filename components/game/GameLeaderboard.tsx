'use client';

import { GameScore } from '@/lib/types/f1';

interface LeaderboardEntry {
    userId: string;
    username: string;
    avatarUrl?: string;
    totalPoints: number;
    raceCount: number;
    scores: GameScore[];
}

interface GameLeaderboardProps {
    entries: LeaderboardEntry[];
    currentUserId?: string;
}

export default function GameLeaderboard({ entries, currentUserId }: GameLeaderboardProps) {
    const sorted = [...entries].sort((a, b) => b.totalPoints - a.totalPoints);

    const getMedalIcon = (position: number) => {
        switch (position) {
            case 0: return { icon: 'emoji_events', color: '#FFD700' };
            case 1: return { icon: 'emoji_events', color: '#C0C0C0' };
            case 2: return { icon: 'emoji_events', color: '#CD7F32' };
            default: return null;
        }
    };

    if (sorted.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
                <span className="material-icons text-4xl text-f1-text-muted">leaderboard</span>
                <p className="text-f1-text-muted text-sm">No scores available yet</p>
                <p className="text-f1-text-muted text-xs">Scores will appear after the first race</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-widest text-f1-text-muted mb-3">
                Season Standings
            </h3>

            {sorted.map((entry, i) => {
                const medal = getMedalIcon(i);
                const isCurrentUser = entry.userId === currentUserId;

                return (
                    <div
                        key={entry.userId}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200
                            ${isCurrentUser
                                ? 'glass-card border-f1-red/30 bg-f1-red/5'
                                : 'glass-card hover:border-white/10'
                            }
                            ${i < 3 ? 'border-opacity-50' : ''}`}
                    >
                        {/* Position */}
                        <div className="w-8 flex items-center justify-center">
                            {medal ? (
                                <span className="material-icons text-lg" style={{ color: medal.color }}>
                                    {medal.icon}
                                </span>
                            ) : (
                                <span className="text-sm font-mono font-bold text-f1-text-muted">
                                    {i + 1}
                                </span>
                            )}
                        </div>

                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-f1-surface border border-f1-border">
                            {entry.avatarUrl ? (
                                <img src={entry.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-f1-text-muted">
                                    {entry.username.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* Name */}
                        <div className="flex-grow min-w-0">
                            <span className={`text-sm font-bold truncate block ${isCurrentUser ? 'text-f1-red' : ''}`}>
                                {entry.username}
                                {isCurrentUser && <span className="text-[10px] text-f1-text-muted ml-1">(you)</span>}
                            </span>
                            <span className="text-[10px] text-f1-text-muted">
                                {entry.raceCount} {entry.raceCount === 1 ? 'race' : 'races'}
                            </span>
                        </div>

                        {/* Points */}
                        <div className="text-right">
                            <span className={`text-lg font-bold font-mono ${i < 3 ? 'text-white' : 'text-f1-text-secondary'}`}>
                                {entry.totalPoints}
                            </span>
                            <span className="text-[10px] text-f1-text-muted block">points</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
