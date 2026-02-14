import { getDriverStandings, getRaceResults, getRaceCalendar } from '@/lib/api/jolpica';
import { getTeamColor, getDriverImageUrl, getFlagUrl } from '@/lib/types/f1';
import Link from 'next/link';

export const revalidate = 300;

interface DriverDetailPageProps {
    params: Promise<{ driverId: string }>;
    searchParams: Promise<{ season?: string; round?: string }>;
}

export default async function DriverDetailPage({ params, searchParams }: DriverDetailPageProps) {
    const { driverId } = await params;
    const resolvedSearchParams = await searchParams;
    const currentYear = new Date().getFullYear().toString();
    const season = resolvedSearchParams.season || currentYear;
    const round = resolvedSearchParams.round;

    // Fetch standings and race calendar for the requested season
    const [standings, races] = await Promise.all([
        getDriverStandings(season).catch(() => []),
        getRaceCalendar(season).catch(() => []),
    ]);

    const driver = standings.find((s) => s.Driver.driverId === driverId);

    if (!driver) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <span className="material-icons text-6xl text-f1-text-muted">person_off</span>
                <h1 className="text-2xl font-bold">Driver Not Found</h1>
                <Link href={`/standings?season=${season}${round ? `&round=${round}` : ''}`} className="text-f1-red hover:underline text-sm">
                    ← Back to Standings
                </Link>
            </div>
        );
    }

    const teamColor = getTeamColor(driver.Constructors[0]?.constructorId || '');
    const driverImg = getDriverImageUrl(driverId);

    // Fetch race-by-race results for this driver
    const now = new Date();
    const completedRaces = races.filter((r) => {
        const raceDate = new Date(`${r.date}T${r.time || '23:59:59Z'}`);
        return raceDate < now;
    });

    // Fetch results for each completed race (max 24 parallel requests)
    const raceResults = await Promise.all(
        completedRaces.map(async (race) => {
            try {
                const { results } = await getRaceResults(season, race.round);
                const driverResult = results.find((r) => r.Driver.driverId === driverId);
                return {
                    round: race.round,
                    raceName: race.raceName,
                    country: race.Circuit.Location.country,
                    circuitName: race.Circuit.circuitName,
                    date: race.date,
                    position: driverResult?.position || 'DNF',
                    points: driverResult?.points || '0',
                    grid: driverResult?.grid || '—',
                    status: driverResult?.status || '—',
                    fastestLap: driverResult?.FastestLap?.rank === '1',
                };
            } catch {
                return null;
            }
        })
    );

    const validResults = raceResults.filter(Boolean) as NonNullable<typeof raceResults[number]>[];

    // Calculate cumulative points for chart data
    let cumulative = 0;
    const pointsProgression = validResults.map((r) => {
        cumulative += parseFloat(r.points);
        return { round: r.round, country: r.country, points: cumulative };
    });

    return (
        <div className="flex flex-col gap-6 w-full">
            {/* Back button */}
            <Link
                href={`/standings?season=${season}${round ? `&round=${round}` : ''}`}
                className="flex items-center gap-1 text-f1-text-muted hover:text-white transition-colors w-fit text-sm"
            >
                <span className="material-icons text-sm">arrow_back</span>
                Back to Standings
            </Link>

            {/* Driver header */}
            <div
                className="relative glass-card p-6 md:p-8 overflow-hidden"
                style={{ borderTop: `4px solid ${teamColor}` }}
            >
                {/* Background number watermark */}
                <div className="absolute top-0 right-4 text-[120px] md:text-[180px] font-bold text-white/[0.03] leading-none select-none">
                    {driver.Driver.permanentNumber || driver.position}
                </div>

                <div className="flex flex-col sm:flex-row items-start gap-6 relative z-10">
                    {/* Photo */}
                    {driverImg && (
                        <div className="w-28 h-28 md:w-36 md:h-36 rounded-xl overflow-hidden bg-f1-surface flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={driverImg}
                                alt={`${driver.Driver.givenName} ${driver.Driver.familyName}`}
                                className="w-full h-full object-cover object-top"
                            />
                        </div>
                    )}

                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <div
                                className="w-1.5 h-6 rounded-full"
                                style={{ backgroundColor: teamColor }}
                            />
                            <span className="text-xs text-f1-text-muted uppercase tracking-widest font-bold">
                                {driver.Constructors[0]?.name || '—'}
                            </span>
                        </div>

                        <h1 className="text-3xl md:text-5xl font-bold uppercase tracking-tight mb-1">
                            {driver.Driver.givenName}{' '}
                            <span className="text-white/90">{driver.Driver.familyName}</span>
                        </h1>

                        <div className="flex flex-wrap items-center gap-4 mt-3">
                            <div className="glass-card px-3 py-1.5">
                                <span className="text-[10px] text-f1-text-muted block">Position</span>
                                <span className="text-xl font-bold font-mono text-f1-red">P{driver.position}</span>
                            </div>
                            <div className="glass-card px-3 py-1.5">
                                <span className="text-[10px] text-f1-text-muted block">Points</span>
                                <span className="text-xl font-bold font-mono">{driver.points}</span>
                            </div>
                            <div className="glass-card px-3 py-1.5">
                                <span className="text-[10px] text-f1-text-muted block">Wins</span>
                                <span className="text-xl font-bold font-mono">{driver.wins}</span>
                            </div>
                            <div className="glass-card px-3 py-1.5">
                                <span className="text-[10px] text-f1-text-muted block">Nationality</span>
                                <span className="text-sm font-bold">{driver.Driver.nationality}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Points progression — simple bar chart */}
            {pointsProgression.length > 0 && (
                <section>
                    <h2 className="text-xs font-mono text-f1-red mb-3 uppercase tracking-widest">
                        Points Progression
                    </h2>
                    <div className="glass-card p-4 md:p-6">
                        <div className="flex items-stretch gap-1 h-40 md:h-48">
                            {pointsProgression.map((point, idx) => {
                                const maxPts = pointsProgression[pointsProgression.length - 1].points || 1;
                                const height = (point.points / maxPts) * 100;
                                return (
                                    <div
                                        key={point.round}
                                        className="flex-1 flex flex-col group"
                                    >
                                        <div className="flex-1 flex flex-col justify-end">
                                            <span className="text-[9px] font-mono text-center text-f1-text-muted opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                                                {point.points}
                                            </span>
                                            <div
                                                className="w-full rounded-t-sm transition-all duration-300 group-hover:opacity-100"
                                                style={{
                                                    height: `${height}%`,
                                                    backgroundColor: teamColor,
                                                    opacity: 0.5 + (idx / pointsProgression.length) * 0.5,
                                                }}
                                            />
                                        </div>
                                        <span className="text-[8px] font-mono text-f1-text-muted truncate w-full text-center mt-2">
                                            R{point.round}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* Race by race results */}
            <section>
                <h2 className="text-xs font-mono text-f1-red mb-3 uppercase tracking-widest">
                    {season} Race Results
                </h2>
                <div className="flex flex-col gap-1.5">
                    {validResults.map((result) => {
                        const posNum = parseInt(result.position);
                        const isPodium = posNum >= 1 && posNum <= 3;
                        const isPoints = posNum >= 1 && posNum <= 10;

                        return (
                            <Link
                                key={result.round}
                                href={`/results?round=${result.round}`}
                                className="group"
                            >
                                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-f1-surface/80 ${isPodium ? 'bg-f1-surface/40' : 'bg-f1-surface/20'
                                    }`}>
                                    {/* Flag */}
                                    <div className="w-8 flex-shrink-0">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={getFlagUrl(result.country)}
                                            alt={result.country}
                                            className="w-7 h-5 object-cover rounded-[2px]"
                                        />
                                    </div>

                                    {/* Round + Race name */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white truncate group-hover:text-f1-red transition-colors">
                                            {result.raceName}
                                        </p>
                                        <p className="text-[10px] text-f1-text-muted">
                                            R{result.round} • {result.date} • Grid P{result.grid}
                                        </p>
                                    </div>

                                    {/* Fastest lap */}
                                    {result.fastestLap && (
                                        <span className="text-purple-400 text-xs font-bold hidden sm:block">⚡ FL</span>
                                    )}

                                    {/* Position */}
                                    <div className={`w-10 text-center py-1 rounded font-bold font-mono ${posNum === 1
                                        ? 'bg-f1-red/20 text-f1-red'
                                        : isPodium
                                            ? 'bg-white/5 text-white'
                                            : isPoints
                                                ? 'text-f1-text-secondary'
                                                : 'text-f1-text-muted'
                                        }`}>
                                        P{result.position}
                                    </div>

                                    {/* Points */}
                                    <div className="w-12 text-right">
                                        <span className={`text-sm font-bold font-mono ${parseFloat(result.points) > 0 ? 'text-white' : 'text-f1-text-muted'
                                            }`}>
                                            +{result.points}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}

                    {validResults.length === 0 && (
                        <div className="glass-card p-8 text-center">
                            <span className="material-icons text-3xl text-f1-text-muted mb-2 block">event_busy</span>
                            <p className="text-f1-text-secondary">No race results available yet for {season}.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
