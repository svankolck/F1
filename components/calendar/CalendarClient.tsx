'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Race, getFlagUrl } from '@/lib/types/f1';

interface CalendarClientProps {
  races: Race[];
  season: string;
}

function formatDateRange(race: Race): string {
  const candidates = [
    race.FirstPractice?.date,
    race.SprintQualifying?.date,
    race.Sprint?.date,
    race.Qualifying?.date,
    race.date,
  ].filter(Boolean) as string[];

  const sorted = Array.from(new Set(candidates)).sort((a, b) => a.localeCompare(b));
  const start = sorted[0] || race.date;
  const end = race.date;

  const startDate = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);

  const startDay = startDate.toLocaleDateString('en-GB', { day: '2-digit', timeZone: 'UTC' });
  const endDay = endDate.toLocaleDateString('en-GB', { day: '2-digit', timeZone: 'UTC' });
  const startMonth = startDate.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' }).toUpperCase();
  const endMonth = endDate.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' }).toUpperCase();

  if (start === end) return `${endDay} ${endMonth}`;
  if (startMonth === endMonth) return `${startDay} - ${endDay} ${endMonth}`;

  return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
}

function getRaceWindow(race: Race) {
  return {
    end: new Date(`${race.date}T23:59:59Z`).getTime(),
  };
}

export default function CalendarClient({ races, season }: CalendarClientProps) {
  const now = Date.now();
  const windows = races.map(getRaceWindow);
  const nextRaceIndex = windows.findIndex((window) => now <= window.end);
  const nextRaceRef = useRef<HTMLAnchorElement>(null);
  const hasAutoScrolled = useRef(false);

  useEffect(() => {
    if (hasAutoScrolled.current || nextRaceIndex <= 0 || !nextRaceRef.current) return;
    if (window.scrollY > 40) return;
    if (!window.matchMedia('(max-width: 767px)').matches) return;

    hasAutoScrolled.current = true;
    requestAnimationFrame(() => {
      if (!nextRaceRef.current) return;
      const top = nextRaceRef.current.getBoundingClientRect().top + window.scrollY - 88;
      window.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
    });
  }, [nextRaceIndex]);

  return (
    <div className="flex flex-col gap-2.5">
      {races.map((race, index) => {
        const window = windows[index];
        const isPast = now > window.end;
        const isNext = nextRaceIndex !== -1 && index === nextRaceIndex;

        return (
          <Link
            key={`${race.season}-${race.round}`}
            ref={isNext ? nextRaceRef : null}
            href={`/results?season=${race.season}&round=${race.round}`}
            className={`group rounded-lg border px-3 py-2.5 transition-all duration-200 ${
              isNext
                ? 'bg-f1-red/10 border-f1-red/50 shadow-[0_0_12px_rgba(225,6,0,0.18)]'
                : 'border-f1-border bg-f1-surface/35 hover:border-f1-red/35'
            } ${isPast ? 'opacity-60' : ''}`}
            style={{ borderLeftWidth: 3, borderLeftColor: isNext ? '#e10600' : 'rgba(255,255,255,0.12)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 text-center flex-shrink-0">
                <span className={`text-base font-bold font-mono ${isNext ? 'text-f1-red' : 'text-white'}`}>
                  {String(race.round).padStart(2, '0')}
                </span>
                <p className="text-[8px] font-mono uppercase tracking-widest text-f1-text-muted mt-0.5">Round</p>
              </div>

              <div className="w-8 flex justify-center flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getFlagUrl(race.Circuit.Location.country)}
                  alt={race.Circuit.Location.country}
                  className="w-8 h-6 rounded object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white group-hover:text-f1-red transition-colors truncate">
                  {race.raceName}
                </p>
                <p className="text-[11px] text-f1-text-secondary truncate">
                  {race.Circuit.circuitName} • {race.Circuit.Location.country}
                </p>
              </div>

              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <p className="text-[11px] sm:text-xs font-mono tracking-wider text-f1-text-secondary uppercase whitespace-nowrap">
                  {formatDateRange(race)}
                </p>
                <div className="flex items-center gap-1.5">
                  {race.Sprint && (
                    <span className="px-2 py-0.5 rounded bg-orange-500/20 border border-orange-500/40 text-orange-300 text-[9px] font-bold uppercase tracking-widest">
                      Sprint
                    </span>
                  )}
                  {isNext && (
                    <span className="px-2 py-0.5 rounded bg-f1-red/20 border border-f1-red/40 text-f1-red text-[9px] font-bold uppercase tracking-widest">
                      Next
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-2 text-[10px] uppercase tracking-widest text-f1-text-muted">
              {isPast && (
                <span className="inline-flex items-center gap-1 text-emerald-300">
                  <span className="material-icons text-[12px] leading-none">check</span>
                  Completed
                </span>
              )}
              {!isPast && !isNext && (
                <span>Upcoming</span>
              )}
              {isNext && (
                <span>Upcoming</span>
              )}
              <span className="text-f1-border">•</span>
              <span>{season} season</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
