import { useMemo } from 'react';
import { ReplayData, TimingRowData, TimingSnapshot } from '@/lib/api/timing';
import { OpenF1Lap, OpenF1Stint, OpenF1Position } from '@/lib/types/f1';

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

export function useReplayEngine(replayData: ReplayData | null | undefined, currentLap: number): TimingSnapshot | null {
    return useMemo(() => {
        if (!replayData) return null;

        const { drivers, laps, positions, stints, pitStops, raceControl } = replayData;

        // Filter data up to exactly currentLap
        const validLaps = laps.filter(l => l.lap_number <= currentLap);

        // Use lap start time or driver position logic. 
        // We estimate the "current time" as the maximum date of any valid lap
        let maxDate = validLaps.length > 0 ? new Date(validLaps[0].date_start).getTime() : 0;
        validLaps.forEach(l => {
            const d = new Date(l.date_start).getTime();
            if (d > maxDate) maxDate = d;
        });

        // Positions: Since positions don't always have a lap_number, we filter by Date <= maxDate, 
        // OR we can just use the latest lap number logic if positions correlate.
        // Actually, positions have a date. So we filter positions by date <= maxDate + 120000 (roughly lap end).
        const timeCutoff = maxDate > 0 ? maxDate + 120000 : Infinity;
        const validPositions = positions.filter(p => new Date(p.date).getTime() <= timeCutoff);
        const validStints = stints.filter(s => true); // Stints usually map to laps, we can take all and filter by logic
        const validPitStops = pitStops.filter(p => p.lap_number <= currentLap);
        const validRC = raceControl.filter(r => new Date(r.date).getTime() <= timeCutoff);

        const lapByDriver = latestByDriver<OpenF1Lap>(
            validLaps,
            (lap) => lap.driver_number,
            (next, current) => next.lap_number > current.lap_number
        );

        // A stint is active if the current lap is >= start lap (or stint number logic)
        // A simple way is to use the stint of the latest valid lap, or just the stint with highest number 
        // where we've seen a pitstop, but since we don't have start laps for stints easily, 
        // we'll approximate by finding the highest stint number where the driver had a pit stop before currentLap.
        const currentStintByDriver = new Map<number, OpenF1Stint>();
        drivers.forEach(d => {
            const driverStints = stints.filter(s => s.driver_number === d.driver_number).sort((a, b) => a.stint_number - b.stint_number);
            const driverPits = validPitStops.filter(p => p.driver_number === d.driver_number).length;
            // Pit stops + 1 = current stint number (roughly)
            const activeStintNum = driverPits + 1;
            const activeStint = driverStints.find(s => s.stint_number === activeStintNum) || driverStints[driverStints.length - 1];
            if (activeStint) currentStintByDriver.set(d.driver_number, activeStint);
        });

        const pitStopsByDriver = validPitStops.reduce<Map<number, number>>((acc, stop) => {
            const count = acc.get(stop.driver_number) || 0;
            acc.set(stop.driver_number, count + 1);
            return acc;
        }, new Map());

        const positionsByDriver = latestByDriver<OpenF1Position>(
            validPositions,
            (pos) => pos.driver_number,
            (next, current) => new Date(next.date).getTime() > new Date(current.date).getTime()
        );

        const driversWithPosition = [...drivers].filter((driver) => positionsByDriver.has(driver.driver_number));

        const baseRows = driversWithPosition
            .map((driver) => {
                const latestLap = lapByDriver.get(driver.driver_number);
                const currentStint = currentStintByDriver.get(driver.driver_number);
                const posEntry = positionsByDriver.get(driver.driver_number);

                return {
                    driverNumber: driver.driver_number,
                    code: driver.name_acronym || driver.broadcast_name?.slice(0, 3) || String(driver.driver_number),
                    broadcastName: driver.broadcast_name,
                    teamName: driver.team_name,
                    teamColor: driver.team_colour ? `#${driver.team_colour}` : '#888888',
                    position: posEntry ? posEntry.position : 99,
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
            raceControl: validRC.slice(-8).reverse(),
            updatedAt: new Date().toISOString(),
            sessionType: 'Race',
        };

    }, [replayData, currentLap]);
}
