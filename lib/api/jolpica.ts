import { Race, RaceResult, DriverStanding, ConstructorStanding, QualifyingResult } from '@/lib/types/f1';

const BASE_URL = 'https://api.jolpi.ca/ergast/f1';

async function fetchJolpica<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${endpoint}.json`, {
        next: { revalidate: 300 }, // Cache for 5 minutes
    });
    if (!res.ok) throw new Error(`Jolpica API error: ${res.status}`);
    const data = await res.json();
    return data.MRData;
}

// Get current season race calendar
export async function getRaceCalendar(season: string = 'current'): Promise<Race[]> {
    const data = await fetchJolpica<{ RaceTable: { Races: Race[] } }>(`/${season}`);
    return data.RaceTable.Races;
}

// Get next race
export async function getNextRace(): Promise<Race | null> {
    try {
        const data = await fetchJolpica<{ RaceTable: { Races: Race[] } }>('/current/next');
        return data.RaceTable.Races[0] || null;
    } catch {
        // If no next race, get the last race of current season
        return null;
    }
}

// Get last race
export async function getLastRace(): Promise<Race | null> {
    try {
        const data = await fetchJolpica<{ RaceTable: { Races: Race[] } }>('/current/last');
        return data.RaceTable.Races[0] || null;
    } catch {
        return null;
    }
}

// Get race results
export async function getRaceResults(season: string, round: string): Promise<{ race: Race; results: RaceResult[] }> {
    const data = await fetchJolpica<{ RaceTable: { Races: Array<Race & { Results: RaceResult[] }> } }>(
        `/${season}/${round}/results`
    );
    const race = data.RaceTable.Races[0];
    return { race, results: race?.Results || [] };
}

// Get qualifying results
export async function getQualifyingResults(season: string, round: string): Promise<QualifyingResult[]> {
    const data = await fetchJolpica<{
        RaceTable: { Races: Array<Race & { QualifyingResults: QualifyingResult[] }> };
    }>(`/${season}/${round}/qualifying`);
    return data.RaceTable.Races[0]?.QualifyingResults || [];
}

// Get driver standings
export async function getDriverStandings(season: string = 'current', round?: string): Promise<DriverStanding[]> {
    const endpoint = round ? `/${season}/${round}/driverStandings` : `/${season}/driverStandings`;
    const data = await fetchJolpica<{
        StandingsTable: { StandingsLists: Array<{ DriverStandings: DriverStanding[] }> };
    }>(endpoint);
    return data.StandingsTable.StandingsLists[0]?.DriverStandings || [];
}

// Get constructor standings
export async function getConstructorStandings(
    season: string = 'current',
    round?: string
): Promise<ConstructorStanding[]> {
    const endpoint = round ? `/${season}/${round}/constructorStandings` : `/${season}/constructorStandings`;
    const data = await fetchJolpica<{
        StandingsTable: { StandingsLists: Array<{ ConstructorStandings: ConstructorStanding[] }> };
    }>(endpoint);
    return data.StandingsTable.StandingsLists[0]?.ConstructorStandings || [];
}

// Get results for a specific circuit from a previous season
export async function getCircuitResults(
    circuitId: string,
    season: string
): Promise<{ race: Race; results: RaceResult[] } | null> {
    try {
        const data = await fetchJolpica<{
            RaceTable: { Races: Array<Race & { Results: RaceResult[] }> };
        }>(`/${season}/circuits/${circuitId}/results`);
        const race = data.RaceTable.Races[0];
        if (!race) return null;
        return { race, results: race.Results || [] };
    } catch {
        return null;
    }
}
