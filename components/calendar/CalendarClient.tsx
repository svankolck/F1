'use client';

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

  return (
    <div className="flex flex-col gap-3">
      {races.map((race, index) => {
        const window = windows[index];
        const isPast = now > window.end;
        const isNext = nextRaceIndex !== -1 && index === nextRaceIndex;

        return (
          <Link
            key={`${race.season}-${race.round}`}
            href={`/results?season=${race.season}&round=${race.round}`}
            className={`relative rounded-xl p-4 border transition-all ${
              isNext
                ? 'border-f1-red shadow-[0_0_18px_rgba(225,6,0,0.25)] bg-f1-red/5'
                : 'border-f1-border bg-f1-surface/35 hover:border-f1-red/35'
            } ${isPast ? 'opacity-60' : ''}`}
          >
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
              <div className="flex items-center gap-3 min-w-[130px]">
                <div className="w-9 h-9 rounded-lg bg-black/40 border border-f1-border flex items-center justify-center font-mono text-sm font-bold text-f1-red">
                  {String(race.round).padStart(2, '0')}
                </div>
                {isPast && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300">
                    <span className="material-icons text-[12px] leading-none">check</span>
                  </span>
                )}
              </div>

              <div className="flex items-start gap-3 flex-1 min-w-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getFlagUrl(race.Circuit.Location.country)}
                  alt={race.Circuit.Location.country}
                  className="w-8 h-6 rounded object-cover mt-0.5"
                />
                <div className="min-w-0">
                  <p className="text-base md:text-lg font-bold leading-tight truncate">{race.Circuit.Location.country}</p>
                  <p className="text-sm text-f1-text-secondary truncate">{race.Circuit.circuitName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 md:justify-end">
                <p className="text-sm md:text-base font-mono tracking-wider text-f1-text-secondary uppercase whitespace-nowrap">
                  {formatDateRange(race)}
                </p>
                {race.Sprint && (
                  <span className="px-2 py-1 rounded bg-orange-500/20 border border-orange-500/40 text-orange-300 text-[10px] font-bold uppercase tracking-widest">
                    Sprint
                  </span>
                )}
                {isNext && (
                  <span className="px-2 py-1 rounded bg-f1-red/20 border border-f1-red/40 text-f1-red text-[10px] font-bold uppercase tracking-widest">
                    Next
                  </span>
                )}
              </div>
            </div>

            <div className="mt-3 text-[11px] uppercase tracking-widest text-f1-text-muted">
              {season} season
            </div>
          </Link>
        );
      })}
    </div>
  );
}
