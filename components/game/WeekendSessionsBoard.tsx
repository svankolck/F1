'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  GameDriver,
  GameSessionType,
  Prediction,
  RACE_SCORING,
  SPRINT_SCORING,
  SessionSchedule,
} from '@/lib/types/f1';
import DropZone from './DropZone';
import DriverCard from './DriverCard';

interface WeekendSessionsBoardProps {
  drivers: GameDriver[];
  season: number;
  round: number;
  sessions: SessionSchedule[];
  predictions: Record<GameSessionType, Prediction | null>;
  onPredictionSaved: (sessionType: GameSessionType, prediction: Prediction) => void;
}

type SlotKey = 'pole' | 'p1' | 'p2' | 'p3';
type SessionSlots = Record<SlotKey, string | null>;

const EMPTY_SLOTS: SessionSlots = { pole: null, p1: null, p2: null, p3: null };

function hasPoleSlot(sessionType: GameSessionType) {
  return sessionType === 'qualifying' || sessionType === 'sprint_qualifying';
}

function getScoring(sessionType: GameSessionType) {
  return (sessionType === 'sprint' || sessionType === 'sprint_qualifying') ? SPRINT_SCORING : RACE_SCORING;
}

function initialSlotsFromPrediction(prediction: Prediction | null): SessionSlots {
  if (!prediction) return { ...EMPTY_SLOTS };
  return {
    pole: prediction.pole_driver_id,
    p1: prediction.p1_driver_id,
    p2: prediction.p2_driver_id,
    p3: prediction.p3_driver_id,
  };
}

export default function WeekendSessionsBoard({
  drivers,
  season,
  round,
  sessions,
  predictions,
  onPredictionSaved,
}: WeekendSessionsBoardProps) {
  const [selectedDriver, setSelectedDriver] = useState<GameDriver | null>(null);
  const [showDrivers, setShowDrivers] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<{ session: SessionSchedule; slot: SlotKey } | null>(null);
  const [slotsBySession, setSlotsBySession] = useState<Record<GameSessionType, SessionSlots>>({
    qualifying: { ...EMPTY_SLOTS },
    race: { ...EMPTY_SLOTS },
    sprint_qualifying: { ...EMPTY_SLOTS },
    sprint: { ...EMPTY_SLOTS },
  });
  const [dirtySessions, setDirtySessions] = useState<Record<GameSessionType, boolean>>({
    qualifying: false, race: false, sprint_qualifying: false, sprint: false,
  });
  const [savingSessions, setSavingSessions] = useState<Record<GameSessionType, boolean>>({
    qualifying: false, race: false, sprint_qualifying: false, sprint: false,
  });

  const driverMap = useMemo(() => {
    const map = new Map<string, GameDriver>();
    for (const driver of drivers) map.set(driver.driverId, driver);
    return map;
  }, [drivers]);

  useEffect(() => {
    setSlotsBySession({
      qualifying: initialSlotsFromPrediction(predictions.qualifying),
      race: initialSlotsFromPrediction(predictions.race),
      sprint_qualifying: initialSlotsFromPrediction(predictions.sprint_qualifying),
      sprint: initialSlotsFromPrediction(predictions.sprint),
    });
    setDirtySessions({ qualifying: false, race: false, sprint_qualifying: false, sprint: false });
  }, [predictions]);

  const sprintSessions = sessions.filter(s => s.type === 'sprint_qualifying' || s.type === 'sprint');
  const grandPrixSessions = sessions.filter(s => s.type === 'qualifying' || s.type === 'race');
  const unsavedCount = Object.values(dirtySessions).filter(Boolean).length;

  const setSlot = (session: SessionSchedule, slot: SlotKey, driver: GameDriver) => {
    if (session.isLocked) return;
    setSlotsBySession(prev => {
      const next = { ...prev };
      const current = { ...next[session.type] };
      if (hasPoleSlot(session.type)) {
        current.pole = driver.driverId;
        current.p1 = null;
        current.p2 = null;
        current.p3 = null;
      } else {
        for (const key of ['p1', 'p2', 'p3'] as const) {
          if (current[key] === driver.driverId) current[key] = null;
        }
        if (slot === 'p1' || slot === 'p2' || slot === 'p3') {
          current[slot] = driver.driverId;
        }
        current.pole = null;
      }
      next[session.type] = current;
      return next;
    });
    setDirtySessions(prev => ({ ...prev, [session.type]: true }));
    setSelectedDriver(null);
  };

  const removeSlot = (session: SessionSchedule, slot: SlotKey) => {
    if (session.isLocked) return;
    setSlotsBySession(prev => ({
      ...prev,
      [session.type]: { ...prev[session.type], [slot]: null },
    }));
    setDirtySessions(prev => ({ ...prev, [session.type]: true }));
  };

  const saveSession = async (session: SessionSchedule) => {
    if (session.isLocked || savingSessions[session.type]) return;
    const hasPole = hasPoleSlot(session.type);
    const slots = slotsBySession[session.type];
    setSavingSessions(prev => ({ ...prev, [session.type]: true }));
    try {
      const res = await fetch('/api/game/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          season, round,
          sessionType: session.type,
          pole_driver_id: hasPole ? slots.pole : null,
          p1_driver_id: hasPole ? null : slots.p1,
          p2_driver_id: hasPole ? null : slots.p2,
          p3_driver_id: hasPole ? null : slots.p3,
          is_default: false,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed' }));
        throw new Error(err.error || 'Failed to save');
      }
      const saved = (await res.json()) as Prediction;
      onPredictionSaved(session.type, saved);
      setDirtySessions(prev => ({ ...prev, [session.type]: false }));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setSavingSessions(prev => ({ ...prev, [session.type]: false }));
    }
  };

  const saveAll = async () => {
    for (const session of sessions) {
      if (dirtySessions[session.type] && !session.isLocked) {
        await saveSession(session);
      }
    }
  };

  const resolveDriver = (driverId: string | null) =>
    driverId ? driverMap.get(driverId) || null : null;

  const handleSlotClick = (session: SessionSchedule, slot: SlotKey) => {
    if (session.isLocked) return;
    if (selectedDriver) {
      setSlot(session, slot, selectedDriver);
    } else {
      // Open popup picker
      setPickerTarget({ session, slot });
    }
  };

  const selectDriverFromPicker = (driver: GameDriver) => {
    if (!pickerTarget) return;
    setSlot(pickerTarget.session, pickerTarget.slot, driver);
    setPickerTarget(null);
  };

  const renderSessionCard = (session: SessionSchedule) => {
    const hasPole = hasPoleSlot(session.type);
    const scoring = getScoring(session.type);
    const slots = slotsBySession[session.type];
    const isOpen = !session.isLocked && !session.isCompleted;

    return (
      <div key={session.type} className="rounded-xl border border-f1-border/40 bg-f1-surface/25 p-3 space-y-2">
        {/* Header row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider">{session.label}</h4>
            {session.isLocked ? (
              <span className="flex items-center gap-0.5 text-[9px] text-amber-400">
                <span className="material-icons text-[11px]">lock</span>Locked
              </span>
            ) : session.isCompleted ? (
              <span className="text-[9px] text-f1-text-muted">Done</span>
            ) : (
              <span className="text-[9px] text-emerald-400 font-bold">Open</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-f1-text-muted">
              {new Date(session.startTime).toLocaleString('en-GB', {
                weekday: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam',
              })}
            </span>
            {isOpen && (
              <button
                onClick={() => saveSession(session)}
                disabled={savingSessions[session.type] || !dirtySessions[session.type]}
                className="px-2 py-1 rounded-md bg-f1-red hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[10px] font-bold uppercase tracking-wider"
              >
                {savingSessions[session.type] ? '...' : dirtySessions[session.type] ? 'Save' : '✓'}
              </button>
            )}
          </div>
        </div>

        {/* Slots */}
        {hasPole ? (
          <DropZone
            label="Pole"
            points={scoring.pole}
            driver={resolveDriver(slots.pole)}
            isLocked={session.isLocked}
            isPole
            onDrop={(driver) => setSlot(session, 'pole', driver)}
            onRemove={() => removeSlot(session, 'pole')}
            onClick={() => handleSlotClick(session, 'pole')}
            highlight={!!selectedDriver}
          />
        ) : (
          <div className="space-y-1.5">
            {(['p1', 'p2', 'p3'] as const).map(slotKey => (
              <DropZone
                key={`${session.type}-${slotKey}`}
                label={slotKey.toUpperCase()}
                points={scoring[slotKey]}
                driver={resolveDriver(slots[slotKey])}
                isLocked={session.isLocked}
                onDrop={(driver) => setSlot(session, slotKey, driver)}
                onRemove={() => removeSlot(session, slotKey)}
                onClick={() => handleSlotClick(session, slotKey)}
                highlight={!!selectedDriver}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Sprint Sessions */}
      {sprintSessions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-orange-400 flex items-center gap-1.5">
            <span className="material-icons text-sm">bolt</span>Sprint Weekend
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {sprintSessions.map(renderSessionCard)}
          </div>
        </div>
      )}

      {/* Grand Prix Sessions */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-widest text-f1-text-secondary flex items-center gap-1.5">
          <span className="material-icons text-sm">flag</span>Grand Prix
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {grandPrixSessions.map(renderSessionCard)}
        </div>
      </div>

      {/* Driver Selection */}
      <div className="rounded-xl border border-f1-border/40 bg-f1-surface/25 p-3">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setShowDrivers(!showDrivers)}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-f1-text-secondary hover:text-white transition-colors"
          >
            <span className="material-icons text-sm">{showDrivers ? 'expand_less' : 'expand_more'}</span>
            {selectedDriver ? (
              <span className="text-f1-red">Selected: {selectedDriver.code} — Tap a slot</span>
            ) : (
              'Select Driver'
            )}
          </button>

          <div className="flex items-center gap-2">
            {unsavedCount > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-f1-red/20 border border-f1-red/30 text-f1-red text-[9px] font-bold">
                {unsavedCount} unsaved
              </span>
            )}
            <button
              onClick={saveAll}
              disabled={unsavedCount === 0}
              className="px-3 py-1.5 rounded-md border border-f1-border hover:border-f1-red/40 bg-f1-surface/40 hover:bg-f1-red/10 text-[10px] font-bold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Save All
            </button>
          </div>
        </div>

        {showDrivers && (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-1.5 mt-3 max-h-[200px] overflow-y-auto">
            {drivers.map(driver => (
              <DriverCard
                key={`pick-${driver.driverId}`}
                driver={driver}
                onSelect={(d) => {
                  setSelectedDriver(prev => prev?.driverId === d.driverId ? null : d);
                  setShowDrivers(false);
                }}
                compact
              />
            ))}
          </div>
        )}
      </div>

      {/* Driver Picker Modal */}
      {pickerTarget && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/70 p-3 sm:p-6"
          onClick={() => setPickerTarget(null)}
        >
          <div className="w-full max-w-3xl rounded-2xl border border-f1-border bg-f1-bg p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-f1-text-muted">Select Driver</p>
                <h4 className="text-sm font-bold">
                  {pickerTarget.session.label} — {pickerTarget.slot.toUpperCase()}
                </h4>
              </div>
              <button
                onClick={() => setPickerTarget(null)}
                className="w-7 h-7 rounded-full border border-f1-border hover:border-f1-red/40 flex items-center justify-center"
              >
                <span className="material-icons text-sm">close</span>
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-[50vh] overflow-y-auto">
              {drivers.map(driver => (
                <DriverCard
                  key={`picker-${driver.driverId}`}
                  driver={driver}
                  onSelect={selectDriverFromPicker}
                  compact
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
