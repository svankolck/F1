'use client';

import { useState, useCallback } from 'react';
import { GameDriver } from '@/lib/types/f1';
import Image from 'next/image';

interface DropZoneProps {
    label: string;
    points: number;
    driver: GameDriver | null;
    isLocked: boolean;
    isPole?: boolean;
    onDrop: (driver: GameDriver) => void;
    onRemove: () => void;
    onClick?: () => void;
    highlight?: boolean;
}

export default function DropZone({ label, points, driver, isLocked, isPole, onDrop, onRemove, onClick, highlight }: DropZoneProps) {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        if (isLocked) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsDragOver(true);
    }, [isLocked]);

    const handleDragLeave = useCallback(() => {
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        if (isLocked) return;
        e.preventDefault();
        setIsDragOver(false);
        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json')) as GameDriver;
            onDrop(data);
        } catch { /* ignore */ }
    }, [isLocked, onDrop]);

    const handleClick = () => {
        if (driver && !isLocked) {
            onRemove();
        }
    };

    // Locked state
    if (isLocked) {
        return (
            <div
                className={`relative rounded-xl border border-f1-border/30 bg-f1-surface/30 backdrop-blur-sm
                    ${isPole ? 'p-5 min-h-[120px]' : 'p-4 min-h-[100px]'}
                    flex flex-col items-center justify-center gap-2 opacity-70`}
            >
                <span className="material-icons text-f1-text-muted text-lg">lock</span>
                {driver ? (
                    <>
                        <span className="font-bold text-sm" style={{ color: driver.teamColor }}>
                            {driver.code}
                        </span>
                        <span className="text-[10px] text-f1-text-muted">{driver.firstName} {driver.lastName}</span>
                    </>
                ) : (
                    <span className="text-xs text-f1-text-muted">Not set</span>
                )}
                <div className="absolute top-2 right-2">
                    <span className="text-[9px] font-mono text-f1-text-muted uppercase">{label}</span>
                </div>
            </div>
        );
    }

    // Empty state
    if (!driver) {
        return (
            <div
                className={`relative rounded-xl transition-all duration-300 flex flex-col items-center justify-center gap-2 cursor-pointer
                    ${isPole ? 'p-5 min-h-[120px]' : 'p-4 min-h-[100px]'}
                    ${isDragOver
                        ? 'border-2 border-f1-red bg-f1-red/10 shadow-lg shadow-f1-red/20 scale-[1.02]'
                        : 'border-2 border-dashed border-f1-border/40 bg-f1-surface/20 hover:border-f1-border/60 animate-pulse-glow'
                    }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={onClick}
            >
                <div className="flex flex-col items-center gap-1">
                    <span className={`material-icons ${isDragOver ? 'text-f1-red' : 'text-f1-text-muted'} ${isPole ? 'text-2xl' : 'text-lg'}`}>
                        {isPole ? 'emoji_events' : 'add_circle_outline'}
                    </span>
                    <span className={`font-bold uppercase tracking-wider ${isPole ? 'text-sm' : 'text-xs'} ${isDragOver ? 'text-f1-red' : 'text-f1-text-muted'}`}>
                        {label}
                    </span>
                    <span className="text-[10px] font-mono text-f1-text-muted">{points}pt</span>
                </div>
            </div>
        );
    }

    // Filled state
    return (
        <div
            className={`relative rounded-xl border-2 bg-f1-surface/40 backdrop-blur-sm
                ${isPole ? 'p-5 min-h-[120px]' : 'p-4 min-h-[100px]'}
                flex flex-col items-center justify-center gap-2 cursor-pointer
                hover:bg-f1-surface/60 transition-all duration-300 group
                ${highlight && !driver && !isLocked ? 'animate-pulse border-f1-red/50 ring-1 ring-f1-red/30' : ''}`}
            style={{ borderColor: driver.teamColor + '80' }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
        >
            {/* Remove button */}
            <button
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-f1-red/80 flex items-center justify-center
                    opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-f1-red"
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
            >
                <span className="material-icons text-white text-xs">close</span>
            </button>

            {/* Position label */}
            <div className="absolute top-2 left-2 flex items-center gap-1">
                <span className="text-[9px] font-mono text-f1-text-muted uppercase">{label}</span>
                <span className="text-[9px] font-mono" style={{ color: driver.teamColor }}>{points}pt</span>
            </div>

            {/* Driver info */}
            <div className="w-10 h-10 rounded-full overflow-hidden bg-f1-bg border-2" style={{ borderColor: driver.teamColor }}>
                {driver.headshotUrl ? (
                    <Image src={driver.headshotUrl} alt={driver.code} width={40} height={40} className="w-full h-full object-cover object-top" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold" style={{ color: driver.teamColor }}>
                        {driver.code}
                    </div>
                )}
            </div>
            <span className="font-bold text-sm" style={{ color: driver.teamColor }}>
                {driver.code}
            </span>
            <span className="text-[10px] text-f1-text-muted">{driver.firstName} {driver.lastName}</span>
        </div>
    );
}
