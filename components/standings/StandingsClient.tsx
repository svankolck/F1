'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Race, DriverStanding, ConstructorStanding } from '@/lib/types/f1';
import RoundSlider from './RoundSlider';
import StandingsTable from './StandingsTable';

interface StandingsClientProps {
    races: Race[];
    initialRound: string;
    initialSeason: string;
    initialDriverStandings: DriverStanding[];
    initialConstructorStandings: ConstructorStanding[];
    countryFlags: Record<string, string>;
    availableSeasons: string[];
}

type StandingsType = 'drivers' | 'constructors';

export default function StandingsClient({
    races,
    initialRound,
    initialSeason,
    initialDriverStandings,
    initialConstructorStandings,
    countryFlags,
    availableSeasons,
}: StandingsClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Read initial state from URL params, falling back to server-provided defaults
    const urlSeason = searchParams.get('season');
    const urlRound = searchParams.get('round');

    const [selectedSeason, setSelectedSeason] = useState(urlSeason || initialSeason);
    const [selectedRound, setSelectedRound] = useState(urlRound || initialRound);
    const [standingsType, setStandingsType] = useState<StandingsType>('drivers');
    const [driverStandings, setDriverStandings] = useState(initialDriverStandings);
    const [constructorStandings, setConstructorStandings] = useState(initialConstructorStandings);
    const [prevDriverStandings, setPrevDriverStandings] = useState<DriverStanding[]>([]);
    const [prevConstructorStandings, setPrevConstructorStandings] = useState<ConstructorStanding[]>([]);
    const [loading, setLoading] = useState(false);
    const [seasonRaces, setSeasonRaces] = useState<Race[]>(races);

    // Update URL to preserve state
    const updateUrl = useCallback((season: string, round: string) => {
        const params = new URLSearchParams();
        params.set('season', season);
        params.set('round', round);
        router.replace(`/standings?${params.toString()}`, { scroll: false });
    }, [router]);

    const fetchStandings = useCallback(async (season: string, round: string) => {
        setLoading(true);
        try {
            const [driverRes, constructorRes] = await Promise.all([
                fetch(`/api/standings?season=${season}&round=${round}&type=drivers`),
                fetch(`/api/standings?season=${season}&round=${round}&type=constructors`),
            ]);

            if (driverRes.ok) {
                const data = await driverRes.json();
                setDriverStandings(data.standings || []);
            }
            if (constructorRes.ok) {
                const data = await constructorRes.json();
                setConstructorStandings(data.standings || []);
            }

            // Fetch previous round for delta calculation
            const prevRound = (parseInt(round) - 1).toString();
            if (parseInt(prevRound) > 0) {
                const [prevDriverRes, prevConstructorRes] = await Promise.all([
                    fetch(`/api/standings?season=${season}&round=${prevRound}&type=drivers`),
                    fetch(`/api/standings?season=${season}&round=${prevRound}&type=constructors`),
                ]);
                if (prevDriverRes.ok) {
                    const data = await prevDriverRes.json();
                    setPrevDriverStandings(data.standings || []);
                }
                if (prevConstructorRes.ok) {
                    const data = await prevConstructorRes.json();
                    setPrevConstructorStandings(data.standings || []);
                }
            } else {
                setPrevDriverStandings([]);
                setPrevConstructorStandings([]);
            }
        } catch (err) {
            console.error('Failed to fetch standings:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch calendar for a different season
    const fetchSeasonCalendar = useCallback(async (season: string) => {
        try {
            const res = await fetch(`https://api.jolpi.ca/ergast/f1/${season}.json`);
            if (res.ok) {
                const data = await res.json();
                const fetchedRaces: Race[] = data?.MRData?.RaceTable?.Races || [];
                setSeasonRaces(fetchedRaces);
                return fetchedRaces;
            }
        } catch (err) {
            console.error('Failed to fetch season calendar:', err);
        }
        return [];
    }, []);

    // Determine the last completed round for a set of races
    const getLastCompletedRound = useCallback((raceList: Race[]) => {
        const now = new Date();
        const completed = raceList.filter((r) => {
            const raceDate = new Date(`${r.date}T${r.time || '23:59:59Z'}`);
            return raceDate < now;
        });
        if (completed.length > 0) {
            return completed[completed.length - 1].round;
        }
        // If no completed races, use the last race of the season (for historical seasons)
        if (raceList.length > 0) {
            return raceList[raceList.length - 1].round;
        }
        return '1';
    }, []);

    // On round change — update URL and fetch
    const handleRoundChange = useCallback((round: string) => {
        setSelectedRound(round);
        updateUrl(selectedSeason, round);
        fetchStandings(selectedSeason, round);
    }, [selectedSeason, updateUrl, fetchStandings]);

    // On season change — fetch that season's calendar, determine last round, update
    const handleSeasonChange = useCallback(async (season: string) => {
        setSelectedSeason(season);
        setLoading(true);

        // Fetch races for the new season
        const newRaces = await fetchSeasonCalendar(season);
        const lastRound = getLastCompletedRound(newRaces);
        setSelectedRound(lastRound);
        updateUrl(season, lastRound);

        // Build new country flags
        // (flags are already passed for current season; for other seasons we reuse the same API)
        await fetchStandings(season, lastRound);
    }, [fetchSeasonCalendar, getLastCompletedRound, updateUrl, fetchStandings]);

    // Initial data load if URL has params from back-navigation
    useEffect(() => {
        if (urlSeason && urlRound) {
            // We came back with URL params — need to fetch if different from initial data
            if (urlSeason !== initialSeason || urlRound !== initialRound) {
                if (urlSeason !== initialSeason) {
                    fetchSeasonCalendar(urlSeason);
                }
                fetchStandings(urlSeason, urlRound);
            }
        }
        // Only run once on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Build country flags for the current season's races
    const currentFlags: Record<string, string> = {};
    seasonRaces.forEach((race) => {
        const country = race.Circuit.Location.country;
        if (countryFlags[country]) {
            currentFlags[country] = countryFlags[country];
        } else {
            // Generate a flag URL for seasons the server didn't prefetch
            currentFlags[country] = `https://flagcdn.com/w40/${getCountryCode(country)}.png`;
        }
    });

    // Find selected race for header info
    const selectedRace = seasonRaces.find((r) => r.round === selectedRound);

    return (
        <div className="flex flex-col gap-5 w-full">
            {/* Page header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h2 className="text-xs font-mono text-f1-red mb-1 uppercase tracking-widest">
                        Championship
                    </h2>
                    <h1 className="text-2xl md:text-4xl font-bold uppercase tracking-tight">
                        {selectedSeason} Standings
                    </h1>
                </div>

                {/* Season selector */}
                <div className="flex items-center gap-3">
                    <span className="text-[10px] text-f1-text-muted uppercase tracking-widest font-mono">Season</span>
                    <select
                        value={selectedSeason}
                        onChange={(e) => handleSeasonChange(e.target.value)}
                        className="bg-f1-surface border border-f1-border rounded-lg px-3 py-2 text-sm font-bold text-white appearance-none cursor-pointer hover:border-f1-red/30 transition-colors focus:outline-none focus:border-f1-red/50"
                    >
                        {availableSeasons.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Round slider */}
            <RoundSlider
                races={seasonRaces}
                selectedRound={selectedRound}
                onSelectRound={handleRoundChange}
                countryFlags={currentFlags}
            />

            {/* Selected round info */}
            {selectedRace && (
                <div className="glass-card px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-f1-red font-mono font-bold text-lg">R{selectedRound}</span>
                        <div className="h-6 w-px bg-f1-border" />
                        <div>
                            <p className="text-sm font-bold">{selectedRace.raceName}</p>
                            <p className="text-[10px] text-f1-text-muted">
                                {selectedRace.Circuit.circuitName} • {selectedRace.date}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Drivers / Constructors toggle */}
            <div className="flex gap-1 bg-f1-surface/50 p-1 rounded-lg w-fit">
                <button
                    onClick={() => setStandingsType('drivers')}
                    className={`px-5 py-2 rounded-md text-xs font-bold uppercase tracking-widest transition-all duration-300 ${standingsType === 'drivers'
                        ? 'bg-f1-red text-white shadow-lg shadow-f1-red/20'
                        : 'text-f1-text-muted hover:text-white'
                        }`}
                >
                    Drivers
                </button>
                <button
                    onClick={() => setStandingsType('constructors')}
                    className={`px-5 py-2 rounded-md text-xs font-bold uppercase tracking-widest transition-all duration-300 ${standingsType === 'constructors'
                        ? 'bg-f1-red text-white shadow-lg shadow-f1-red/20'
                        : 'text-f1-text-muted hover:text-white'
                        }`}
                >
                    Teams
                </button>
            </div>

            {/* Loading state */}
            {loading && (
                <div className="flex items-center justify-center py-8 gap-3">
                    <div className="w-5 h-5 border-2 border-f1-red/30 border-t-f1-red rounded-full animate-spin" />
                    <span className="text-sm text-f1-text-muted font-mono uppercase tracking-wider">Loading…</span>
                </div>
            )}

            {/* Standings table */}
            {!loading && standingsType === 'drivers' && (
                <StandingsTable
                    type="drivers"
                    standings={driverStandings}
                    previousStandings={prevDriverStandings}
                    season={selectedSeason}
                    round={selectedRound}
                />
            )}
            {!loading && standingsType === 'constructors' && (
                <StandingsTable
                    type="constructors"
                    standings={constructorStandings}
                    previousStandings={prevConstructorStandings}
                    season={selectedSeason}
                    round={selectedRound}
                />
            )}
        </div>
    );
}

// Helper: country name to ISO-2 code for flag CDN
function getCountryCode(country: string): string {
    const map: Record<string, string> = {
        'Australia': 'au', 'Austria': 'at', 'Azerbaijan': 'az', 'Bahrain': 'bh',
        'Belgium': 'be', 'Brazil': 'br', 'Canada': 'ca', 'China': 'cn',
        'France': 'fr', 'Germany': 'de', 'Hungary': 'hu', 'India': 'in',
        'Italy': 'it', 'Japan': 'jp', 'Korea': 'kr', 'Malaysia': 'my',
        'Mexico': 'mx', 'Monaco': 'mc', 'Netherlands': 'nl', 'Portugal': 'pt',
        'Qatar': 'qa', 'Russia': 'ru', 'Saudi Arabia': 'sa', 'Singapore': 'sg',
        'Spain': 'es', 'Turkey': 'tr', 'UAE': 'ae', 'UK': 'gb',
        'USA': 'us', 'United States': 'us',
    };
    return map[country] || 'un';
}
