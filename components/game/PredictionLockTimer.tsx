'use client';

import { useState, useEffect } from 'react';

interface PredictionLockTimerProps {
    sessionStartTime: string;
    sessionLabel: string;
}

export default function PredictionLockTimer({ sessionStartTime, sessionLabel }: PredictionLockTimerProps) {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [isLocked, setIsLocked] = useState(false);
    const [isUrgent, setIsUrgent] = useState(false);

    useEffect(() => {
        const update = () => {
            const now = new Date().getTime();
            const target = new Date(sessionStartTime).getTime();
            const diff = target - now;

            if (diff <= 0) {
                setIsLocked(true);
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                return;
            }

            setIsUrgent(diff < 30 * 60 * 1000); // Less than 30 min

            setTimeLeft({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((diff % (1000 * 60)) / 1000),
            });
        };

        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [sessionStartTime]);

    if (isLocked) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-f1-red/10 border border-f1-red/20">
                <span className="material-icons text-f1-red text-sm">lock</span>
                <span className="text-xs font-bold text-f1-red uppercase tracking-wider">
                    {sessionLabel} gestart — predictions gesloten
                </span>
            </div>
        );
    }

    return (
        <div className={`flex items-center gap-3 px-3 py-1.5 rounded-lg border transition-all duration-300
            ${isUrgent
                ? 'bg-orange-500/10 border-orange-500/30 animate-pulse'
                : 'bg-f1-surface/30 border-f1-border/20'
            }`}
        >
            <span className={`material-icons text-sm ${isUrgent ? 'text-orange-500' : 'text-f1-text-muted'}`}>
                timer
            </span>
            <span className={`text-xs font-mono ${isUrgent ? 'text-orange-400 font-bold' : 'text-f1-text-secondary'}`}>
                {timeLeft.days > 0 && `${timeLeft.days}d `}
                {String(timeLeft.hours).padStart(2, '0')}:
                {String(timeLeft.minutes).padStart(2, '0')}:
                {String(timeLeft.seconds).padStart(2, '0')}
            </span>
            <span className="text-[10px] text-f1-text-muted uppercase tracking-wider">
                tot {sessionLabel}
            </span>
        </div>
    );
}
