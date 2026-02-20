import { getDriverStandings, getNextRace, getRaceCalendar, getRace } from './jolpica';
import { GameDriver, getTeamColor, getDriverImageUrl, Race, WeekendSchedule, SessionSchedule, GameSessionType } from '../types/f1';

export const FALLBACK_2026_DRIVERS: GameDriver[] = [
    // McLaren
    { driverId: 'norris', code: 'NOR', firstName: 'Lando', lastName: 'Norris', teamName: 'McLaren', teamColor: getTeamColor('mclaren'), headshotUrl: getDriverImageUrl('norris'), number: '4' },
    { driverId: 'piastri', code: 'PIA', firstName: 'Oscar', lastName: 'Piastri', teamName: 'McLaren', teamColor: getTeamColor('mclaren'), headshotUrl: getDriverImageUrl('piastri'), number: '81' },
    // Red Bull
    { driverId: 'max_verstappen', code: 'VER', firstName: 'Max', lastName: 'Verstappen', teamName: 'Red Bull', teamColor: getTeamColor('red_bull'), headshotUrl: getDriverImageUrl('max_verstappen'), number: '1' },
    { driverId: 'hadjar', code: 'HAD', firstName: 'Isack', lastName: 'Hadjar', teamName: 'Red Bull', teamColor: getTeamColor('red_bull'), headshotUrl: getDriverImageUrl('hadjar'), number: '6' },
    // Ferrari
    { driverId: 'leclerc', code: 'LEC', firstName: 'Charles', lastName: 'Leclerc', teamName: 'Ferrari', teamColor: getTeamColor('ferrari'), headshotUrl: getDriverImageUrl('leclerc'), number: '16' },
    { driverId: 'hamilton', code: 'HAM', firstName: 'Lewis', lastName: 'Hamilton', teamName: 'Ferrari', teamColor: getTeamColor('ferrari'), headshotUrl: getDriverImageUrl('hamilton'), number: '44' },
    // Mercedes
    { driverId: 'russell', code: 'RUS', firstName: 'George', lastName: 'Russell', teamName: 'Mercedes', teamColor: getTeamColor('mercedes'), headshotUrl: getDriverImageUrl('russell'), number: '63' },
    { driverId: 'antonelli', code: 'ANT', firstName: 'Kimi', lastName: 'Antonelli', teamName: 'Mercedes', teamColor: getTeamColor('mercedes'), headshotUrl: getDriverImageUrl('antonelli'), number: '12' },
    // Aston Martin
    { driverId: 'alonso', code: 'ALO', firstName: 'Fernando', lastName: 'Alonso', teamName: 'Aston Martin', teamColor: getTeamColor('aston_martin'), headshotUrl: getDriverImageUrl('alonso'), number: '14' },
    { driverId: 'stroll', code: 'STR', firstName: 'Lance', lastName: 'Stroll', teamName: 'Aston Martin', teamColor: getTeamColor('aston_martin'), headshotUrl: getDriverImageUrl('stroll'), number: '18' },
    // Alpine
    { driverId: 'gasly', code: 'GAS', firstName: 'Pierre', lastName: 'Gasly', teamName: 'Alpine', teamColor: getTeamColor('alpine'), headshotUrl: getDriverImageUrl('gasly'), number: '10' },
    { driverId: 'colapinto', code: 'COL', firstName: 'Franco', lastName: 'Colapinto', teamName: 'Alpine', teamColor: getTeamColor('alpine'), headshotUrl: getDriverImageUrl('colapinto'), number: '43' },
    // Williams
    { driverId: 'albon', code: 'ALB', firstName: 'Alex', lastName: 'Albon', teamName: 'Williams', teamColor: getTeamColor('williams'), headshotUrl: getDriverImageUrl('albon'), number: '23' },
    { driverId: 'sainz', code: 'SAI', firstName: 'Carlos', lastName: 'Sainz', teamName: 'Williams', teamColor: getTeamColor('williams'), headshotUrl: getDriverImageUrl('sainz'), number: '55' },
    // Racing Bulls
    { driverId: 'lawson', code: 'LAW', firstName: 'Liam', lastName: 'Lawson', teamName: 'Racing Bulls', teamColor: getTeamColor('racing_bulls'), headshotUrl: getDriverImageUrl('lawson'), number: '30' },
    { driverId: 'lindblad', code: 'LIN', firstName: 'Arvid', lastName: 'Lindblad', teamName: 'Racing Bulls', teamColor: getTeamColor('racing_bulls'), headshotUrl: getDriverImageUrl('lindblad'), number: '2' },
    // Audi (formerly Sauber)
    { driverId: 'hulkenberg', code: 'HUL', firstName: 'Nico', lastName: 'Hulkenberg', teamName: 'Audi', teamColor: getTeamColor('audi'), headshotUrl: getDriverImageUrl('hulkenberg'), number: '27' },
    { driverId: 'bortoleto', code: 'BOR', firstName: 'Gabriel', lastName: 'Bortoleto', teamName: 'Audi', teamColor: getTeamColor('audi'), headshotUrl: getDriverImageUrl('bortoleto'), number: '5' },
    // Haas
    { driverId: 'ocon', code: 'OCO', firstName: 'Esteban', lastName: 'Ocon', teamName: 'Haas', teamColor: getTeamColor('haas'), headshotUrl: getDriverImageUrl('ocon'), number: '31' },
    { driverId: 'bearman', code: 'BEA', firstName: 'Oliver', lastName: 'Bearman', teamName: 'Haas', teamColor: getTeamColor('haas'), headshotUrl: getDriverImageUrl('bearman'), number: '87' },
    // Cadillac
    { driverId: 'perez', code: 'PER', firstName: 'Sergio', lastName: 'Pérez', teamName: 'Cadillac', teamColor: getTeamColor('cadillac'), headshotUrl: getDriverImageUrl('perez'), number: '11' },
    { driverId: 'bottas', code: 'BOT', firstName: 'Valtteri', lastName: 'Bottas', teamName: 'Cadillac', teamColor: getTeamColor('cadillac'), headshotUrl: getDriverImageUrl('bottas'), number: '77' },
];

export async function getGameDrivers(): Promise<GameDriver[]> {
    // The 2026 season hasn't started yet, so the Jolpica API returns 2025 standings.
    // Use the confirmed 2026 grid directly. Once the season starts and the API returns
    // 2026 data, this can be switched back to fetching from the API.
    const currentYear = new Date().getFullYear();
    if (currentYear >= 2026) {
        // Check if 2026 season data is available from the API
        try {
            const standings = await getDriverStandings('2026');
            if (standings && standings.length >= 18) {
                // API has real 2026 data — use it
                return standings.map(s => ({
                    driverId: s.Driver.driverId,
                    code: s.Driver.code,
                    firstName: s.Driver.givenName,
                    lastName: s.Driver.familyName,
                    teamName: s.Constructors[0]?.name || 'Unknown',
                    teamColor: getTeamColor(s.Constructors[0]?.constructorId || ''),
                    headshotUrl: getDriverImageUrl(s.Driver.driverId),
                    number: s.Driver.permanentNumber || '',
                }));
            }
        } catch {
            // API doesn't have 2026 data yet — fall through to hardcoded list
        }
    }

    // Use the confirmed 2026 driver grid
    return FALLBACK_2026_DRIVERS;
}

export function buildWeekendSchedule(race: Race): WeekendSchedule {
    const isSprint = !!race.Sprint;
    const now = new Date();
    const sessions: SessionSchedule[] = [];

    // Qualifying session
    if (race.Qualifying) {
        const startTime = `${race.Qualifying.date}T${race.Qualifying.time}`;
        sessions.push({
            type: 'qualifying' as GameSessionType,
            label: 'Kwalificatie',
            startTime,
            isLocked: now >= new Date(startTime),
            isCompleted: now >= new Date(new Date(startTime).getTime() + 2 * 60 * 60 * 1000),
        });
    }

    // Sprint qualifying
    if (isSprint && race.SprintQualifying) {
        const startTime = `${race.SprintQualifying.date}T${race.SprintQualifying.time}`;
        sessions.push({
            type: 'sprint_qualifying' as GameSessionType,
            label: 'Sprint Kwalificatie',
            startTime,
            isLocked: now >= new Date(startTime),
            isCompleted: now >= new Date(new Date(startTime).getTime() + 1.5 * 60 * 60 * 1000),
        });
    }

    // Sprint race
    if (isSprint && race.Sprint) {
        const startTime = `${race.Sprint.date}T${race.Sprint.time}`;
        sessions.push({
            type: 'sprint' as GameSessionType,
            label: 'Sprint Race',
            startTime,
            isLocked: now >= new Date(startTime),
            isCompleted: now >= new Date(new Date(startTime).getTime() + 1 * 60 * 60 * 1000),
        });
    }

    // Main race
    const raceTime = race.time || '14:00:00Z';
    const raceStart = `${race.date}T${raceTime}`;
    sessions.push({
        type: 'race' as GameSessionType,
        label: 'Race',
        startTime: raceStart,
        isLocked: now >= new Date(raceStart),
        isCompleted: now >= new Date(new Date(raceStart).getTime() + 2.5 * 60 * 60 * 1000),
    });

    // Sort by start time
    sessions.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    return {
        season: parseInt(race.season),
        round: parseInt(race.round),
        raceName: race.raceName,
        circuitName: race.Circuit?.circuitName || '',
        country: race.Circuit?.Location?.country || '',
        isSprint,
        sessions,
    };
}



// ... (existing code)

export async function getWeekendSchedule(season?: number | string, round?: number | string): Promise<WeekendSchedule | null> {
    try {
        let race: Race | null = null;

        if (season && round) {
            race = await getRace(season.toString(), round.toString());
        } else {
            race = await getNextRace();
            if (!race) {
                const calendar = await getRaceCalendar('current');
                const lastRace = calendar[calendar.length - 1];
                if (lastRace) race = lastRace;
            }
        }

        if (!race) return null;
        return buildWeekendSchedule(race);
    } catch (error) {
        console.error('Failed to get weekend schedule:', error);
        return null;
    }
}

export async function getGameSchedule(): Promise<WeekendSchedule | null> {
    return getWeekendSchedule();
}
