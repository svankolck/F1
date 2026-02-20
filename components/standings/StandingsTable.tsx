'use client';

import Link from 'next/link';
import { DriverStanding, ConstructorStanding, getTeamColor, getDriverImageUrl, getTeamLogoUrl } from '@/lib/types/f1';

interface DriverStandingsTableProps {
    type: 'drivers';
    standings: DriverStanding[];
    previousStandings?: DriverStanding[];
    season?: string;
    round?: string;
}

interface ConstructorStandingsTableProps {
    type: 'constructors';
    standings: ConstructorStanding[];
    previousStandings?: ConstructorStanding[];
    season?: string;
    round?: string;
}

type StandingsTableProps = DriverStandingsTableProps | ConstructorStandingsTableProps;

function getPositionDelta(
    currentPos: string,
    previousStandings: (DriverStanding | ConstructorStanding)[] | undefined,
    id: string,
    type: 'drivers' | 'constructors'
): number | null {
    if (!previousStandings || previousStandings.length === 0) return null;

    const prevEntry = previousStandings.find((s) => {
        if (type === 'drivers') {
            return (s as DriverStanding).Driver.driverId === id;
        }
        return (s as ConstructorStanding).Constructor.constructorId === id;
    });

    if (!prevEntry) return null; // New entry
    const delta = parseInt(prevEntry.position) - parseInt(currentPos);
    return delta;
}

export default function StandingsTable(props: StandingsTableProps) {
    const { season, round } = props;
    const { type, standings, previousStandings } = props;

    if (!standings || standings.length === 0) {
        return (
            <div className="glass-card p-8 text-center">
                <span className="material-icons text-3xl text-f1-text-muted mb-2 block">info</span>
                <p className="text-f1-text-secondary">No standings data available for this round.</p>
            </div>
        );
    }

    if (type === 'drivers') {
        return (
            <div className="flex flex-col gap-1.5">
                {(standings as DriverStanding[]).map((standing, idx) => {
                    const teamColor = getTeamColor(standing.Constructors[0]?.constructorId || '');
                    const driverImg = getDriverImageUrl(standing.Driver.driverId);
                    const delta = getPositionDelta(
                        standing.position,
                        previousStandings,
                        standing.Driver.driverId,
                        'drivers'
                    );

                    return (
                        <Link
                            key={standing.Driver.driverId}
                            href={`/standings/${standing.Driver.driverId}?season=${season || ''}&round=${round || ''}`}
                            className="group"
                        >
                            <div
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-f1-surface/80 ${idx < 3 ? 'bg-f1-surface/40' : 'bg-f1-surface/20'
                                    }`}
                                style={{ borderLeft: `3px solid ${teamColor}` }}
                            >
                                {/* Position */}
                                <div className="w-7 text-center">
                                    <span className={`text-base font-bold font-mono ${idx === 0 ? 'text-f1-red' : idx < 3 ? 'text-white' : 'text-f1-text-muted'
                                        }`}>
                                        {standing.position}
                                    </span>
                                </div>

                                {/* Delta */}
                                <div className="w-8 text-center">
                                    {delta !== null && delta !== 0 ? (
                                        <span className={`text-xs font-bold ${delta > 0 ? 'text-green-400' : 'text-red-400'
                                            }`}>
                                            {delta > 0 ? `▲${delta}` : `▼${Math.abs(delta)}`}
                                        </span>
                                    ) : delta === 0 ? (
                                        <span className="text-xs text-f1-text-muted">—</span>
                                    ) : null}
                                </div>

                                {/* Driver photo */}
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-f1-surface flex-shrink-0">
                                    {driverImg ? (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img
                                            src={driverImg}
                                            alt={standing.Driver.familyName}
                                            className="w-full h-full object-cover object-top"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-f1-text-muted text-xs font-bold">
                                            {standing.Driver.code}
                                        </div>
                                    )}
                                </div>

                                {/* Driver name + team */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm font-bold text-white group-hover:text-f1-red transition-colors truncate">
                                            {standing.Driver.givenName}{' '}
                                            <span className="uppercase">{standing.Driver.familyName}</span>
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-f1-text-muted uppercase tracking-widest">
                                        {standing.Constructors[0]?.name || '—'}
                                    </span>
                                </div>

                                {/* Wins */}
                                {parseInt(standing.wins) > 0 && (
                                    <div className="hidden sm:flex items-center gap-1">
                                        <span className="text-[10px] text-f1-text-muted uppercase">Wins</span>
                                        <span className="text-xs font-bold text-f1-red font-mono">{standing.wins}</span>
                                    </div>
                                )}

                                {/* Points */}
                                <div className="text-right ml-auto pl-3">
                                    <span className="text-lg font-bold font-mono text-white">{standing.points}</span>
                                    <span className="text-xs text-f1-text-muted ml-1 hidden sm:inline">PTS</span>
                                </div>

                                {/* Arrow */}
                                <span className="material-icons text-f1-text-muted text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                    chevron_right
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </div>
        );
    }

    // Constructors
    return (
        <div className="flex flex-col gap-1.5">
            {(standings as ConstructorStanding[]).map((standing, idx) => {
                const teamColor = getTeamColor(standing.Constructor.constructorId);
                const delta = getPositionDelta(
                    standing.position,
                    previousStandings,
                    standing.Constructor.constructorId,
                    'constructors'
                );

                return (
                    <div
                        key={standing.Constructor.constructorId}
                        className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 hover:bg-f1-surface/80 ${idx < 3 ? 'bg-f1-surface/40' : 'bg-f1-surface/20'
                            }`}
                        style={{ borderLeft: `3px solid ${teamColor}` }}
                    >
                        {/* Position */}
                        <div className="w-7 text-center">
                            <span className={`text-base font-bold font-mono ${idx === 0 ? 'text-f1-red' : idx < 3 ? 'text-white' : 'text-f1-text-muted'
                                }`}>
                                {standing.position}
                            </span>
                        </div>

                        {/* Delta */}
                        <div className="w-8 text-center">
                            {delta !== null && delta !== 0 ? (
                                <span className={`text-xs font-bold ${delta > 0 ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                    {delta > 0 ? `▲${delta}` : `▼${Math.abs(delta)}`}
                                </span>
                            ) : delta === 0 ? (
                                <span className="text-xs text-f1-text-muted">—</span>
                            ) : null}
                        </div>

                        {/* Team logo */}
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 p-1"
                            style={{ backgroundColor: `${teamColor}20`, border: `1px solid ${teamColor}40` }}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={getTeamLogoUrl(standing.Constructor.constructorId)}
                                alt={standing.Constructor.name}
                                className="w-full h-full object-contain"
                            />
                        </div>

                        {/* Team name */}
                        <div className="flex-1 min-w-0">
                            <span className="text-sm font-bold text-white truncate block">
                                {standing.Constructor.name}
                            </span>
                            <span className="text-[10px] text-f1-text-muted uppercase tracking-widest">
                                {standing.Constructor.nationality}
                            </span>
                        </div>

                        {/* Wins */}
                        {parseInt(standing.wins) > 0 && (
                            <div className="hidden sm:flex items-center gap-1">
                                <span className="text-[10px] text-f1-text-muted uppercase">Wins</span>
                                <span className="text-xs font-bold text-f1-red font-mono">{standing.wins}</span>
                            </div>
                        )}

                        {/* Points */}
                        <div className="text-right ml-auto pl-3">
                            <span className="text-lg font-bold font-mono text-white">{standing.points}</span>
                            <span className="text-xs text-f1-text-muted ml-1 hidden sm:inline">PTS</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
