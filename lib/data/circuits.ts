import { CircuitDetails } from '@/lib/types/f1';

export const CIRCUIT_DETAILS: Record<string, CircuitDetails> = {
    albert_park: {
        circuitId: 'albert_park',
        length: '5.278km',
        firstGrandPrix: '1996',
        laps: 58,
        raceDistance: '306.124km',
        lapRecord: {
            time: '1:19.813',
            driver: 'Charles Leclerc',
            year: '2024',
        },
    },
    // Add other circuits here as needed
};
