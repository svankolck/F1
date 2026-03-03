import Link from 'next/link';
import { Race, getFlagUrl } from '@/lib/types/f1';
import { CIRCUIT_DETAILS } from '@/lib/data/circuits';

interface UpcomingRacesProps {
    races: Race[];
}

function formatDateRange(race: Race): string {
    const candidates = [
        race.FirstPractice?.date,
        race.SprintQualifying?.date,
        race.Sprint?.date,
        race.Qualifying?.date,
        race.date,
    ].filter(Boolean) as string[];

    const sorted = [...new Set(candidates)].sort((a, b) => a.localeCompare(b));
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

export default function UpcomingRaces({ races }: UpcomingRacesProps) {
    if (!races.length) return null;

    return (
        <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h2 className="text-xs font-mono text-f1-red mb-1 uppercase tracking-widest">Upcoming</h2>
                    <h3 className="text-xl md:text-2xl font-bold text-white uppercase tracking-tight">Next Stops</h3>
                </div>
                <Link
                    href="/calendar"
                    className="text-xs md:text-sm font-bold uppercase tracking-wider text-f1-text-secondary hover:text-white transition-colors"
                >
                    View Full Calendar {'->'}
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {races.slice(0, 2).map((race) => {
                    const country = race.Circuit.Location.country;
                    const details = CIRCUIT_DETAILS[race.Circuit.circuitId];

                    return (
                        <Link
                            key={`${race.season}-${race.round}`}
                            href={`/results?season=${race.season}&round=${race.round}`}
                            className="relative overflow-hidden rounded-xl border border-f1-border bg-f1-surface/40 p-4 hover:border-f1-red/40 transition-colors group"
                        >
                            {details?.imageUrl && (
                                <>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={details.imageUrl}
                                        alt={race.raceName}
                                        className="absolute inset-0 h-full w-full object-cover opacity-25 group-hover:opacity-35 transition-opacity"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/90" />
                                </>
                            )}
                            {!details?.imageUrl && (
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(225,6,0,0.25),transparent_55%),linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]" />
                            )}

                            <div className="relative z-10 flex flex-col gap-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={getFlagUrl(country)}
                                            alt={country}
                                            className="w-7 h-5 rounded-sm object-cover"
                                        />
                                        <div>
                                            <p className="text-base font-bold leading-tight">{country}</p>
                                            <p className="text-[11px] uppercase tracking-wider text-f1-text-muted">Round {race.round}</p>
                                        </div>
                                    </div>
                                    {race.Sprint && (
                                        <span className="px-2 py-1 rounded bg-orange-500/20 border border-orange-500/40 text-orange-300 text-[10px] font-bold uppercase tracking-widest">
                                            Sprint
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 text-f1-text-secondary">
                                    <span className="material-icons text-base">calendar_month</span>
                                    <span className="text-sm md:text-base font-semibold tracking-wide">{formatDateRange(race)}</span>
                                </div>

                                <p className="text-xs text-f1-text-muted truncate">{race.Circuit.circuitName}</p>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
