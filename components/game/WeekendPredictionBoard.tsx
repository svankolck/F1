'use client';

import { useState, useEffect, useCallback } from 'react';
import { GameDriver, GameSessionType, Prediction, RACE_SCORING, SPRINT_SCORING } from '@/lib/types/f1';
import { useAuth } from '@/components/auth/AuthProvider';
import DriverList from './DriverList';
import DropZone from './DropZone';

interface WeekendPredictionBoardProps {
    drivers: GameDriver[];
    season: number;
    round: number;
    // We need both qualifying and race sessions info to handle locking state
    qualiSession: { type: GameSessionType; label: string; isLocked: boolean; prediction: Prediction | null };
    raceSession: { type: GameSessionType; label: string; isLocked: boolean; prediction: Prediction | null };
}

type SlotKey = 'pole' | 'p1' | 'p2' | 'p3';

export default function WeekendPredictionBoard({
    drivers,
    season,
    round,
    qualiSession,
    raceSession,
}: WeekendPredictionBoardProps) {
    const { user } = useAuth();
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<GameDriver | null>(null);

    // Unified state for both sessions
    const [slots, setSlots] = useState<Record<SlotKey, GameDriver | null>>({
        pole: null,
        p1: null,
        p2: null,
        p3: null,
    });

    // Scoring rules (assuming standard race weekend for now, could adapt for sprints)
    const scoring = RACE_SCORING;

    // Load existing predictions into state
    useEffect(() => {
        const findDriver = (id: string | null) => drivers.find(d => d.driverId === id) || null;

        setSlots({
            pole: findDriver(qualiSession.prediction?.pole_driver_id || null),
            p1: findDriver(raceSession.prediction?.p1_driver_id || null),
            p2: findDriver(raceSession.prediction?.p2_driver_id || null),
            p3: findDriver(raceSession.prediction?.p3_driver_id || null),
        });
    }, [qualiSession.prediction, raceSession.prediction, drivers]);

    // Handle Drop Logic with Constraints
    const handleDrop = useCallback((slot: SlotKey, driver: GameDriver) => {
        const isQualiSlot = slot === 'pole';
        const isRaceSlot = ['p1', 'p2', 'p3'].includes(slot);

        // Check locks
        if (isQualiSlot && qualiSession.isLocked) return;
        if (isRaceSlot && raceSession.isLocked) return;

        setSlots(prev => {
            const next = { ...prev };

            // Constraint: Uniqueness within Race slots
            if (isRaceSlot) {
                // If this driver is already in another RACE slot, remove them from there
                (['p1', 'p2', 'p3'] as const).forEach(key => {
                    if (next[key]?.driverId === driver.driverId) {
                        next[key] = null;
                    }
                });
            }
            // Constraint: Pole Position is independent. 
            // So if I drop on Pole, I don't need to check Race slots.
            // And if I drop on Race, I don't need to check Pole slot.

            // Place the driver
            next[slot] = driver;
            return next;
        });

        setSelectedDriver(null);
        setSaved(false);
    }, [qualiSession.isLocked, raceSession.isLocked]);

    const handleRemove = useCallback((slot: SlotKey) => {
        const isQualiSlot = slot === 'pole';
        const isRaceSlot = ['p1', 'p2', 'p3'].includes(slot);

        if (isQualiSlot && qualiSession.isLocked) return;
        if (isRaceSlot && raceSession.isLocked) return;

        setSlots(prev => ({ ...prev, [slot]: null }));
        setSaved(false);
    }, [qualiSession.isLocked, raceSession.isLocked]);

    // Save Logic (needs to save to BOTH sessions if changed)
    const savePredictions = async () => {
        if (!user || saving) return;
        setSaving(true);
        try {
            // Save Qualifying Prediction
            if (!qualiSession.isLocked) {
                await fetch('/api/game/predictions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        season,
                        round,
                        sessionType: qualiSession.type,
                        pole_driver_id: slots.pole?.driverId || null,
                        // P1-P3 are ignored for Quali session type by backend usually, but we send nulls to be safe
                        p1_driver_id: null,
                        p2_driver_id: null,
                        p3_driver_id: null,
                        is_default: false,
                    }),
                });
            }

            // Save Race Prediction
            if (!raceSession.isLocked) {
                await fetch('/api/game/predictions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        season,
                        round,
                        sessionType: raceSession.type,
                        pole_driver_id: null,
                        p1_driver_id: slots.p1?.driverId || null,
                        p2_driver_id: slots.p2?.driverId || null,
                        p3_driver_id: slots.p3?.driverId || null,
                        is_default: false,
                    }),
                });
            }

            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error('Failed to save', err);
        } finally {
            setSaving(false);
        }
    };

    // Derived state for driver list (who is placed in Race?)
    // Used to optionally dim drivers, though requirement implies we just move them.
    // Let's keep them fully active but maybe highlight if they are in the *current* selection context?
    // Actually, simple is best: just show them. 
    const racePlacedIds = [slots.p1?.driverId, slots.p2?.driverId, slots.p3?.driverId].filter(Boolean) as string[];

    const handleDriverSelect = (driver: GameDriver) => {
        setSelectedDriver(prev => prev?.driverId === driver.driverId ? null : driver);
    };

    const handleSlotClickWithSelected = (slot: SlotKey) => {
        if (selectedDriver) {
            handleDrop(slot, selectedDriver);
        }
    };

    const changesPending = !saved;

    return (
        <div className="space-y-6">
            {/* Header / Save Button */}
            <div className="flex justify-between items-center bg-f1-surface/50 p-3 rounded-xl border border-f1-border/30">
                <div className="flex gap-4">
                    {/* Status Indicators */}
                    <div className="flex flex-col">
                        <span className="text-[10px] text-f1-text-muted uppercase tracking-widest">Qualifying</span>
                        {qualiSession.isLocked ? (
                            <span className="text-xs text-f1-red font-bold flex items-center gap-1"><span className="material-icons text-[14px]">lock</span>Locked</span>
                        ) : <span className="text-xs text-green-500 font-bold">Open</span>}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-f1-text-muted uppercase tracking-widest">Race</span>
                        {raceSession.isLocked ? (
                            <span className="text-xs text-f1-red font-bold flex items-center gap-1"><span className="material-icons text-[14px]">lock</span>Locked</span>
                        ) : <span className="text-xs text-green-500 font-bold">Open</span>}
                    </div>
                </div>

                <button
                    onClick={savePredictions}
                    disabled={saving || (qualiSession.isLocked && raceSession.isLocked)}
                    className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200
                        ${saved
                            ? 'bg-green-600 text-white'
                            : 'bg-f1-red hover:bg-f1-red/80 text-white shadow-lg shadow-f1-red/20'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Prediction'}
                </button>
            </div>

            {/* Drop Zones Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Left: Pole Position */}
                <div className="md:col-span-1">
                    <DropZone
                        label="Pole Position"
                        points={scoring.pole}
                        driver={slots.pole}
                        isLocked={qualiSession.isLocked}
                        isPole
                        onDrop={(d) => selectedDriver ? handleSlotClickWithSelected('pole') : handleDrop('pole', d)}
                        onRemove={() => handleRemove('pole')}
                        onClick={() => handleSlotClickWithSelected('pole')}
                        highlight={!!selectedDriver}
                    />
                </div>

                {/* Right: Race Podium */}
                <div className="md:col-span-3 grid grid-cols-3 gap-3">
                    <DropZone
                        label="P1"
                        points={scoring.p1}
                        driver={slots.p1}
                        isLocked={raceSession.isLocked}
                        onDrop={(d) => handleDrop('p1', d)}
                        onRemove={() => handleRemove('p1')}
                        onClick={() => handleSlotClickWithSelected('p1')}
                        highlight={!!selectedDriver}
                    />
                    <DropZone
                        label="P2"
                        points={scoring.p2}
                        driver={slots.p2}
                        isLocked={raceSession.isLocked}
                        onDrop={(d) => handleDrop('p2', d)}
                        onRemove={() => handleRemove('p2')}
                        onClick={() => handleSlotClickWithSelected('p2')}
                        highlight={!!selectedDriver}
                    />
                    <DropZone
                        label="P3"
                        points={scoring.p3}
                        driver={slots.p3}
                        isLocked={raceSession.isLocked}
                        onDrop={(d) => handleDrop('p3', d)}
                        onRemove={() => handleRemove('p3')}
                        onClick={() => handleSlotClickWithSelected('p3')}
                        highlight={!!selectedDriver}
                    />
                </div>
            </div>

            {/* Driver List */}
            <div className="mt-8">
                <DriverList
                    drivers={drivers}
                    placedDriverIds={racePlacedIds}
                    onSelect={handleDriverSelect}
                    selectedDriverId={selectedDriver?.driverId}
                />
            </div>
        </div>
    );
}
