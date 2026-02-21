import {
    OpenF1Driver,
    OpenF1Lap,
    OpenF1Pit,
    OpenF1Position,
    OpenF1RaceControl,
    OpenF1Session,
    OpenF1Stint,
} from '@/lib/types/f1';
import {
    getDrivers,
    getLaps,
    getLatestPositions,
    getPositions,
    getPitStops,
    getRaceControl,
    getSessions,
    getStints,
    isSessionLive,
} from './openf1';

export type TimingMode = 'live' | 'replay';

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

export interface TimingSnapshot {
    rows: TimingRowData[];
    raceControl: OpenF1RaceControl[];
    updatedAt: string;
    sessionType: string;
}

export interface ReplayData {
    drivers: OpenF1Driver[];
    laps: OpenF1Lap[];
    positions: OpenF1Position[];
    stints: OpenF1Stint[];
    pitStops: OpenF1Pit[];
    raceControl: OpenF1RaceControl[];
}

export interface TimingBootstrap {
    mode: TimingMode;
    liveSession: OpenF1Session | null;
    replaySession: OpenF1Session | null;
    selectedSession: OpenF1Session | null;
    weekendSessions: OpenF1Session[];
    nextSession: OpenF1Session | null;
    snapshot: TimingSnapshot | null;
    replayData?: ReplayData | null;
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatLapSeconds(value: number | null | undefined): string {
    if (!value || value <= 0) return '—';
    const minutes = Math.floor(value / 60);
    const seconds = value % 60;
    return `${minutes}:${seconds.toFixed(3).padStart(6, '0')}`;
}

function formatDelta(value: number | null | undefined): string {
    if (value === null || value === undefined || !Number.isFinite(value)) return '—';
    return value > 0 ? `+${value.toFixed(3)}s` : `${value.toFixed(3)}s`;
}

function latestByDriver<T>(entries: T[], getDriver: (entry: T) => number, isNewer: (a: T, b: T) => boolean): Map<number, T> {
    const map = new Map<number, T>();
    entries.forEach((entry) => {
        const driver = getDriver(entry);
        const existing = map.get(driver);
        if (!existing || isNewer(entry, existing)) {
            map.set(driver, entry);
        }
    });
    return map;
}

function getSessionDate(session: OpenF1Session): number {
    return new Date(session.date_start).getTime();
}

function sortSessions(sessions: OpenF1Session[]): OpenF1Session[] {
    return [...sessions].sort((a, b) => getSessionDate(a) - getSessionDate(b));
}

async function getLiveSessionAndNext(year: number): Promise<{ liveSession: OpenF1Session | null; nextSession: OpenF1Session | null; }> {
    const sessions = sortSessions(await getSessions({ year: year.toString() }).catch(() => []));
    const now = Date.now();

    const liveSessions = sessions.filter((session) => isSessionLive(session));
    const liveSession = liveSessions.length ? liveSessions[liveSessions.length - 1] : null;

    const nextSession = sessions.find((session) => new Date(session.date_start).getTime() > now) || null;

    return { liveSession, nextSession };
}

async function getLatestCompletedRaceSession(year: number): Promise<OpenF1Session | null> {
    const now = Date.now();
    const currentYearRaces = await getSessions({ year: year.toString(), session_type: 'Race' }).catch(() => []);
    const previousYearRaces = await getSessions({ year: (year - 1).toString(), session_type: 'Race' }).catch(() => []);

    const allRaceSessions = [...currentYearRaces, ...previousYearRaces]
        .filter((session) => session.session_name === 'Race')
        .filter((session) => new Date(session.date_end).getTime() <= now)
        .sort((a, b) => new Date(b.date_end).getTime() - new Date(a.date_end).getTime());

    return allRaceSessions[0] || null;
}

async function getSessionByKey(sessionKey: number): Promise<OpenF1Session | null> {
    const sessions = await getSessions({ session_key: sessionKey.toString() }).catch(() => []);
    return sessions[0] || null;
}

export async function getReplayData(session: OpenF1Session): Promise<ReplayData> {
    const sessionKey = session.session_key;
    const drivers = await getDrivers(sessionKey).catch(() => [] as OpenF1Driver[]);
    await delay(350);
    const laps = await getLaps(sessionKey).catch(() => [] as OpenF1Lap[]);
    await delay(350);
    const positions = await getPositions(sessionKey).catch(() => [] as OpenF1Position[]);
    await delay(350);
    const stints = await getStints(sessionKey).catch(() => [] as OpenF1Stint[]);
    await delay(350);
    const pitStops = await getPitStops(sessionKey).catch(() => [] as OpenF1Pit[]);
    await delay(350);
    const raceControl = await getRaceControl(sessionKey).catch(() => [] as OpenF1RaceControl[]);

    return { drivers, laps, positions, stints, pitStops, raceControl };
}

export async function buildTimingSnapshot(session: OpenF1Session): Promise<TimingSnapshot> {
    const sessionKey = session.session_key;

    const drivers = await getDrivers(sessionKey).catch(() => [] as OpenF1Driver[]);
    await delay(350);
    const latestPositions = await getLatestPositions(sessionKey).catch(() => []);
    await delay(350);
    const laps = await getLaps(sessionKey).catch(() => [] as OpenF1Lap[]);
    await delay(350);
    const stints = await getStints(sessionKey).catch(() => [] as OpenF1Stint[]);
    await delay(350);
    const pitStops = await getPitStops(sessionKey).catch(() => [] as OpenF1Pit[]);
    await delay(350);
    const raceControl = await getRaceControl(sessionKey).catch(() => [] as OpenF1RaceControl[]);

    const lapByDriver = latestByDriver<OpenF1Lap>(
        laps,
        (lap) => lap.driver_number,
        (next, current) => next.lap_number > current.lap_number
    );

    const stintByDriver = latestByDriver<OpenF1Stint>(
        stints,
        (stint) => stint.driver_number,
        (next, current) => next.stint_number > current.stint_number
    );

    const pitStopsByDriver = pitStops.reduce<Map<number, number>>((acc, stop) => {
        const count = acc.get(stop.driver_number) || 0;
        acc.set(stop.driver_number, count + 1);
        return acc;
    }, new Map());

    const positionsByDriver = latestPositions.reduce<Map<number, number>>((acc, entry) => {
        acc.set(entry.driver_number, entry.position);
        return acc;
    }, new Map());

    const driversWithPosition = [...drivers].filter((driver) => positionsByDriver.has(driver.driver_number));

    const baseRows = driversWithPosition
        .map((driver) => {
            const latestLap = lapByDriver.get(driver.driver_number);
            const currentStint = stintByDriver.get(driver.driver_number);

            return {
                driverNumber: driver.driver_number,
                code: driver.name_acronym || driver.broadcast_name?.slice(0, 3) || String(driver.driver_number),
                broadcastName: driver.broadcast_name,
                teamName: driver.team_name,
                teamColor: driver.team_colour ? `#${driver.team_colour}` : '#888888',
                position: positionsByDriver.get(driver.driver_number) || 99,
                lapDurationValue: latestLap?.lap_duration ?? null,
                lastLap: formatLapSeconds(latestLap?.lap_duration),
                sector1: latestLap?.duration_sector_1?.toFixed(3) || '—',
                sector2: latestLap?.duration_sector_2?.toFixed(3) || '—',
                sector3: latestLap?.duration_sector_3?.toFixed(3) || '—',
                pitStops: pitStopsByDriver.get(driver.driver_number) || 0,
                tyre: currentStint?.compound || '—',
            };
        })
        .sort((a, b) => a.position - b.position);

    const leaderLap = baseRows[0]?.lapDurationValue ?? null;

    const rows: TimingRowData[] = baseRows.map((row, index) => {
        const previous = index > 0 ? baseRows[index - 1] : null;
        const interval = previous ? formatDelta((row.lapDurationValue ?? 0) - (previous.lapDurationValue ?? 0)) : '—';
        const gapToLeader = index === 0 ? 'Leader' : formatDelta((row.lapDurationValue ?? 0) - (leaderLap ?? 0));

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

    return {
        rows,
        raceControl: raceControl.slice(-8).reverse(),
        updatedAt: new Date().toISOString(),
        sessionType: session.session_type,
    };
}

export async function getTimingBootstrap(preferredSessionKey?: number): Promise<TimingBootstrap> {
    const currentYear = new Date().getFullYear();
    const { liveSession, nextSession } = await getLiveSessionAndNext(currentYear);
    const replaySession = await getLatestCompletedRaceSession(currentYear);

    let mode: TimingMode = liveSession ? 'live' : 'replay';

    let selectedSession: OpenF1Session | null = null;
    if (preferredSessionKey) {
        selectedSession = await getSessionByKey(preferredSessionKey);
        if (selectedSession) {
            mode = isSessionLive(selectedSession) ? 'live' : 'replay';
        }
    }

    if (!selectedSession) {
        selectedSession = liveSession || replaySession;
    }

    let weekendSessions: OpenF1Session[] = [];
    if (selectedSession?.meeting_key) {
        const sessions = await getSessions({ meeting_key: selectedSession.meeting_key.toString() }).catch(() => []);
        weekendSessions = sortSessions(sessions);
    }

    let snapshot = null;
    let replayData = null;

    if (selectedSession) {
        if (mode === 'live') {
            snapshot = await buildTimingSnapshot(selectedSession);
        } else {
            replayData = await getReplayData(selectedSession);
            // Build an initial snapshot for lap 1 or the latest
            snapshot = await buildTimingSnapshot(selectedSession);
        }
    }

    return {
        mode,
        liveSession,
        replaySession,
        selectedSession,
        weekendSessions,
        nextSession,
        snapshot,
        replayData,
    };
}
