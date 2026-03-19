import { OpenF1Session, OpenF1Driver, OpenF1Lap } from '@/lib/types/f1';

const BASE_URL = 'https://api.openf1.org/v1';

async function fetchOpenF1<T>(endpoint: string, params?: Record<string, string>): Promise<T[]> {
    const url = new URL(`${BASE_URL}${endpoint}`);
    if (params) {
        Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    }
    const res = await fetch(url.toString(), {
        next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`OpenF1 API error: ${res.status}`);
    return res.json();
}

// ===== Types for Results =====

export interface PracticeResult {
    position: number;
    driverNumber: number;
    driverCode: string;
    firstName: string;
    lastName: string;
    teamName: string;
    teamColor: string;
    bestLapTime: number | null; // seconds
    bestLapFormatted: string;
    gap: string;
    lapsCompleted: number;
}

export interface SprintQualiResult {
    position: number;
    driverNumber: number;
    driverCode: string;
    firstName: string;
    lastName: string;
    teamName: string;
    teamColor: string;
    sq1: string | null;
    sq2: string | null;
    sq3: string | null;
    eliminatedIn: string | null; // 'SQ1' | 'SQ2' | null
}

// ===== Helpers =====

function formatLapTime(seconds: number | null): string {
    if (seconds === null || seconds <= 0) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
        return `${mins}:${secs.toFixed(3).padStart(6, '0')}`;
    }
    return secs.toFixed(3);
}

function formatGap(leaderTime: number, driverTime: number | null): string {
    if (driverTime === null || leaderTime === null) return '—';
    if (driverTime === leaderTime) return '';
    const gap = driverTime - leaderTime;
    return `+${gap.toFixed(3)}`;
}

// ===== Session Lookup =====

export async function getOpenF1SessionsForMeeting(
    year: number,
    circuitShortName: string
): Promise<OpenF1Session[]> {
    try {
        const sessions = await fetchOpenF1<OpenF1Session>('/sessions', {
            year: year.toString(),
            circuit_short_name: circuitShortName,
        });
        return sessions;
    } catch {
        return [];
    }
}

// Map Jolpica circuitId to OpenF1 circuit_short_name
const CIRCUIT_NAME_MAP: Record<string, string> = {
    albert_park: 'Melbourne',
    bahrain: 'Bahrain',
    shanghai: 'Shanghai',
    suzuka: 'Suzuka',
    miami: 'Miami',
    monaco: 'Monaco',
    villeneuve: 'Montreal',
    catalunya: 'Barcelona',
    red_bull_ring: 'Spielberg',
    silverstone: 'Silverstone',
    hungaroring: 'Budapest',
    spa: 'Spa-Francorchamps',
    zandvoort: 'Zandvoort',
    monza: 'Monza',
    marina_bay: 'Marina Bay',
    losail: 'Lusail',
    americas: 'Austin',
    rodriguez: 'Mexico City',
    interlagos: 'Interlagos',
    vegas: 'Las Vegas',
    yas_marina: 'Yas Island',
    jeddah: 'Jeddah',
    baku: 'Baku',
    madring: 'Madrid',
};

export function getOpenF1CircuitName(jolpicaCircuitId: string): string {
    return CIRCUIT_NAME_MAP[jolpicaCircuitId] || '';
}

// ===== Practice Classification =====

export async function getPracticeClassification(sessionKey: number): Promise<PracticeResult[]> {
    try {
        const [laps, drivers] = await Promise.all([
            fetchOpenF1<OpenF1Lap>('/laps', { session_key: sessionKey.toString() }),
            fetchOpenF1<OpenF1Driver>('/drivers', { session_key: sessionKey.toString() }),
        ]);

        // Build driver info map
        const driverMap = new Map<number, OpenF1Driver>();
        drivers.forEach((d) => {
            const existing = driverMap.get(d.driver_number);
            if (!existing) driverMap.set(d.driver_number, d);
        });

        // Find best lap per driver (exclude pit out laps and null durations)
        const bestLaps = new Map<number, { bestTime: number; lapCount: number }>();
        laps.forEach((lap) => {
            if (lap.is_pit_out_lap || !lap.lap_duration || lap.lap_duration <= 0) {
                // Still count for lap total
                const existing = bestLaps.get(lap.driver_number);
                if (existing) {
                    existing.lapCount++;
                } else {
                    bestLaps.set(lap.driver_number, { bestTime: Infinity, lapCount: 1 });
                }
                return;
            }

            const existing = bestLaps.get(lap.driver_number);
            if (existing) {
                existing.lapCount++;
                if (lap.lap_duration < existing.bestTime) {
                    existing.bestTime = lap.lap_duration;
                }
            } else {
                bestLaps.set(lap.driver_number, { bestTime: lap.lap_duration, lapCount: 1 });
            }
        });

        // Sort by best time
        const sorted = Array.from(bestLaps.entries())
            .filter(([, data]) => data.bestTime !== Infinity)
            .sort((a, b) => a[1].bestTime - b[1].bestTime);

        const leaderTime = sorted.length > 0 ? sorted[0][1].bestTime : null;

        return sorted.map(([driverNumber, data], idx) => {
            const driver = driverMap.get(driverNumber);
            return {
                position: idx + 1,
                driverNumber,
                driverCode: driver?.name_acronym || `#${driverNumber}`,
                firstName: driver?.first_name || '',
                lastName: driver?.last_name || '',
                teamName: driver?.team_name || '',
                teamColor: driver?.team_colour ? `#${driver.team_colour}` : '#888888',
                bestLapTime: data.bestTime,
                bestLapFormatted: formatLapTime(data.bestTime),
                gap: formatGap(leaderTime!, data.bestTime),
                lapsCompleted: data.lapCount,
            };
        });
    } catch (error) {
        console.error('Practice classification error:', error);
        return [];
    }
}

// ===== Sprint Qualifying Classification =====

export async function getSprintQualifyingClassification(sessionKey: number): Promise<SprintQualiResult[]> {
    try {
        const [laps, drivers] = await Promise.all([
            fetchOpenF1<OpenF1Lap>('/laps', { session_key: sessionKey.toString() }),
            fetchOpenF1<OpenF1Driver>('/drivers', { session_key: sessionKey.toString() }),
        ]);

        // Build driver info map
        const driverMap = new Map<number, OpenF1Driver>();
        drivers.forEach((d) => {
            if (!driverMap.has(d.driver_number)) driverMap.set(d.driver_number, d);
        });

        // Sprint qualifying has 3 phases: SQ1, SQ2, SQ3
        // We detect phase boundaries by looking for gaps between laps (pit stops / red flags)
        // A simpler approach: sort all valid laps by time, group into 3 phases
        // based on the session structure (SQ1: first ~12 mins, SQ2: ~10 mins, SQ3: ~8 mins)

        // Get all valid (non pit-out) laps sorted by start time
        const validLaps = laps
            .filter((l) => !l.is_pit_out_lap && l.lap_duration && l.lap_duration > 0 && l.lap_duration < 300)
            .sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime());

        if (validLaps.length === 0) return [];

        // Find session phase boundaries by detecting large gaps (>3 min = new phase)
        const phases: OpenF1Lap[][] = [[]];
        let currentPhase = 0;
        for (let i = 0; i < validLaps.length; i++) {
            if (i > 0) {
                const prevEnd = new Date(validLaps[i - 1].date_start).getTime() + (validLaps[i - 1].lap_duration! * 1000);
                const currentStart = new Date(validLaps[i].date_start).getTime();
                const gapSeconds = (currentStart - prevEnd) / 1000;

                if (gapSeconds > 180) { // >3 minute gap = new phase
                    currentPhase++;
                    phases[currentPhase] = [];
                }
            }
            phases[currentPhase].push(validLaps[i]);
        }

        // Ensure we have at most 3 phases (SQ1, SQ2, SQ3)
        const sq1Laps = phases[0] || [];
        const sq2Laps = phases[1] || [];
        const sq3Laps = phases[2] || [];

        // Best lap per driver per phase
        const bestPerDriver = (phaseLaps: OpenF1Lap[]): Map<number, number> => {
            const best = new Map<number, number>();
            phaseLaps.forEach((lap) => {
                if (!lap.lap_duration || lap.lap_duration <= 0) return;
                const existing = best.get(lap.driver_number);
                if (!existing || lap.lap_duration < existing) {
                    best.set(lap.driver_number, lap.lap_duration);
                }
            });
            return best;
        };

        const sq1Best = bestPerDriver(sq1Laps);
        const sq2Best = bestPerDriver(sq2Laps);
        const sq3Best = bestPerDriver(sq3Laps);

        // Determine eliminated drivers:
        // SQ3 has ~10 drivers, SQ2 has ~15, SQ1 has ~20
        // Drivers in SQ1 but not SQ2 = eliminated in SQ1
        // Drivers in SQ2 but not SQ3 = eliminated in SQ2
        // Drivers in SQ3 = made it through

        // Build combined results
        const allDriverNumbers = new Set<number>();
        sq1Best.forEach((_, dn) => allDriverNumbers.add(dn));
        sq2Best.forEach((_, dn) => allDriverNumbers.add(dn));
        sq3Best.forEach((_, dn) => allDriverNumbers.add(dn));

        const results: SprintQualiResult[] = [];
        allDriverNumbers.forEach((dn) => {
            const driver = driverMap.get(dn);
            const hasSQ1 = sq1Best.has(dn);
            const hasSQ2 = sq2Best.has(dn);
            const hasSQ3 = sq3Best.has(dn);

            let eliminatedIn: string | null = null;
            if (hasSQ1 && !hasSQ2) eliminatedIn = 'SQ1';
            else if (hasSQ2 && !hasSQ3) eliminatedIn = 'SQ2';

            results.push({
                position: 0, // set after sorting
                driverNumber: dn,
                driverCode: driver?.name_acronym || `#${dn}`,
                firstName: driver?.first_name || '',
                lastName: driver?.last_name || '',
                teamName: driver?.team_name || '',
                teamColor: driver?.team_colour ? `#${driver.team_colour}` : '#888888',
                sq1: hasSQ1 ? formatLapTime(sq1Best.get(dn)!) : null,
                sq2: hasSQ2 ? formatLapTime(sq2Best.get(dn)!) : null,
                sq3: hasSQ3 ? formatLapTime(sq3Best.get(dn)!) : null,
                eliminatedIn,
            });
        });

        // Sort: SQ3 drivers first (by SQ3 time), then SQ2 eliminates (by SQ2 time), then SQ1 eliminates (by SQ1 time)
        results.sort((a, b) => {
            // SQ3 drivers first
            if (a.sq3 && !b.sq3) return -1;
            if (!a.sq3 && b.sq3) return 1;
            if (a.sq3 && b.sq3) {
                return (sq3Best.get(a.driverNumber) || 999) - (sq3Best.get(b.driverNumber) || 999);
            }
            // Then SQ2 drivers
            if (a.sq2 && !b.sq2) return -1;
            if (!a.sq2 && b.sq2) return 1;
            if (a.sq2 && b.sq2) {
                return (sq2Best.get(a.driverNumber) || 999) - (sq2Best.get(b.driverNumber) || 999);
            }
            // Then SQ1 only
            return (sq1Best.get(a.driverNumber) || 999) - (sq1Best.get(b.driverNumber) || 999);
        });

        // Set positions
        results.forEach((r, i) => { r.position = i + 1; });

        return results;
    } catch (error) {
        console.error('Sprint qualifying classification error:', error);
        return [];
    }
}

// ===== Fetch all OpenF1 results for a round =====

export interface OpenF1ResultsPayload {
    practiceResults: Record<string, PracticeResult[]>; // 'fp1', 'fp2', 'fp3'
    sprintQualifying: SprintQualiResult[];
}

export async function getOpenF1ResultsForRound(
    year: number,
    circuitId: string
): Promise<OpenF1ResultsPayload> {
    const circuitName = getOpenF1CircuitName(circuitId);
    if (!circuitName) {
        return { practiceResults: {}, sprintQualifying: [] };
    }

    try {
        const sessions = await getOpenF1SessionsForMeeting(year, circuitName);
        if (sessions.length === 0) {
            return { practiceResults: {}, sprintQualifying: [] };
        }

        // Categorize sessions
        const practiceSessions = sessions
            .filter((s) => s.session_type === 'Practice')
            .sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime());

        const sprintQualiSession = sessions.find(
            (s) => s.session_name === 'Sprint Qualifying'
        );

        // Only fetch for completed sessions (end time in the past)
        const now = new Date();
        const completedPractice = practiceSessions.filter(
            (s) => new Date(s.date_end) < now
        );

        // Fetch practice results in parallel
        const practicePromises = completedPractice.map(async (session, idx) => {
            const key = `fp${idx + 1}`;
            const results = await getPracticeClassification(session.session_key);
            return { key, results };
        });

        const practiceEntries = await Promise.all(practicePromises);
        const practiceResults: Record<string, PracticeResult[]> = {};
        practiceEntries.forEach(({ key, results }) => {
            if (results.length > 0) {
                practiceResults[key] = results;
            }
        });

        // Sprint qualifying
        let sprintQualifying: SprintQualiResult[] = [];
        if (sprintQualiSession && new Date(sprintQualiSession.date_end) < now) {
            sprintQualifying = await getSprintQualifyingClassification(sprintQualiSession.session_key);
        }

        return { practiceResults, sprintQualifying };
    } catch (error) {
        console.error('OpenF1 results fetch error:', error);
        return { practiceResults: {}, sprintQualifying: [] };
    }
}
