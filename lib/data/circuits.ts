import { CircuitDetails } from '@/lib/types/f1';

export const CIRCUIT_DETAILS: Record<string, CircuitDetails> = {
    albert_park: {
        circuitId: 'albert_park',
        imageUrl: 'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000000/content/dam/fom-website/2018-redesign-assets/Racehub%20header%20images%2016x9/Australia.webp',
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
