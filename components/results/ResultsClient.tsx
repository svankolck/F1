'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { QualifyingResult, Race, RaceResult, getFlagUrl } from '@/lib/types/f1';
import RaceSlider from './RaceSlider';
import PodiumShowcase from './PodiumShowcase';
import ClassificationTable from './ClassificationTable';
import QualifyingTable from './QualifyingTable';

interface ResultsClientProps {
    initialSeason: string;
    initialRound: string;
    initialRace: Race | null;
    initialRaces: Race[];
    initialResults: RaceResult[];
    initialQualifying: QualifyingResult[];
    availableSeasons: string[];
    countryFlags: Record<string, string>;
}

type ViewMode = 'race' | 'qualifying';
type RaceStatus = 'Completed' | 'Live' | 'Upcoming';

interface ResultsApiPayload {
    race: Race | null;
    results: RaceResult[];
    qualifying: QualifyingResult[];
}

function getStatus(race: Race | null): RaceStatus {
    if (!race) return 'Upcoming';
    const now = new Date();
    const raceStart = new Date(`${race.date}T${race.time || '14:00:00Z'}`);
    const raceEndEstimate = new Date(raceStart.getTime() + 3 * 60 * 60 * 1000);

    if (now < raceStart) return 'Upcoming';
    if (now >= raceStart && now <= raceEndEstimate) return 'Live';
    return 'Completed';
}

function getStatusClasses(status: RaceStatus): string {
    if (status === 'Completed') return 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300';
    if (status === 'Live') return 'bg-red-500/10 border-red-400/40 text-red-300';
    return 'bg-amber-500/10 border-amber-400/30 text-amber-300';
}

function getCountryCode(country: string): string {
    const map: Record<string, string> = {
        Australia: 'au', Austria: 'at', Azerbaijan: 'az', Bahrain: 'bh', Belgium: 'be', Brazil: 'br',
        Canada: 'ca', China: 'cn', France: 'fr', Germany: 'de', Hungary: 'hu', Italy: 'it', Japan: 'jp',
        Mexico: 'mx', Monaco: 'mc', Netherlands: 'nl', Portugal: 'pt', Qatar: 'qa', Russia: 'ru',
        'Saudi Arabia': 'sa', Singapore: 'sg', Spain: 'es', Turkey: 'tr', UAE: 'ae', UK: 'gb',
        USA: 'us', 'United States': 'us',
    };
    return map[country] || 'un';
}

function getLastCompletedRound(races: Race[]): string {
    if (!races.length) return '1';
    const now = new Date();
    const completed = races.filter((r) => {
        const dt = new Date(`${r.date}T${r.time || '23:59:59Z'}`);
        return dt < now;
    });

    if (completed.length > 0) {
        return completed[completed.length - 1].round;
    }

    return races[0].round;
}

export default function ResultsClient({
    initialSeason,
    initialRound,
    initialRace,
    initialRaces,
    initialResults,
    initialQualifying,
    availableSeasons,
    countryFlags,
}: ResultsClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [selectedSeason, setSelectedSeason] = useState(searchParams.get('season') || initialSeason);
    const [selectedRound, setSelectedRound] = useState(searchParams.get('round') || initialRound);
    const [viewMode, setViewMode] = useState<ViewMode>((searchParams.get('tab') as ViewMode) || 'race');

    const [seasonRaces, setSeasonRaces] = useState<Race[]>(initialRaces);
    const [race, setRace] = useState<Race | null>(initialRace);
    const [results, setResults] = useState<RaceResult[]>(initialResults);
    const [qualifying, setQualifying] = useState<QualifyingResult[]>(initialQualifying);
    const [loading, setLoading] = useState(false);

    const updateUrl = useCallback((season: string, round: string, tab: ViewMode) => {
        const params = new URLSearchParams();
        params.set('season', season);
        params.set('round', round);
        params.set('tab', tab);
        router.replace(`/results?${params.toString()}`, { scroll: false });
    }, [router]);

    const fetchResults = useCallback(async (season: string, round: string) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/results?season=${season}&round=${round}`);
            if (!response.ok) {
                throw new Error('Failed to load results');
            }
            const payload: ResultsApiPayload = await response.json();
            setRace(payload.race || null);
            setResults(payload.results || []);
            setQualifying(payload.qualifying || []);
        } catch (error) {
            console.error('Results fetch failed:', error);
            setRace(null);
            setResults([]);
            setQualifying([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchSeasonCalendar = useCallback(async (season: string) => {
        try {
            const response = await fetch(`https://api.jolpi.ca/ergast/f1/${season}.json`);
            if (!response.ok) {
                throw new Error('Failed to load season calendar');
            }
            const payload = await response.json();
            const races = payload?.MRData?.RaceTable?.Races || [];
            setSeasonRaces(races);
            return races as Race[];
        } catch (error) {
            console.error('Calendar fetch failed:', error);
            setSeasonRaces([]);
            return [] as Race[];
        }
    }, []);

    const handleRoundChange = useCallback((round: string) => {
        setSelectedRound(round);
        updateUrl(selectedSeason, round, viewMode);
        fetchResults(selectedSeason, round);
    }, [fetchResults, selectedSeason, updateUrl, viewMode]);

    const handleSeasonChange = useCallback(async (season: string) => {
        setSelectedSeason(season);
        setLoading(true);

        const races = await fetchSeasonCalendar(season);
        const round = getLastCompletedRound(races);
        setSelectedRound(round);
        updateUrl(season, round, viewMode);

        await fetchResults(season, round);
    }, [fetchResults, fetchSeasonCalendar, updateUrl, viewMode]);

    const handleViewChange = useCallback((tab: ViewMode) => {
        setViewMode(tab);
        updateUrl(selectedSeason, selectedRound, tab);
    }, [selectedRound, selectedSeason, updateUrl]);

    useEffect(() => {
        const urlSeason = searchParams.get('season');
        const urlRound = searchParams.get('round');

        if (urlSeason && urlRound && (urlSeason !== initialSeason || urlRound !== initialRound)) {
            if (urlSeason !== initialSeason) {
                fetchSeasonCalendar(urlSeason);
            }
            fetchResults(urlSeason, urlRound);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const currentFlags = useMemo(() => {
        const flags: Record<string, string> = {};
        seasonRaces.forEach((raceItem) => {
            const country = raceItem.Circuit.Location.country;
            flags[country] = countryFlags[country] || `https://flagcdn.com/w40/${getCountryCode(country)}.png`;
        });
        return flags;
    }, [seasonRaces, countryFlags]);

    const selectedRace = seasonRaces.find((r) => r.round === selectedRound) || race;
    const status = getStatus(selectedRace || null);

    return (
        <div className="flex flex-col gap-5 w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h2 className="text-xs font-mono text-f1-red mb-1 uppercase tracking-widest">Race Center</h2>
                    <h1 className="text-2xl md:text-4xl font-bold uppercase tracking-tight">{selectedSeason} Results</h1>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-[10px] text-f1-text-muted uppercase tracking-widest font-mono">Season</span>
                    <select
                        value={selectedSeason}
                        onChange={(e) => handleSeasonChange(e.target.value)}
                        className="bg-f1-surface border border-f1-border rounded-lg px-3 py-2 text-sm font-bold text-white appearance-none cursor-pointer hover:border-f1-red/30 transition-colors focus:outline-none focus:border-f1-red/50"
                    >
                        {availableSeasons.map((season) => (
                            <option key={season} value={season}>{season}</option>
                        ))}
                    </select>
                </div>
            </div>

            <RaceSlider
                races={seasonRaces}
                selectedRound={selectedRound}
                onSelectRound={handleRoundChange}
                countryFlags={currentFlags}
            />

            {selectedRace && (
                <div className="glass-card px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={getFlagUrl(selectedRace.Circuit.Location.country)}
                            alt={selectedRace.Circuit.Location.country}
                            className="w-7 h-5 rounded-sm object-cover"
                        />
                        <div>
                            <p className="text-sm font-bold">{selectedRace.raceName}</p>
                            <p className="text-[10px] text-f1-text-muted">
                                {selectedRace.Circuit.circuitName} • {selectedRace.Circuit.Location.locality}, {selectedRace.Circuit.Location.country}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest ${getStatusClasses(status)} ${status === 'Live' ? 'animate-pulse' : ''}`}>
                            {status}
                        </span>
                        <span className="text-[10px] font-mono text-f1-text-muted uppercase tracking-widest">
                            Race: {selectedRace.date}
                        </span>
                        <span className="text-[10px] font-mono text-f1-text-muted uppercase tracking-widest">
                            Weather: N/A
                        </span>
                    </div>
                </div>
            )}

            <div className="flex gap-1 bg-f1-surface/50 p-1 rounded-lg w-fit">
                <button
                    onClick={() => handleViewChange('race')}
                    className={`px-5 py-2 rounded-md text-xs font-bold uppercase tracking-widest transition-all duration-300 ${viewMode === 'race' ? 'bg-f1-red text-white shadow-lg shadow-f1-red/20' : 'text-f1-text-muted hover:text-white'}`}
                >
                    Race
                </button>
                <button
                    onClick={() => handleViewChange('qualifying')}
                    className={`px-5 py-2 rounded-md text-xs font-bold uppercase tracking-widest transition-all duration-300 ${viewMode === 'qualifying' ? 'bg-f1-red text-white shadow-lg shadow-f1-red/20' : 'text-f1-text-muted hover:text-white'}`}
                >
                    Qualifying
                </button>
            </div>

            {loading && (
                <div className="flex items-center justify-center py-8 gap-3">
                    <div className="w-5 h-5 border-2 border-f1-red/30 border-t-f1-red rounded-full animate-spin" />
                    <span className="text-sm text-f1-text-muted font-mono uppercase tracking-wider">Loading…</span>
                </div>
            )}

            {!loading && viewMode === 'race' && (
                <>
                    <PodiumShowcase results={results} />
                    <ClassificationTable results={results} />
                </>
            )}

            {!loading && viewMode === 'qualifying' && (
                <QualifyingTable qualifying={qualifying} />
            )}
        </div>
    );
}
