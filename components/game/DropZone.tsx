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
        if (onClick) {
            onClick();
            return;
        }
        if (driver && !isLocked) {
            onRemove();
        }
    };

    // Locked state — compact
    if (isLocked) {
        return (
            <div className="relative rounded-lg border border-f1-border/30 bg-f1-surface/30 p-2 flex items-center gap-2 opacity-70">
                <span className="material-icons text-f1-text-muted text-xs">lock</span>
                {driver ? (
                    <>
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-f1-bg border" style={{ borderColor: driver.teamColor }}>
                            {driver.headshotUrl ? (
                                <Image src={driver.headshotUrl} alt={driver.code} width={24} height={24} className="w-full h-full object-cover object-top" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[8px] font-bold" style={{ color: driver.teamColor }}>{driver.code}</div>
                            )}
                        </div>
                        <span className="font-bold text-xs" style={{ color: driver.teamColor }}>{driver.code}</span>
                    </>
                ) : (
                    <span className="text-[10px] text-f1-text-muted">—</span>
                )}
                <span className="ml-auto text-[9px] font-mono text-f1-text-muted uppercase">{label}</span>
            </div>
        );
    }

    // Empty state — compact
    if (!driver) {
        return (
            <div
                className={`relative rounded-lg transition-all duration-200 flex items-center gap-2 cursor-pointer p-2
                    ${isDragOver
                        ? 'border-2 border-f1-red bg-f1-red/10 scale-[1.01]'
                        : highlight
                            ? 'border-2 border-dashed border-f1-red/50 bg-f1-red/5 animate-pulse'
                            : 'border-2 border-dashed border-f1-border/40 bg-f1-surface/20 hover:border-f1-border/60'
                    }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={onClick}
            >
                <span className={`material-icons ${isDragOver ? 'text-f1-red' : 'text-f1-text-muted'} text-base`}>
                    {isPole ? 'emoji_events' : 'add_circle_outline'}
                </span>
                <span className={`font-bold uppercase tracking-wider text-[10px] ${isDragOver ? 'text-f1-red' : 'text-f1-text-muted'}`}>
                    {label}
                </span>
                <span className="ml-auto text-[9px] font-mono text-f1-text-muted">{points}pt</span>
            </div>
        );
    }

    // Filled state — compact horizontal
    return (
        <div
            className="relative rounded-lg border bg-f1-surface/40 p-2 flex items-center gap-2 cursor-pointer hover:bg-f1-surface/60 transition-all duration-200 group"
            style={{ borderColor: driver.teamColor + '60' }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
        >
            {/* Position label */}
            <span className="text-[9px] font-mono text-f1-text-muted uppercase w-6">{label}</span>

            {/* Driver avatar */}
            <div className="w-7 h-7 rounded-full overflow-hidden bg-f1-bg border-2 flex-shrink-0" style={{ borderColor: driver.teamColor }}>
                {driver.headshotUrl ? (
                    <Image src={driver.headshotUrl} alt={driver.code} width={28} height={28} className="w-full h-full object-cover object-top" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-[8px] font-bold" style={{ color: driver.teamColor }}>
                        {driver.code}
                    </div>
                )}
            </div>

            {/* Driver name */}
            <span className="font-bold text-xs" style={{ color: driver.teamColor }}>{driver.code}</span>
            <span className="text-[10px] text-f1-text-muted hidden sm:inline">{driver.lastName}</span>

            {/* Points */}
            <span className="ml-auto text-[9px] font-mono" style={{ color: driver.teamColor }}>{points}pt</span>

            {/* Remove button */}
            <button
                className="w-4 h-4 rounded-full bg-f1-red/80 flex items-center justify-center
                    opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-f1-red flex-shrink-0"
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
            >
                <span className="material-icons text-white text-[10px]">close</span>
            </button>
        </div>
    );
}
