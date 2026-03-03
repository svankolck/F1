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
import DriverList from './DriverList';
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

const EMPTY_SLOTS: SessionSlots = {
  pole: null,
  p1: null,
  p2: null,
  p3: null,
};

function hasPoleSlot(sessionType: GameSessionType) {
  return sessionType === 'qualifying' || sessionType === 'sprint_qualifying';
}

function getScoring(sessionType: GameSessionType) {
  const isSprint = sessionType === 'sprint' || sessionType === 'sprint_qualifying';
  return isSprint ? SPRINT_SCORING : RACE_SCORING;
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

function getSessionStatus(session: SessionSchedule) {
  if (session.isCompleted) return 'Completed';
  if (session.isLocked) return 'Locked';
  return 'Open';
}

function getStatusClasses(status: string) {
  if (status === 'Open') return 'text-emerald-300 border-emerald-400/40 bg-emerald-500/10';
  if (status === 'Locked') return 'text-amber-300 border-amber-400/40 bg-amber-500/10';
  return 'text-f1-text-secondary border-f1-border/60 bg-f1-surface/40';
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
  const [pickerTarget, setPickerTarget] = useState<{ session: SessionSchedule; slot: SlotKey } | null>(null);
  const [slotsBySession, setSlotsBySession] = useState<Record<GameSessionType, SessionSlots>>({
    qualifying: { ...EMPTY_SLOTS },
    race: { ...EMPTY_SLOTS },
    sprint_qualifying: { ...EMPTY_SLOTS },
    sprint: { ...EMPTY_SLOTS },
  });
  const [dirtySessions, setDirtySessions] = useState<Record<GameSessionType, boolean>>({
    qualifying: false,
    race: false,
    sprint_qualifying: false,
    sprint: false,
  });
  const [savingSessions, setSavingSessions] = useState<Record<GameSessionType, boolean>>({
    qualifying: false,
    race: false,
    sprint_qualifying: false,
    sprint: false,
  });

  const driverMap = useMemo(() => {
    const map = new Map<string, GameDriver>();
    for (const driver of drivers) map.set(driver.driverId, driver);
    return map;
  }, [drivers]);

  useEffect(() => {
    const nextState: Record<GameSessionType, SessionSlots> = {
      qualifying: initialSlotsFromPrediction(predictions.qualifying),
      race: initialSlotsFromPrediction(predictions.race),
      sprint_qualifying: initialSlotsFromPrediction(predictions.sprint_qualifying),
      sprint: initialSlotsFromPrediction(predictions.sprint),
    };

    setSlotsBySession(nextState);
    setDirtySessions({
      qualifying: false,
      race: false,
      sprint_qualifying: false,
      sprint: false,
    });
  }, [predictions]);

  const sprintSessions = sessions.filter((s) => s.type === 'sprint_qualifying' || s.type === 'sprint');
  const grandPrixSessions = sessions.filter((s) => s.type === 'qualifying' || s.type === 'race');

  const unsavedCount = Object.values(dirtySessions).filter(Boolean).length;

  const setSlot = (session: SessionSchedule, slot: SlotKey, driver: GameDriver) => {
    if (session.isLocked) return;

    setSlotsBySession((prev) => {
      const next = { ...prev };
      const current = { ...next[session.type] };
      const hasPole = hasPoleSlot(session.type);

      if (hasPole) {
        current.pole = driver.driverId;
        current.p1 = null;
        current.p2 = null;
        current.p3 = null;
      } else {
        // Uniqueness only inside the same race/sprint session.
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

    setDirtySessions((prev) => ({ ...prev, [session.type]: true }));
    setSelectedDriver(null);
  };

  const removeSlot = (session: SessionSchedule, slot: SlotKey) => {
    if (session.isLocked) return;

    setSlotsBySession((prev) => ({
      ...prev,
      [session.type]: {
        ...prev[session.type],
        [slot]: null,
      },
    }));
    setDirtySessions((prev) => ({ ...prev, [session.type]: true }));
  };

  const saveSession = async (session: SessionSchedule) => {
    if (session.isLocked || savingSessions[session.type]) return;

    const hasPole = hasPoleSlot(session.type);
    const slots = slotsBySession[session.type];

    setSavingSessions((prev) => ({ ...prev, [session.type]: true }));
    try {
      const payload = {
        season,
        round,
        sessionType: session.type,
        pole_driver_id: hasPole ? slots.pole : null,
        p1_driver_id: hasPole ? null : slots.p1,
        p2_driver_id: hasPole ? null : slots.p2,
        p3_driver_id: hasPole ? null : slots.p3,
        is_default: false,
      };

      const res = await fetch('/api/game/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to save prediction' }));
        throw new Error(err.error || 'Failed to save prediction');
      }

      const saved = (await res.json()) as Prediction;
      onPredictionSaved(session.type, saved);
      setDirtySessions((prev) => ({ ...prev, [session.type]: false }));
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to save prediction';
      alert(msg);
    } finally {
      setSavingSessions((prev) => ({ ...prev, [session.type]: false }));
    }
  };

  const saveAll = async () => {
    for (const session of sessions) {
      if (dirtySessions[session.type] && !session.isLocked) {
        // eslint-disable-next-line no-await-in-loop
        await saveSession(session);
      }
    }
  };

  const resolveDriver = (driverId: string | null) => (driverId ? driverMap.get(driverId) || null : null);

  const handleSlotClick = (session: SessionSchedule, slot: SlotKey) => {
    if (session.isLocked) return;
    if (selectedDriver) {
      setSlot(session, slot, selectedDriver);
      return;
    }
    setPickerTarget({ session, slot });
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
    const status = getSessionStatus(session);

    return (
      <div key={session.type} className="rounded-2xl border border-f1-border/50 bg-f1-surface/35 p-4 md:p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-bold tracking-tight">{session.label}</p>
            <p className="text-xs text-f1-text-secondary">
              {new Date(session.startTime).toLocaleString('en-GB', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Europe/Amsterdam',
              })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusClasses(status)}`}>
              {status}
            </span>
            {!session.isLocked && (
              <button
                onClick={() => saveSession(session)}
                disabled={savingSessions[session.type] || !dirtySessions[session.type]}
                className="px-3 py-1.5 rounded-lg bg-f1-red hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider"
              >
                {savingSessions[session.type] ? 'Saving...' : dirtySessions[session.type] ? 'Save' : 'Saved'}
              </button>
            )}
          </div>
        </div>

        {hasPole ? (
          <div className="max-w-[220px]">
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
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {(['p1', 'p2', 'p3'] as const).map((slotKey) => (
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
    <div className="space-y-6">
      <section className="rounded-2xl border border-f1-border/50 bg-f1-surface/20 p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h3 className="text-sm font-bold uppercase tracking-widest text-f1-text-secondary">Weekend Status</h3>
          <span className="text-xs text-f1-text-muted">Open = predictions can still be edited</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {sessions.map((session) => {
            const status = getSessionStatus(session);
            return (
              <div key={`status-${session.type}`} className="rounded-lg border border-f1-border/40 px-3 py-2 bg-black/20">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider">{session.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusClasses(status)}`}>
                    {status}
                  </span>
                </div>
                <p className="text-[11px] text-f1-text-muted mt-1">
                  {new Date(session.startTime).toLocaleString('en-GB', {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Europe/Amsterdam',
                  })}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {sprintSessions.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-3xl font-bold tracking-tight">Sprint</h3>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">{sprintSessions.map(renderSessionCard)}</div>
        </section>
      )}

      <section className="space-y-3">
        <h3 className="text-3xl font-bold tracking-tight">Grand Prix</h3>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">{grandPrixSessions.map(renderSessionCard)}</div>
      </section>

      <section className="space-y-3 rounded-2xl border border-f1-border/50 bg-f1-surface/20 p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-3xl font-bold tracking-tight">Drivers</h3>
            <p className="text-f1-text-secondary text-sm">Drag or tap a driver and place them in any session slot.</p>
            {selectedDriver && (
              <p className="text-xs text-f1-red mt-1">
                Selected: <span className="font-bold">{selectedDriver.firstName} {selectedDriver.lastName}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {unsavedCount > 0 && (
              <span className="px-2 py-1 rounded-full bg-f1-red/20 border border-f1-red/40 text-f1-red text-[10px] font-bold uppercase tracking-widest">
                {unsavedCount} unsaved
              </span>
            )}
            <button
              onClick={saveAll}
              disabled={unsavedCount === 0}
              className="px-4 py-2 rounded-lg border border-f1-border hover:border-f1-red/40 bg-f1-surface/40 hover:bg-f1-red/10 transition-colors text-sm font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save All Changes
            </button>
          </div>
        </div>

        <DriverList
          drivers={drivers}
          placedDriverIds={[]}
          onSelect={(driver) => setSelectedDriver((prev) => (prev?.driverId === driver.driverId ? null : driver))}
          selectedDriverId={selectedDriver?.driverId || null}
        />
      </section>

      {pickerTarget && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/70 p-3 sm:p-6">
          <div className="w-full max-w-4xl rounded-2xl border border-f1-border bg-f1-bg p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-f1-text-muted">Select Driver</p>
                <h4 className="text-lg font-bold">
                  {pickerTarget.session.label} - {pickerTarget.slot.toUpperCase()}
                </h4>
              </div>
              <button
                onClick={() => setPickerTarget(null)}
                className="w-8 h-8 rounded-full border border-f1-border hover:border-f1-red/40 flex items-center justify-center"
                aria-label="Close driver picker"
              >
                <span className="material-icons text-sm">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 max-h-[60vh] overflow-y-auto p-1">
              {drivers.map((driver) => (
                <DriverCard
                  key={`picker-${driver.driverId}`}
                  driver={driver}
                  onSelect={selectDriverFromPicker}
                  compact={false}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
