'use client';

import { SessionSchedule } from '@/lib/types/f1';

interface WeekendProgressBarProps {
    sessions: SessionSchedule[];
    activeSession?: string;
    onSessionClick?: (session: SessionSchedule) => void;
}

export default function WeekendProgressBar({ sessions, activeSession, onSessionClick }: WeekendProgressBarProps) {
    return (
        <div className="flex gap-2 w-full overflow-x-auto pb-2">
            {sessions.map((session, i) => {
                const isActive = activeSession === session.type;
                const isCompleted = session.isCompleted;
                const isLocked = session.isLocked && !session.isCompleted;

                return (
                    <button
                        key={session.type}
                        onClick={() => onSessionClick?.(session)}
                        className={`relative flex-1 min-w-[80px] p-3 rounded-xl border transition-all duration-300
                            ${isActive
                                ? 'border-f1-red bg-f1-red/10 shadow-lg shadow-f1-red/20 scale-[1.02]'
                                : isCompleted
                                    ? 'border-f1-border/30 bg-f1-surface/60'
                                    : isLocked
                                        ? 'border-yellow-500/30 bg-yellow-500/5'
                                        : 'border-f1-border/20 bg-f1-surface/20 hover:border-f1-border/40'
                            }
                            ${isActive ? 'animate-pulse-glow' : ''}
                        `}
                    >
                        {/* Connector line */}
                        {i < sessions.length - 1 && (
                            <div className={`absolute top-1/2 -right-1 w-2 h-0.5 z-10
                                ${isCompleted ? 'bg-f1-text-muted' : 'bg-f1-border/30'}`}
                            />
                        )}

                        {/* Status icon */}
                        <div className="flex flex-col items-center gap-1">
                            <span className={`material-icons text-sm
                                ${isCompleted ? 'text-green-500' : isLocked ? 'text-yellow-500' : isActive ? 'text-f1-red' : 'text-f1-text-muted'}
                            `}>
                                {isCompleted ? 'check_circle' : isLocked ? 'lock' : isActive ? 'radio_button_checked' : 'radio_button_unchecked'}
                            </span>

                            {/* Label */}
                            <span className={`text-[10px] font-bold uppercase tracking-wider
                                ${isActive ? 'text-f1-red' : isCompleted ? 'text-f1-text-secondary' : 'text-f1-text-muted'}
                            `}>
                                {session.label}
                            </span>

                            {/* Points (if completed) */}
                            {isCompleted && session.points !== undefined && (
                                <span className="text-xs font-mono font-bold text-green-400">
                                    {session.points}pt
                                </span>
                            )}

                            {/* Time (if not completed) */}
                            {!isCompleted && (
                                <span className="text-[9px] font-mono text-f1-text-muted">
                                    {new Date(session.startTime).toLocaleDateString('en-GB', {
                                        weekday: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </span>
                            )}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
