import { NextResponse } from 'next/server';
import { getNextRace, getRaceCalendar } from '@/lib/api/jolpica';
import { Race, WeekendSchedule, SessionSchedule, GameSessionType } from '@/lib/types/f1';

export async function GET() {
    try {
        const race = await getNextRace();
        if (!race) {
            const calendar = await getRaceCalendar('current');
            const lastRace = calendar[calendar.length - 1];
            if (!lastRace) {
                return NextResponse.json({ error: 'No race data available' }, { status: 404 });
            }
            return NextResponse.json(buildSchedule(lastRace));
        }
        return NextResponse.json(buildSchedule(race));
    } catch (error) {
        console.error('Failed to fetch schedule:', error);
        return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
    }
}

function buildSchedule(race: Race): WeekendSchedule {
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
