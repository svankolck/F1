import { getDriverStandings, getRaceCalendar } from '@/lib/api/jolpica';
import { getDriverImageUrl, getTeamColor, Race } from '@/lib/types/f1';

export interface BattleDriver {
    driverId: string;
    code: string;
    givenName: string;
    familyName: string;
    constructorId: string;
    constructorName: string;
    teamColor: string;
    imageUrl: string;
    points: number;
}

export interface BattleDataPoint {
    round: number;
    roundLabel: string;
    raceName: string;
    circuitName: string;
    [driverId: string]: number | string;
}

export interface BattlePayload {
    season: string;
    races: Race[];
    drivers: BattleDriver[];
    data: BattleDataPoint[];
    defaultDriverIds: string[];
}

function parsePoints(value: string): number {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

export async function getBattlePayload(season: string = 'current'): Promise<BattlePayload> {
    const races = await getRaceCalendar(season).catch(() => []);

    if (!races.length) {
        return { season, races: [], drivers: [], data: [], defaultDriverIds: [] };
    }

    const standingsByRound = await Promise.all(
        races.map((race) => getDriverStandings(season, race.round).catch(() => []))
    );

    const finalStandings = [...standingsByRound].reverse().find((entries) => entries.length > 0)
        || await getDriverStandings(season).catch(() => []);

    const drivers: BattleDriver[] = finalStandings.map((entry) => {
        const constructor = entry.Constructors[0];
        return {
            driverId: entry.Driver.driverId,
            code: entry.Driver.code,
            givenName: entry.Driver.givenName,
            familyName: entry.Driver.familyName,
            constructorId: constructor?.constructorId || '',
            constructorName: constructor?.name || 'Unknown Team',
            teamColor: getTeamColor(constructor?.constructorId || ''),
            imageUrl: getDriverImageUrl(entry.Driver.driverId),
            points: parsePoints(entry.points),
        };
    });

    const data: BattleDataPoint[] = races.map((race, index) => {
        const roundStandings = standingsByRound[index] || [];
        const row: BattleDataPoint = {
            round: Number.parseInt(race.round, 10),
            roundLabel: `R${race.round}`,
            raceName: race.raceName,
            circuitName: race.Circuit.circuitName,
        };

        roundStandings.forEach((standing) => {
            row[standing.Driver.driverId] = parsePoints(standing.points);
        });

        return row;
    });

    const defaultDriverIds = drivers.slice(0, 3).map((driver) => driver.driverId);

    return {
        season,
        races,
        drivers,
        data,
        defaultDriverIds,
    };
}
