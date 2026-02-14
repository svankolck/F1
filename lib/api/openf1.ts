import { OpenF1Session, OpenF1Driver, OpenF1Position, OpenF1Lap, OpenF1Stint, OpenF1Pit } from '@/lib/types/f1';

const BASE_URL = 'https://api.openf1.org/v1';

async function fetchOpenF1<T>(endpoint: string, params?: Record<string, string>): Promise<T[]> {
    const url = new URL(`${BASE_URL}${endpoint}`);
    if (params) {
        Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    }
    const res = await fetch(url.toString(), {
        next: { revalidate: 30 }, // Cache for 30 seconds (more frequent for live data)
    });
    if (!res.ok) throw new Error(`OpenF1 API error: ${res.status}`);
    return res.json();
}

// Get sessions (practice, qualifying, race)
export async function getSessions(params?: Record<string, string>): Promise<OpenF1Session[]> {
    return fetchOpenF1<OpenF1Session>('/sessions', params);
}

// Get the latest/current session
export async function getLatestSession(): Promise<OpenF1Session | null> {
    const sessions = await getSessions({
        year: new Date().getFullYear().toString(),
    });
    if (sessions.length === 0) return null;
    return sessions[sessions.length - 1];
}

// Get drivers for a session
export async function getDrivers(sessionKey: number): Promise<OpenF1Driver[]> {
    return fetchOpenF1<OpenF1Driver>('/drivers', {
        session_key: sessionKey.toString(),
    });
}

// Get positions for a session
export async function getPositions(sessionKey: number): Promise<OpenF1Position[]> {
    return fetchOpenF1<OpenF1Position>('/position', {
        session_key: sessionKey.toString(),
    });
}

// Get latest positions for a session
export async function getLatestPositions(sessionKey: number): Promise<OpenF1Position[]> {
    const positions = await getPositions(sessionKey);
    // Get latest position for each driver
    const latestMap = new Map<number, OpenF1Position>();
    positions.forEach((p) => {
        const existing = latestMap.get(p.driver_number);
        if (!existing || new Date(p.date) > new Date(existing.date)) {
            latestMap.set(p.driver_number, p);
        }
    });
    return Array.from(latestMap.values()).sort((a, b) => a.position - b.position);
}

// Get laps for a session
export async function getLaps(sessionKey: number, driverNumber?: number): Promise<OpenF1Lap[]> {
    const params: Record<string, string> = { session_key: sessionKey.toString() };
    if (driverNumber) params.driver_number = driverNumber.toString();
    return fetchOpenF1<OpenF1Lap>('/laps', params);
}

// Get stints (tyre compounds) for a session
export async function getStints(sessionKey: number): Promise<OpenF1Stint[]> {
    return fetchOpenF1<OpenF1Stint>('/stints', {
        session_key: sessionKey.toString(),
    });
}

// Get pit stops for a session
export async function getPitStops(sessionKey: number): Promise<OpenF1Pit[]> {
    return fetchOpenF1<OpenF1Pit>('/pit', {
        session_key: sessionKey.toString(),
    });
}

// Check if a session is currently live
export function isSessionLive(session: OpenF1Session): boolean {
    const now = new Date();
    const start = new Date(session.date_start);
    const end = new Date(session.date_end);
    return now >= start && now <= end;
}
