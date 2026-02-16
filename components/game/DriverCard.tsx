'use client';

import { GameDriver } from '@/lib/types/f1';
import Image from 'next/image';

interface DriverCardProps {
    driver: GameDriver;
    isPlaced?: boolean;
    onSelect?: (driver: GameDriver) => void;
    compact?: boolean;
}

export default function DriverCard({ driver, isPlaced, onSelect, compact }: DriverCardProps) {
    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('application/json', JSON.stringify(driver));
        e.dataTransfer.effectAllowed = 'move';
        const el = e.currentTarget as HTMLElement;
        el.style.opacity = '0.5';
        el.style.transform = 'rotate(2deg) scale(1.05)';
    };

    const handleDragEnd = (e: React.DragEvent) => {
        const el = e.currentTarget as HTMLElement;
        el.style.opacity = '1';
        el.style.transform = '';
    };

    const handleClick = () => {
        if (onSelect) onSelect(driver);
    };

    if (compact) {
        return (
            <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg glass-card cursor-pointer
                    transition-all duration-200 hover:scale-[1.02] hover:border-white/20
                    ${isPlaced ? 'opacity-30 pointer-events-none' : ''}`}
                style={{ borderLeft: `3px solid ${driver.teamColor}` }}
                draggable={!isPlaced}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onClick={handleClick}
            >
                <span className="text-xs font-bold font-mono" style={{ color: driver.teamColor }}>
                    {driver.code}
                </span>
                <span className="text-[10px] text-f1-text-muted truncate">{driver.teamName}</span>
            </div>
        );
    }

    return (
        <div
            className={`relative flex flex-col items-center gap-1 p-3 rounded-xl glass-card cursor-grab
                active:cursor-grabbing transition-all duration-200 group
                hover:scale-[1.05] hover:shadow-lg hover:shadow-black/30 hover:border-white/20
                ${isPlaced ? 'opacity-30 pointer-events-none scale-95' : ''}`}
            style={{ borderLeft: `4px solid ${driver.teamColor}` }}
            draggable={!isPlaced}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onClick={handleClick}
        >
            {/* Driver photo */}
            <div className="w-12 h-12 rounded-full overflow-hidden bg-f1-surface border border-f1-border">
                {driver.headshotUrl ? (
                    <Image
                        src={driver.headshotUrl}
                        alt={driver.code}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover object-top"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-f1-text-muted text-xs font-bold">
                        {driver.code}
                    </div>
                )}
            </div>

            {/* Number badge */}
            <span
                className="absolute -top-1 -right-1 text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: driver.teamColor, color: '#000' }}
            >
                {driver.number}
            </span>

            {/* Name */}
            <span className="text-xs font-bold text-center leading-tight">
                {driver.lastName}
            </span>
            <span className="text-[9px] text-f1-text-muted uppercase tracking-wider">
                {driver.teamName}
            </span>
        </div>
    );
}
