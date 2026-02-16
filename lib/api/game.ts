import { getDriverStandings, getNextRace, getRaceCalendar, getRace } from './jolpica';
import { GameDriver, getTeamColor, getDriverImageUrl, Race, WeekendSchedule, SessionSchedule, GameSessionType } from '../types/f1';

export const FALLBACK_2026_DRIVERS: GameDriver[] = [
    { driverId: 'norris', code: 'NOR', firstName: 'Lando', lastName: 'Norris', teamName: 'McLaren', teamColor: getTeamColor('mclaren'), headshotUrl: getDriverImageUrl('norris'), number: '4' },
    { driverId: 'piastri', code: 'PIA', firstName: 'Oscar', lastName: 'Piastri', teamName: 'McLaren', teamColor: getTeamColor('mclaren'), headshotUrl: getDriverImageUrl('piastri'), number: '81' },
    { driverId: 'max_verstappen', code: 'VER', firstName: 'Max', lastName: 'Verstappen', teamName: 'Red Bull', teamColor: getTeamColor('red_bull'), headshotUrl: getDriverImageUrl('max_verstappen'), number: '1' },
    { driverId: 'tsunoda', code: 'TSU', firstName: 'Yuki', lastName: 'Tsunoda', teamName: 'Red Bull', teamColor: getTeamColor('red_bull'), headshotUrl: getDriverImageUrl('tsunoda'), number: '22' },
    { driverId: 'leclerc', code: 'LEC', firstName: 'Charles', lastName: 'Leclerc', teamName: 'Ferrari', teamColor: getTeamColor('ferrari'), headshotUrl: getDriverImageUrl('leclerc'), number: '16' },
    { driverId: 'hamilton', code: 'HAM', firstName: 'Lewis', lastName: 'Hamilton', teamName: 'Ferrari', teamColor: getTeamColor('ferrari'), headshotUrl: getDriverImageUrl('hamilton'), number: '44' },
    { driverId: 'russell', code: 'RUS', firstName: 'George', lastName: 'Russell', teamName: 'Mercedes', teamColor: getTeamColor('mercedes'), headshotUrl: getDriverImageUrl('russell'), number: '63' },
    { driverId: 'antonelli', code: 'ANT', firstName: 'Kimi', lastName: 'Antonelli', teamName: 'Mercedes', teamColor: getTeamColor('mercedes'), headshotUrl: getDriverImageUrl('antonelli'), number: '12' },
    { driverId: 'alonso', code: 'ALO', firstName: 'Fernando', lastName: 'Alonso', teamName: 'Aston Martin', teamColor: getTeamColor('aston_martin'), headshotUrl: getDriverImageUrl('alonso'), number: '14' },
    { driverId: 'stroll', code: 'STR', firstName: 'Lance', lastName: 'Stroll', teamName: 'Aston Martin', teamColor: getTeamColor('aston_martin'), headshotUrl: getDriverImageUrl('stroll'), number: '18' },
    { driverId: 'gasly', code: 'GAS', firstName: 'Pierre', lastName: 'Gasly', teamName: 'Alpine', teamColor: getTeamColor('alpine'), headshotUrl: getDriverImageUrl('gasly'), number: '10' },
    { driverId: 'doohan', code: 'DOO', firstName: 'Jack', lastName: 'Doohan', teamName: 'Alpine', teamColor: getTeamColor('alpine'), headshotUrl: getDriverImageUrl('doohan'), number: '7' },
    { driverId: 'albon', code: 'ALB', firstName: 'Alex', lastName: 'Albon', teamName: 'Williams', teamColor: getTeamColor('williams'), headshotUrl: getDriverImageUrl('albon'), number: '23' },
    { driverId: 'sainz', code: 'SAI', firstName: 'Carlos', lastName: 'Sainz', teamName: 'Williams', teamColor: getTeamColor('williams'), headshotUrl: getDriverImageUrl('sainz'), number: '55' },
    { driverId: 'hadjar', code: 'HAD', firstName: 'Isack', lastName: 'Hadjar', teamName: 'RB', teamColor: getTeamColor('rb'), headshotUrl: getDriverImageUrl('hadjar'), number: '6' },
    { driverId: 'lawson', code: 'LAW', firstName: 'Liam', lastName: 'Lawson', teamName: 'RB', teamColor: getTeamColor('rb'), headshotUrl: getDriverImageUrl('lawson'), number: '30' },
    { driverId: 'hulkenberg', code: 'HUL', firstName: 'Nico', lastName: 'Hulkenberg', teamName: 'Sauber', teamColor: getTeamColor('sauber'), headshotUrl: getDriverImageUrl('hulkenberg'), number: '27' },
    { driverId: 'bortoleto', code: 'BOR', firstName: 'Gabriel', lastName: 'Bortoleto', teamName: 'Sauber', teamColor: getTeamColor('sauber'), headshotUrl: getDriverImageUrl('bortoleto'), number: '5' },
    { driverId: 'ocon', code: 'OCO', firstName: 'Esteban', lastName: 'Ocon', teamName: 'Haas', teamColor: getTeamColor('haas'), headshotUrl: getDriverImageUrl('ocon'), number: '31' },
    { driverId: 'bearman', code: 'BEA', firstName: 'Oliver', lastName: 'Bearman', teamName: 'Haas', teamColor: getTeamColor('haas'), headshotUrl: getDriverImageUrl('bearman'), number: '87' },
];

export async function getGameDrivers(): Promise<GameDriver[]> {
    try {
        const standings = await getDriverStandings('current');
        if (!standings || standings.length === 0) return FALLBACK_2026_DRIVERS;

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
    } catch (error) {
        console.error('Failed to fetch game drivers:', error);
        return FALLBACK_2026_DRIVERS;
    }
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
