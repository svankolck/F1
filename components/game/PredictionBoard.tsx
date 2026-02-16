'use client';

import { useState, useEffect, useCallback } from 'react';
import { GameDriver, GameSessionType, Prediction, RACE_SCORING, SPRINT_SCORING } from '@/lib/types/f1';
import { useAuth } from '@/components/auth/AuthProvider';
import DriverCard from './DriverCard';
import DropZone from './DropZone';

interface PredictionBoardProps {
    drivers: GameDriver[];
    sessionType: GameSessionType;
    sessionLabel: string;
    isLocked: boolean;
    season: number;
    round: number;
    existingPrediction?: Prediction | null;
}

type SlotKey = 'pole' | 'p1' | 'p2' | 'p3';

export default function PredictionBoard({
    drivers,
    sessionType,
    sessionLabel,
    isLocked,
    season,
    round,
    existingPrediction,
}: PredictionBoardProps) {
    const { user } = useAuth();
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<GameDriver | null>(null);
    const [slots, setSlots] = useState<Record<SlotKey, GameDriver | null>>({
        pole: null,
        p1: null,
        p2: null,
        p3: null,
    });

    const isSprint = sessionType === 'sprint' || sessionType === 'sprint_qualifying';
    const scoring = isSprint ? SPRINT_SCORING : RACE_SCORING;
    const hasPole = sessionType === 'qualifying' || sessionType === 'sprint_qualifying';

    // Load existing prediction
    useEffect(() => {
        if (existingPrediction) {
            const findDriver = (id: string | null) => drivers.find(d => d.driverId === id) || null;
            setSlots({
                pole: findDriver(existingPrediction.pole_driver_id),
                p1: findDriver(existingPrediction.p1_driver_id),
                p2: findDriver(existingPrediction.p2_driver_id),
                p3: findDriver(existingPrediction.p3_driver_id),
            });
        }
    }, [existingPrediction, drivers]);

    // Get placed driver IDs
    const placedDriverIds = Object.values(slots)
        .filter(Boolean)
        .map(d => d!.driverId);

    // Handle driver placement in slot
    const handleDrop = useCallback((slot: SlotKey, driver: GameDriver) => {
        if (isLocked) return;
        setSlots(prev => {
            const next = { ...prev };
            // Remove driver from any existing slot
            for (const key of Object.keys(next) as SlotKey[]) {
                if (next[key]?.driverId === driver.driverId) {
                    next[key] = null;
                }
            }
            next[slot] = driver;
            return next;
        });
        setSelectedDriver(null);
        setSaved(false);
    }, [isLocked]);

    // Handle remove from slot
    const handleRemove = useCallback((slot: SlotKey) => {
        if (isLocked) return;
        setSlots(prev => ({ ...prev, [slot]: null }));
        setSaved(false);
    }, [isLocked]);

    // Mobile tap: select driver, then tap slot
    const handleDriverSelect = useCallback((driver: GameDriver) => {
        if (isLocked) return;
        if (selectedDriver?.driverId === driver.driverId) {
            setSelectedDriver(null);
        } else {
            setSelectedDriver(driver);
        }
    }, [isLocked, selectedDriver]);

    // When a slot is clicked with a selected driver (mobile)
    const handleSlotClickWithSelected = useCallback((slot: SlotKey) => {
        if (selectedDriver && !isLocked) {
            handleDrop(slot, selectedDriver);
        }
    }, [selectedDriver, isLocked, handleDrop]);

    // Save prediction
    const savePrediction = async () => {
        if (!user || isLocked) return;
        setSaving(true);
        try {
            const payload = {
                season,
                round,
                sessionType,
                pole_driver_id: slots.pole?.driverId || null,
                p1_driver_id: slots.p1?.driverId || null,
                p2_driver_id: slots.p2?.driverId || null,
                p3_driver_id: slots.p3?.driverId || null,
                is_default: false,
            };

            const res = await fetch('/api/game/predictions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                throw new Error('Failed to save prediction');
            }

            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error('Failed to save prediction:', err);
        } finally {
            setSaving(false);
        }
    };

    // Check if any slot is filled
    const hasAnyPrediction = Object.values(slots).some(Boolean);

    return (
        <div className="space-y-4">
            {/* Session header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold uppercase tracking-widest">{sessionLabel}</h3>
                    {isLocked && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-f1-red/10 border border-f1-red/20">
                            <span className="material-icons text-f1-red text-xs">lock</span>
                            <span className="text-[10px] text-f1-red font-bold">Locked</span>
                        </span>
                    )}
                </div>
                {!isLocked && hasAnyPrediction && (
                    <button
                        onClick={savePrediction}
                        disabled={saving}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200
                            ${saved
                                ? 'bg-green-600 text-white'
                                : 'bg-f1-red hover:bg-f1-red/80 text-white'
                            }`}
                    >
                        {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save'}
                    </button>
                )}
            </div>

            {/* Drop zones */}
            <div className="grid gap-3">
                {/* Pole position (only for qualifying sessions) */}
                {hasPole && (
                    <DropZone
                        label="Pole Position"
                        points={scoring.pole}
                        driver={slots.pole}
                        isLocked={isLocked}
                        isPole
                        onDrop={(d) => selectedDriver ? handleSlotClickWithSelected('pole') : handleDrop('pole', d)}
                        onRemove={() => handleRemove('pole')}
                    />
                )}

                {/* P1, P2, P3 grid (only for non-qualifying sessions) */}
                {!hasPole && (
                    <div className="grid grid-cols-3 gap-3">
                        <DropZone
                            label="P1"
                            points={scoring.p1}
                            driver={slots.p1}
                            isLocked={isLocked}
                            onDrop={(d) => handleDrop('p1', d)}
                            onRemove={() => handleRemove('p1')}
                        />
                        <DropZone
                            label="P2"
                            points={scoring.p2}
                            driver={slots.p2}
                            isLocked={isLocked}
                            onDrop={(d) => handleDrop('p2', d)}
                            onRemove={() => handleRemove('p2')}
                        />
                        <DropZone
                            label="P3"
                            points={scoring.p3}
                            driver={slots.p3}
                            isLocked={isLocked}
                            onDrop={(d) => handleDrop('p3', d)}
                            onRemove={() => handleRemove('p3')}
                        />
                    </div>
                )}
            </div>

            {/* Driver pool */}
            {!isLocked && (
                <div>
                    <p className="text-[10px] text-f1-text-muted uppercase tracking-widest mb-2 font-bold">
                        {selectedDriver ? `Tap a position for ${selectedDriver.code}` : 'Drag or tap a driver'}
                    </p>
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-2 max-h-[300px] overflow-y-auto p-1">
                        {drivers.map(driver => (
                            <DriverCard
                                key={driver.driverId}
                                driver={driver}
                                isPlaced={placedDriverIds.includes(driver.driverId)}
                                onSelect={handleDriverSelect}
                                compact={false}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
