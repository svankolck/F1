'use client';

import { useState, useEffect } from 'react';

interface CountdownProps {
    targetDate: string; // ISO string
    targetTime?: string; // "HH:mm:ssZ" format
    label?: string;
}

export default function Countdown({ targetDate, targetTime, label }: CountdownProps) {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [isLive, setIsLive] = useState(false);

    useEffect(() => {
        const targetStr = targetTime
            ? `${targetDate}T${targetTime}`
            : `${targetDate}T14:00:00Z`;
        const target = new Date(targetStr);

        function update() {
            const now = new Date();
            const diff = target.getTime() - now.getTime();

            if (diff <= 0) {
                setIsLive(true);
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                return;
            }

            setIsLive(false);
            setTimeLeft({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((diff % (1000 * 60)) / 1000),
            });
        }

        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [targetDate, targetTime]);

    const blocks = [
        { value: timeLeft.days, unit: 'Days' },
        { value: timeLeft.hours, unit: 'Hrs' },
        { value: timeLeft.minutes, unit: 'Mins' },
        { value: timeLeft.seconds, unit: 'Secs' },
    ];

    return (
        <div className="flex flex-col gap-3">
            {label && (
                <p className="text-xs text-f1-text-muted font-mono uppercase tracking-widest">
                    {label}
                </p>
            )}
            <div className="grid grid-cols-4 gap-2 md:gap-3 max-w-md">
                {blocks.map((block, i) => (
                    <div
                        key={block.unit}
                        className="glass-card p-3 md:p-4 flex flex-col items-center"
                    >
                        <span
                            className={`text-2xl md:text-4xl font-bold font-mono transition-all ${i >= 2 ? 'text-f1-red' : 'text-white'
                                }`}
                        >
                            {String(block.value).padStart(2, '0')}
                        </span>
                        <span
                            className={`text-[9px] md:text-[10px] uppercase tracking-widest mt-1 ${i >= 2 ? 'text-f1-red/60' : 'text-f1-text-muted'
                                }`}
                        >
                            {block.unit}
                        </span>
                    </div>
                ))}
            </div>
            {isLive && (
                <button className="flex items-center gap-2 bg-f1-red hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(225,6,0,0.4)] w-fit mt-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                    </span>
                    <span>Watch Live</span>
                </button>
            )}
        </div>
    );
}
