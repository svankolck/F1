import {
    OpenF1Driver,
    OpenF1Lap,
    OpenF1Position,
    OpenF1Session,
    OpenF1Stint,
    OpenF1Pit,
} from '@/lib/types/f1';
import {
    getDrivers,
    getLaps,
    getLatestPositions,
    getPitStops,
    getSessions,
    getStints,
    isSessionLive,
} from './openf1';

// ===== Types =====

export interface TimingRowData {
    driverNumber: number;
    code: string;
    broadcastName: string;
    teamName: string;
    teamColor: string;
    position: number;
    interval: string;
    gapToLeader: string;
    lastLap: string;
    sector1: string;
    sector2: string;
    sector3: string;
    pitStops: number;
    tyre: string;
}

export interface TimingResponse {
    mode: 'live' | 'idle';
    session: OpenF1Session | null;
    rows: TimingRowData[];
    updatedAt: string;
    weekendSessions: OpenF1Session[];
    nextSession: OpenF1Session | null;
}

// ===== Server-side Cache =====

interface CacheEntry {
    data: TimingResponse;
    timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5000; // 5 seconds

function getCached(key: string): TimingResponse | null {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
        cache.delete(key);
        return null;
    }
    return entry.data;
}

function setCache(key: string, data: TimingResponse): void {
    cache.set(key, { data, timestamp: Date.now() });
}

// ===== Helpers =====

function formatLapTime(value: number | null | undefined): string {
    if (!value || value <= 0) return '—';
    const minutes = Math.floor(value / 60);
    const seconds = value % 60;
    return `${minutes}:${seconds.toFixed(3).padStart(6, '0')}`;
}

function formatDelta(value: number | null | undefined): string {
    if (value === null || value === undefined || !Number.isFinite(value)) return '—';
    return value > 0 ? `+${value.toFixed(3)}s` : `${value.toFixed(3)}s`;
}

function latestByDriver<T>(
    entries: T[],
    getDriver: (e: T) => number,
    isNewer: (a: T, b: T) => boolean
): Map<number, T> {
    const map = new Map<number, T>();
    for (const entry of entries) {
        const driver = getDriver(entry);
        const existing = map.get(driver);
        if (!existing || isNewer(entry, existing)) {
            map.set(driver, entry);
        }
    }
    return map;
}

function sortSessions(sessions: OpenF1Session[]): OpenF1Session[] {
    return [...sessions].sort(
        (a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime()
    );
}

// ===== Core Functions =====

async function findLiveAndNextSession(year: number): Promise<{
    liveSession: OpenF1Session | null;
    nextSession: OpenF1Session | null;
}> {
    const sessions = sortSessions(
        await getSessions({ year: year.toString() }).catch(() => [])
    );
    const now = Date.now();

    const liveSession =
        [...sessions].reverse().find((s) => isSessionLive(s)) || null;

    const nextSession =
        sessions.find((s) => new Date(s.date_start).getTime() > now) || null;

    return { liveSession, nextSession };
}

async function findLatestCompletedSession(year: number): Promise<OpenF1Session | null> {
    const now = Date.now();
    const [currentRaces, prevRaces] = await Promise.all([
        getSessions({ year: year.toString(), session_type: 'Race' }).catch(() => []),
        getSessions({ year: (year - 1).toString(), session_type: 'Race' }).catch(() => []),
    ]);

    const completed = [...currentRaces, ...prevRaces]
        .filter((s) => s.session_name === 'Race' && new Date(s.date_end).getTime() <= now)
        .sort((a, b) => new Date(b.date_end).getTime() - new Date(a.date_end).getTime());

    return completed[0] || null;
}

async function buildRows(session: OpenF1Session): Promise<TimingRowData[]> {
    const sessionKey = session.session_key;

    // Parallel fetch — the key performance improvement
    const [drivers, latestPositions, laps, stints, pitStops] = await Promise.all([
        getDrivers(sessionKey).catch(() => [] as OpenF1Driver[]),
        getLatestPositions(sessionKey).catch(() => [] as OpenF1Position[]),
        getLaps(sessionKey).catch(() => [] as OpenF1Lap[]),
        getStints(sessionKey).catch(() => [] as OpenF1Stint[]),
        getPitStops(sessionKey).catch(() => [] as OpenF1Pit[]),
    ]);

    const lapByDriver = latestByDriver<OpenF1Lap>(
        laps,
        (l) => l.driver_number,
        (a, b) => a.lap_number > b.lap_number
    );

    const stintByDriver = latestByDriver<OpenF1Stint>(
        stints,
        (s) => s.driver_number,
        (a, b) => a.stint_number > b.stint_number
    );

    const pitCountByDriver = pitStops.reduce<Map<number, number>>((acc, stop) => {
        acc.set(stop.driver_number, (acc.get(stop.driver_number) || 0) + 1);
        return acc;
    }, new Map());

    const positionByDriver = new Map<number, number>();
    for (const p of latestPositions) {
        positionByDriver.set(p.driver_number, p.position);
    }

    const driversWithPosition = drivers.filter((d) => positionByDriver.has(d.driver_number));

    const baseRows = driversWithPosition
        .map((driver) => {
            const lap = lapByDriver.get(driver.driver_number);
            const stint = stintByDriver.get(driver.driver_number);

            return {
                driverNumber: driver.driver_number,
                code: driver.name_acronym || driver.broadcast_name?.slice(0, 3) || String(driver.driver_number),
                broadcastName: driver.broadcast_name,
                teamName: driver.team_name,
                teamColor: driver.team_colour ? `#${driver.team_colour}` : '#888888',
                position: positionByDriver.get(driver.driver_number) || 99,
                lapDuration: lap?.lap_duration ?? null,
                lastLap: formatLapTime(lap?.lap_duration),
                sector1: lap?.duration_sector_1?.toFixed(3) || '—',
                sector2: lap?.duration_sector_2?.toFixed(3) || '—',
                sector3: lap?.duration_sector_3?.toFixed(3) || '—',
                pitStops: pitCountByDriver.get(driver.driver_number) || 0,
                tyre: stint?.compound || '—',
            };
        })
        .sort((a, b) => a.position - b.position);

    // Calculate interval + gap to leader
    const leaderLap = baseRows[0]?.lapDuration ?? null;

    return baseRows.map((row, i) => {
        const prev = i > 0 ? baseRows[i - 1] : null;
        const interval = prev
            ? formatDelta((row.lapDuration ?? 0) - (prev.lapDuration ?? 0))
            : '—';
        const gapToLeader =
            i === 0 ? 'Leader' : formatDelta((row.lapDuration ?? 0) - (leaderLap ?? 0));

        return {
            driverNumber: row.driverNumber,
            code: row.code,
            broadcastName: row.broadcastName,
            teamName: row.teamName,
            teamColor: row.teamColor,
            position: row.position,
            interval,
            gapToLeader,
            lastLap: row.lastLap,
            sector1: row.sector1,
            sector2: row.sector2,
            sector3: row.sector3,
            pitStops: row.pitStops,
            tyre: row.tyre,
        };
    });
}

// ===== Main Entry Point =====

export async function getTimingData(preferredSessionKey?: number): Promise<TimingResponse> {
    const cacheKey = `timing-${preferredSessionKey || 'default'}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const currentYear = new Date().getFullYear();
    const { liveSession, nextSession } = await findLiveAndNextSession(currentYear);

    let session: OpenF1Session | null = null;
    let mode: 'live' | 'idle' = 'idle';

    // If a specific session was requested, use it
    if (preferredSessionKey) {
        const sessions = await getSessions({ session_key: preferredSessionKey.toString() }).catch(() => []);
        session = sessions[0] || null;
        if (session && isSessionLive(session)) {
            mode = 'live';
        }
    }

    // Fallback: use live session or latest completed race
    if (!session) {
        if (liveSession) {
            session = liveSession;
            mode = 'live';
        } else {
            session = await findLatestCompletedSession(currentYear);
        }
    }

    // Get weekend sessions for the selector
    let weekendSessions: OpenF1Session[] = [];
    if (session?.meeting_key) {
        const sessions = await getSessions({ meeting_key: session.meeting_key.toString() }).catch(() => []);
        weekendSessions = sortSessions(sessions);
    }

    // Build rows
    const rows = session ? await buildRows(session) : [];

    const result: TimingResponse = {
        mode,
        session,
        rows,
        updatedAt: new Date().toISOString(),
        weekendSessions,
        nextSession,
    };

    setCache(cacheKey, result);
    return result;
}
