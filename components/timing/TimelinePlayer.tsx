import { useEffect } from 'react';

interface TimelinePlayerProps {
    currentLap: number;
    maxLap: number;
    isPlaying: boolean;
    onTogglePlay: () => void;
    onChangeLap: (lap: number) => void;
    sessionName?: string;
}

export default function TimelinePlayer({
    currentLap,
    maxLap,
    isPlaying,
    onTogglePlay,
    onChangeLap,
    sessionName
}: TimelinePlayerProps) {

    // Auto-play logic
    useEffect(() => {
        if (!isPlaying) return;

        const interval = setInterval(() => {
            onChangeLap(currentLap >= maxLap ? 1 : currentLap + 1);
        }, 1500); // 1.5s per lap playback speed

        return () => clearInterval(interval);
    }, [isPlaying, currentLap, maxLap, onChangeLap]);

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChangeLap(Number(e.target.value));
    };

    return (
        <div className="glass-card border border-f1-border p-4 mt-4 flex flex-col md:flex-row items-center gap-4">
            <button
                onClick={onTogglePlay}
                className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full bg-f1-red hover:bg-red-700 text-white transition-colors"
                title={isPlaying ? "Pause Replay" : "Play Replay"}
            >
                <span className="material-icons">{isPlaying ? 'pause' : 'play_arrow'}</span>
            </button>

            <div className="flex-grow w-full flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-f1-text-muted font-mono uppercase tracking-widest">
                        Replay Progress {sessionName && `— ${sessionName}`}
                    </span>
                    <span className="text-sm font-bold font-mono">Lap {currentLap} / {maxLap}</span>
                </div>

                <input
                    type="range"
                    min={1}
                    max={maxLap}
                    value={currentLap}
                    onChange={handleSliderChange}
                    className="w-full h-2 bg-f1-surface rounded-full appearance-none cursor-pointer outline-none accent-f1-red"
                    style={{
                        background: `linear-gradient(to right, #E10600 ${(currentLap / maxLap) * 100}%, rgba(255,255,255,0.1) ${(currentLap / maxLap) * 100}%)`
                    }}
                />

                <div className="flex justify-between text-[10px] text-f1-text-muted font-mono">
                    <span>Lap 1</span>
                    <span>Lap {Math.floor(maxLap / 2)}</span>
                    <span>Lap {maxLap}</span>
                </div>
            </div>
        </div>
    );
}
