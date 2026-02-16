import Countdown from '@/components/home/Countdown';
import PodiumCards from '@/components/home/PodiumCards';
import { getNextRace, getCircuitResults, getQualifyingResults } from '@/lib/api/jolpica';
import { getFlagUrl, getCircuitSvgPath } from '@/lib/types/f1';

export const revalidate = 300; // Revalidate every 5 minutes

export default async function HomePage() {
  const nextRace = await getNextRace();

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
        polePosition = qualifying.find(q => q.position === "1") || null;
      } catch (e) {
        console.error('Failed to fetch qualifying results for home page', e);
      }
    }
  }

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
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full relative">
        {/* Background grid pattern */}
        <div className="absolute inset-0 grid-overlay bg-[size:40px_40px] z-0" />

        {/* Left: Race Info + Countdown */}
        <div className="lg:col-span-7 flex flex-col justify-center z-10 relative">
          {/* Tags */}
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded glass-card text-[10px] font-bold tracking-widest text-f1-red uppercase border border-f1-red/20">
              Upcoming
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

          {/* Countdown */}
          {nextRace && (
            <Countdown
              targetDate={nextRace.date}
              targetTime={nextRace.time}
            />
          )}

          {/* Time info */}
          {amsterdamTime && (
            <div className="flex items-center gap-3 mt-4">
              <span className="material-icons text-f1-text-muted text-sm">schedule</span>
              <span className="text-xs text-f1-text-muted font-mono uppercase tracking-wider">
                {amsterdamTime} • Europe/Amsterdam
              </span>
            </div>
          )}
        </div>

        {/* Right: Circuit Info Card */}
        <div className="lg:col-span-5 relative min-h-[250px] md:min-h-[300px] flex items-center justify-center z-10">
          <div className="absolute inset-0 bg-f1-red/5 blur-3xl rounded-full" />
          <div className="relative w-full h-full p-6 md:p-8 glass-card hover:border-f1-red/30 transition-colors duration-500 flex flex-col justify-between min-h-[250px]">
            {/* Circuit Name */}
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono text-f1-text-muted uppercase tracking-widest">
                  Circuit
                </span>
                <p className="text-lg font-bold mt-1">
                  {nextRace?.Circuit.circuitName || 'TBA'}
                </p>
              </div>
              {nextRace && (
                <div className="text-right">
                  <span className="text-[10px] font-mono text-f1-text-muted">
                    ROUND
                  </span>
                  <p className="text-2xl font-bold text-f1-red font-mono">
                    {nextRace.round}
                  </p>
                </div>
              )}
            </div>

            {/* Circuit SVG — real track layout */}
            <div className="flex-1 flex items-center justify-center my-4 opacity-40 group-hover:opacity-60 transition-opacity duration-500">
              {nextRace && getCircuitSvgPath(nextRace.Circuit.circuitId) ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={getCircuitSvgPath(nextRace.Circuit.circuitId)}
                  alt={`${nextRace.Circuit.circuitName} layout`}
                  className="w-full max-w-[280px] h-auto drop-shadow-[0_0_12px_rgba(225,6,0,0.3)]"
                />
              ) : (
                <div className="text-f1-text-muted text-sm font-mono uppercase tracking-widest">
                  Circuit Layout
                </div>
              )}
            </div>

            {/* Session Schedule */}
            {nextRace && (
              <div className="grid grid-cols-3 gap-2">
                {nextRace.FirstPractice && (
                  <div className="text-center">
                    <span className="text-[9px] font-mono text-f1-text-muted block">FP1</span>
                    <span className="text-xs font-medium">
                      {new Date(`${nextRace.FirstPractice.date}T${nextRace.FirstPractice.time}`).toLocaleString('en-GB', {
                        timeZone: 'Europe/Amsterdam',
                        weekday: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
                {nextRace.Qualifying && (
                  <div className="text-center">
                    <span className="text-[9px] font-mono text-f1-text-muted block">QUALI</span>
                    <span className="text-xs font-medium">
                      {new Date(`${nextRace.Qualifying.date}T${nextRace.Qualifying.time}`).toLocaleString('en-GB', {
                        timeZone: 'Europe/Amsterdam',
                        weekday: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
                <div className="text-center">
                  <span className="text-[9px] font-mono text-f1-red block">RACE</span>
                  <span className="text-xs font-bold text-f1-red">
                    {raceDateTime?.toLocaleString('en-GB', {
                      timeZone: 'Europe/Amsterdam',
                      weekday: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-f1-border to-transparent" />

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
