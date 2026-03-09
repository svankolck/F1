'use client';

import { useEffect, useState } from 'react';
import { Race, SessionTime } from '@/lib/types/f1';

interface RaceWeekendScheduleProps {
  race: Race;
}

type SessionKey =
  | 'FirstPractice'
  | 'SecondPractice'
  | 'ThirdPractice'
  | 'SprintQualifying'
  | 'Sprint'
  | 'Qualifying';

interface SessionConfig {
  key: SessionKey;
  label: string;
}

interface SessionCardItem {
  key: string;
  label: string;
  dateTime: string;
  isRace?: boolean;
}

const SESSION_CONFIG: SessionConfig[] = [
  { key: 'FirstPractice', label: 'FP1' },
  { key: 'SecondPractice', label: 'FP2' },
  { key: 'ThirdPractice', label: 'FP3' },
  { key: 'SprintQualifying', label: 'Sprint Q' },
  { key: 'Sprint', label: 'Sprint' },
  { key: 'Qualifying', label: 'Quali' },
];

function toSessionDateTime(session?: SessionTime): string | null {
  if (!session?.date || !session.time) return null;
  return `${session.date}T${session.time}`;
}

function getSessionItems(race: Race): SessionCardItem[] {
  const sessions = SESSION_CONFIG
    .map((config) => {
      const session = race[config.key];
      const dateTime = toSessionDateTime(session);

      if (!dateTime) return null;

      return {
        key: config.key,
        label: config.label,
        dateTime,
      };
    })
    .filter(Boolean) as SessionCardItem[];

  sessions.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  const raceDateTime = `${race.date}T${race.time || '14:00:00Z'}`;
  sessions.push({
    key: 'Race',
    label: 'Race',
    dateTime: raceDateTime,
    isRace: true,
  });

  return sessions;
}

function formatCountdown(target: string, now: Date): string {
  const diff = new Date(target).getTime() - now.getTime();

  if (diff <= 0) {
    return 'Done';
  }

  const totalMinutes = Math.floor(diff / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function RaceWeekendSchedule({ race }: RaceWeekendScheduleProps) {
  const [now, setNow] = useState(() => new Date());
  const sessions = getSessionItems(race);
  const isSprintWeekend = Boolean(race.Sprint || race.SprintQualifying);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-f1-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
      <div className="flex items-center justify-between gap-3 border-b border-f1-border/60 px-4 py-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-f1-red">Race Weekend</p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-f1-text-muted">
            {isSprintWeekend ? 'Sprint Format' : 'Weekend Schedule'}
          </p>
        </div>
        {isSprintWeekend && (
          <span className="rounded-full border border-orange-500/40 bg-orange-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-orange-300">
            Sprint
          </span>
        )}
      </div>

      <div className="space-y-2 p-2">
        {sessions.map((session) => (
          <div
            key={session.key}
            className={`grid grid-cols-[minmax(0,1.4fr)_42px_64px_58px] items-center gap-2 rounded-xl border px-3 py-2.5 sm:grid-cols-[minmax(0,1.4fr)_52px_72px_64px] ${
              session.isRace
                ? 'border-f1-red/30 bg-[linear-gradient(90deg,rgba(225,6,0,0.16),rgba(225,6,0,0.04))]'
                : 'border-white/6 bg-[linear-gradient(90deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))]'
            }`}
          >
            <span className={`truncate text-sm font-semibold ${session.isRace ? 'text-white' : 'text-f1-text-secondary'}`}>
              {session.label}
            </span>
            <span className="text-right text-[11px] uppercase tracking-wide text-f1-text-muted">
              {new Date(session.dateTime).toLocaleDateString('en-GB', {
                timeZone: 'Europe/Amsterdam',
                weekday: 'short',
              })}
            </span>
            <span className={`text-right text-sm font-mono ${session.isRace ? 'font-bold text-white' : 'text-white/90'}`}>
              {new Date(session.dateTime).toLocaleTimeString('en-GB', {
                timeZone: 'Europe/Amsterdam',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })}
            </span>
            <span className={`text-right text-[11px] font-semibold uppercase tracking-wide ${session.isRace ? 'text-f1-red' : 'text-f1-text-muted'}`}>
              {formatCountdown(session.dateTime, now)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
