import Link from 'next/link';
import Countdown from '@/components/home/Countdown';
import PodiumCards from '@/components/home/PodiumCards';
import RaceWeekendSchedule from '@/components/home/RaceWeekendSchedule';
import UpcomingRaces from '@/components/home/UpcomingRaces';
import { getNextRace, getRaceCalendar, getCircuitResults, getQualifyingResults } from '@/lib/api/jolpica';
import { Race, getFlagUrl, getCircuitSvgPath } from '@/lib/types/f1';
import { CIRCUIT_DETAILS } from '@/lib/data/circuits';

export const revalidate = 300; // Revalidate every 5 minutes

export default async function HomePage() {
  const [nextRace, raceCalendar] = await Promise.all([
    getNextRace(),
    getRaceCalendar('current'),
  ]);

  let followingRaces: Race[] = [];
  if (nextRace && raceCalendar.length) {
    const nextIdx = raceCalendar.findIndex(
      (race) => race.season === nextRace.season && race.round === nextRace.round
    );

    if (nextIdx >= 0) {
      followingRaces = raceCalendar.slice(nextIdx + 1, nextIdx + 3);
    } else {
      const nextRaceTime = new Date(`${nextRace.date}T${nextRace.time || '14:00:00Z'}`).getTime();
      followingRaces = raceCalendar
        .filter((race) => {
          const raceTime = new Date(`${race.date}T${race.time || '14:00:00Z'}`).getTime();
          return raceTime > nextRaceTime;
        })
        .slice(0, 2);
    }
  }

  // Try to get previous year's results for this circuit
  let prevResults = null;
  let polePosition = null;

  if (nextRace) {
    const prevSeason = (parseInt(nextRace.season) - 1).toString();
    const results = await getCircuitResults(nextRace.Circuit.circuitId, prevSeason);

    if (results) {
      prevResults = results;
      // Fetch qualifying results for that specific race to get actual pole position
      try {
        const qualifying = await getQualifyingResults(prevSeason, results.race.round);
        polePosition = qualifying.find((q) => q.position === '1') || null;
      } catch (e) {
        console.error('Failed to fetch qualifying results for home page', e);
      }
    }
  }

  const circuitDetails = nextRace ? CIRCUIT_DETAILS[nextRace.Circuit.circuitId] : null;

  // Format race time in Amsterdam timezone
  const raceDateTime = nextRace
    ? new Date(`${nextRace.date}T${nextRace.time || '14:00:00Z'}`)
    : null;
  const amsterdamTime = raceDateTime
    ? raceDateTime.toLocaleString('en-GB', {
      timeZone: 'Europe/Amsterdam',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
    : '';

  return (
    <div className="flex flex-col gap-8 py-4">
      {/* Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-x-6 gap-y-5 w-full relative">
        {/* Background grid pattern */}
        <div className="absolute inset-0 grid-overlay bg-[size:40px_40px] z-0" />

        {/* Left: Race Header */}
        <div className="lg:col-span-7 z-10 relative">
          {/* Tags */}
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded glass-card text-[10px] font-bold tracking-widest text-f1-red uppercase border border-f1-red/20">
              Next
            </span>
            {nextRace && (
              <span className="text-[10px] font-medium text-f1-text-muted uppercase tracking-widest">
                Round {nextRace.round} • {nextRace.date}
              </span>
            )}
          </div>

          {/* Race Name */}
          {nextRace ? (
            <>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold uppercase tracking-tight mb-2 leading-none">
                {nextRace.Circuit.Location.country.split(' ')[0]}{' '}
                <span className="text-stroke">Grand Prix</span>
              </h1>
              <div className="flex items-center gap-2 mb-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getFlagUrl(nextRace.Circuit.Location.country)}
                  alt={nextRace.Circuit.Location.country}
                  className="w-6 h-4 object-cover rounded-sm"
                />
                <p className="text-base md:text-lg text-f1-text-secondary font-light">
                  {nextRace.Circuit.Location.locality},{' '}
                  {nextRace.Circuit.Location.country}
                </p>
              </div>
            </>
          ) : (
            <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tight mb-6 leading-none">
              Season <span className="text-stroke">Loading</span>
            </h1>
          )}
        </div>

        {/* Left: Countdown + Schedule */}
        <div className="lg:col-span-7 z-10 relative">
          <div className="flex w-full max-w-md flex-col">
            {/* Countdown */}
            {nextRace && (
              <Countdown
                targetDate={nextRace.date}
                targetTime={nextRace.time}
              />
            )}

            {/* Time info */}
            {amsterdamTime && (
              <div className="flex flex-wrap items-center gap-3 mt-5">
                <span className="material-icons text-f1-red text-xl">schedule</span>
                <span className="text-lg md:text-xl font-bold uppercase tracking-wider">
                  {amsterdamTime}
                </span>
                {nextRace?.Sprint && (
                  <span className="rounded-full border border-orange-500/40 bg-orange-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-orange-300">
                    Sprint
                  </span>
                )}
                <span className="text-xs text-f1-text-muted font-mono uppercase tracking-wider">
                  Europe/Amsterdam
                </span>
              </div>
            )}

            {nextRace && <RaceWeekendSchedule race={nextRace} />}
          </div>
        </div>

        {/* Right: Circuit Info Card */}
        <div className="lg:col-span-5 lg:col-start-8 lg:row-start-2 relative flex items-start justify-center self-stretch z-10">
          <div className="absolute inset-0 bg-f1-red/5 blur-3xl rounded-full" />
          <div className="relative w-full h-full p-5 glass-card hover:border-f1-red/30 transition-colors duration-500 overflow-hidden group">
            {/* Background Image */}
            {circuitDetails?.imageUrl && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={circuitDetails.imageUrl}
                  alt={nextRace?.Circuit.circuitName || 'Circuit'}
                  className="absolute inset-0 w-full h-full object-cover object-center opacity-30 group-hover:opacity-40 transition-opacity duration-500 z-0"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/50 to-black/80 z-0" />
              </>
            )}

            {/* Content Container */}
            <div className="relative z-10 flex flex-col gap-4">
              {/* Circuit Name */}
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono text-f1-text-muted uppercase tracking-widest">
                    Circuit
                  </span>
                  <p className="text-lg font-bold mt-1 leading-tight">
                    {nextRace?.Circuit.circuitName || 'TBA'}
                  </p>
                </div>
                {nextRace && (
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-f1-text-muted">
                      ROUND
                    </span>
                    <p className="text-xl font-bold text-f1-red font-mono">
                      {nextRace.round}
                    </p>
                  </div>
                )}
              </div>

              {/* Middle Section: Details (Left) + Map (Right) */}
              <div className="flex items-center gap-4">
                {/* Circuit Details - Left Side */}
                {circuitDetails ? (
                  <div className="flex-1 grid grid-cols-1 gap-3">
                    <div>
                      <span className="text-[9px] font-mono text-f1-text-muted block uppercase tracking-wider mb-0.5">Circuit Length</span>
                      <span className="text-sm font-bold">{circuitDetails.length}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-f1-text-muted block uppercase tracking-wider mb-0.5">First Grand Prix</span>
                      <span className="text-sm font-bold">{circuitDetails.firstGrandPrix}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-f1-text-muted block uppercase tracking-wider mb-0.5">Number of Laps</span>
                      <span className="text-sm font-bold">{circuitDetails.laps}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-f1-text-muted block uppercase tracking-wider mb-0.5">Race Distance</span>
                      <span className="text-sm font-bold">{circuitDetails.raceDistance}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-f1-text-muted block uppercase tracking-wider mb-0.5">Fastest Lap</span>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">{circuitDetails.lapRecord.time}</span>
                        <span className="text-[9px] text-f1-text-secondary leading-tight">
                          {circuitDetails.lapRecord.driver} ({circuitDetails.lapRecord.year})
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 text-f1-text-muted text-sm">
                    Details loading...
                  </div>
                )}

                {/* Circuit SVG - Right Side */}
                <div className="flex-1 flex items-center justify-center opacity-90">
                  {nextRace && getCircuitSvgPath(nextRace.Circuit.circuitId) ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={getCircuitSvgPath(nextRace.Circuit.circuitId)}
                      alt={`${nextRace.Circuit.circuitName} layout`}
                      className="w-full max-w-[140px] h-auto drop-shadow-[0_0_12px_rgba(225,6,0,0.5)]"
                    />
                  ) : (
                    <div className="text-f1-text-muted text-xs font-mono uppercase tracking-widest text-center">
                      Layout
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 z-10 relative">
          <div className="mt-5 lg:mt-0">
            <Link
              href="/calendar"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-f1-border hover:border-f1-red/40 bg-f1-surface/40 hover:bg-f1-red/10 transition-colors text-sm font-bold uppercase tracking-wider"
            >
              View Full Calendar
              <span className="material-icons text-base">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-f1-border to-transparent" />

      {/* Upcoming races */}
      {followingRaces.length > 0 && <UpcomingRaces races={followingRaces} />}

      {/* Previous Year Podium */}
      {prevResults && (
        <PodiumCards
          results={prevResults.results}
          season={(parseInt(nextRace!.season) - 1).toString()}
          round={prevResults.race.round}
          polePosition={polePosition || undefined}
        />
      )}

      {/* No race fallback */}
      {!nextRace && (
        <div className="glass-card p-8 text-center">
          <span className="material-icons text-4xl text-f1-text-muted mb-3 block">
            calendar_today
          </span>
          <h2 className="text-xl font-bold mb-2">Season Not Started Yet</h2>
          <p className="text-f1-text-secondary">
            The race calendar will appear here once the season schedule is published.
          </p>
        </div>
      )}
    </div>
  );
}
