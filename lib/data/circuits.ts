import { CircuitDetails } from '@/lib/types/f1';

// F1 CDN base for racehub header images (16x9)
const F1_IMG = (country: string) =>
    `https://media.formula1.com/image/upload/f_auto,c_limit,w_1440,q_auto/f_auto/q_auto/content/dam/fom-website/2018-redesign-assets/Racehub%20header%20images%2016x9/${country}`;

export const CIRCUIT_DETAILS: Record<string, CircuitDetails> = {
    // Round 1 — Australia
    albert_park: {
        circuitId: 'albert_park',
        imageUrl: F1_IMG('Australia'),
        length: '5.278 km',
        firstGrandPrix: '1996',
        laps: 58,
        raceDistance: '306.124 km',
        lapRecord: { time: '1:19.813', driver: 'Charles Leclerc', year: '2024' },
    },

    // Round 2 — China
    shanghai: {
        circuitId: 'shanghai',
        imageUrl: F1_IMG('China'),
        length: '5.451 km',
        firstGrandPrix: '2004',
        laps: 56,
        raceDistance: '305.066 km',
        lapRecord: { time: '1:32.238', driver: 'Michael Schumacher', year: '2004' },
    },

    // Round 3 — Japan
    suzuka: {
        circuitId: 'suzuka',
        imageUrl: F1_IMG('Japan'),
        length: '5.807 km',
        firstGrandPrix: '1987',
        laps: 53,
        raceDistance: '307.471 km',
        lapRecord: { time: '1:30.983', driver: 'Lewis Hamilton', year: '2019' },
    },

    // Round 4 — Bahrain
    bahrain: {
        circuitId: 'bahrain',
        imageUrl: F1_IMG('Bahrain'),
        length: '5.412 km',
        firstGrandPrix: '2004',
        laps: 57,
        raceDistance: '308.238 km',
        lapRecord: { time: '1:31.447', driver: 'Pedro de la Rosa', year: '2005' },
    },

    // Round 5 — Saudi Arabia
    jeddah: {
        circuitId: 'jeddah',
        imageUrl: F1_IMG('Saudi%20Arabia'),
        length: '6.174 km',
        firstGrandPrix: '2021',
        laps: 50,
        raceDistance: '308.450 km',
        lapRecord: { time: '1:30.734', driver: 'Lewis Hamilton', year: '2021' },
    },

    // Round 6 — Miami
    miami: {
        circuitId: 'miami',
        imageUrl: F1_IMG('Miami'),
        length: '5.412 km',
        firstGrandPrix: '2022',
        laps: 57,
        raceDistance: '308.326 km',
        lapRecord: { time: '1:29.708', driver: 'Max Verstappen', year: '2023' },
    },

    // Round 7 — Emilia-Romagna (Imola)
    imola: {
        circuitId: 'imola',
        imageUrl: F1_IMG('Emilia%20Romagna'),
        length: '4.909 km',
        firstGrandPrix: '1980',
        laps: 63,
        raceDistance: '309.049 km',
        lapRecord: { time: '1:15.484', driver: 'Lewis Hamilton', year: '2020' },
    },

    // Round 8 — Monaco
    monaco: {
        circuitId: 'monaco',
        imageUrl: F1_IMG('Monaco'),
        length: '3.337 km',
        firstGrandPrix: '1950',
        laps: 78,
        raceDistance: '260.286 km',
        lapRecord: { time: '1:12.909', driver: 'Lewis Hamilton', year: '2021' },
    },

    // Round 9 — Spain
    catalunya: {
        circuitId: 'catalunya',
        imageUrl: F1_IMG('Spain'),
        length: '4.657 km',
        firstGrandPrix: '1991',
        laps: 66,
        raceDistance: '307.236 km',
        lapRecord: { time: '1:16.330', driver: 'Max Verstappen', year: '2023' },
    },

    // Round 10 — Canada
    villeneuve: {
        circuitId: 'villeneuve',
        imageUrl: F1_IMG('Canada'),
        length: '4.361 km',
        firstGrandPrix: '1978',
        laps: 70,
        raceDistance: '305.270 km',
        lapRecord: { time: '1:13.078', driver: 'Valtteri Bottas', year: '2019' },
    },

    // Round 11 — Austria
    red_bull_ring: {
        circuitId: 'red_bull_ring',
        imageUrl: F1_IMG('Austria'),
        length: '4.318 km',
        firstGrandPrix: '1970',
        laps: 71,
        raceDistance: '306.452 km',
        lapRecord: { time: '1:05.619', driver: 'Carlos Sainz', year: '2020' },
    },

    // Round 12 — Great Britain
    silverstone: {
        circuitId: 'silverstone',
        imageUrl: F1_IMG('Great%20Britain'),
        length: '5.891 km',
        firstGrandPrix: '1950',
        laps: 52,
        raceDistance: '306.198 km',
        lapRecord: { time: '1:27.097', driver: 'Max Verstappen', year: '2020' },
    },

    // Round 13 — Belgium
    spa: {
        circuitId: 'spa',
        imageUrl: F1_IMG('Belgium'),
        length: '7.004 km',
        firstGrandPrix: '1950',
        laps: 44,
        raceDistance: '308.052 km',
        lapRecord: { time: '1:46.286', driver: 'Valtteri Bottas', year: '2018' },
    },

    // Round 14 — Hungary
    hungaroring: {
        circuitId: 'hungaroring',
        imageUrl: F1_IMG('Hungary'),
        length: '4.381 km',
        firstGrandPrix: '1986',
        laps: 70,
        raceDistance: '306.630 km',
        lapRecord: { time: '1:16.627', driver: 'Lewis Hamilton', year: '2020' },
    },

    // Round 15 — Netherlands
    zandvoort: {
        circuitId: 'zandvoort',
        imageUrl: F1_IMG('Netherlands'),
        length: '4.259 km',
        firstGrandPrix: '1952',
        laps: 72,
        raceDistance: '306.587 km',
        lapRecord: { time: '1:11.097', driver: 'Lewis Hamilton', year: '2021' },
    },

    // Round 16 — Italy (Monza)
    monza: {
        circuitId: 'monza',
        imageUrl: F1_IMG('Italy'),
        length: '5.793 km',
        firstGrandPrix: '1950',
        laps: 53,
        raceDistance: '306.720 km',
        lapRecord: { time: '1:21.046', driver: 'Rubens Barrichello', year: '2004' },
    },

    // Round 17 — Azerbaijan
    baku: {
        circuitId: 'baku',
        imageUrl: F1_IMG('Azerbaijan'),
        length: '6.003 km',
        firstGrandPrix: '2016',
        laps: 51,
        raceDistance: '306.049 km',
        lapRecord: { time: '1:43.009', driver: 'Charles Leclerc', year: '2019' },
    },

    // Round 18 — Singapore
    marina_bay: {
        circuitId: 'marina_bay',
        imageUrl: F1_IMG('Singapore'),
        length: '4.940 km',
        firstGrandPrix: '2008',
        laps: 62,
        raceDistance: '306.143 km',
        lapRecord: { time: '1:35.867', driver: 'Lewis Hamilton', year: '2023' },
    },

    // Round 19 — United States (COTA)
    americas: {
        circuitId: 'americas',
        imageUrl: F1_IMG('USA'),
        length: '5.513 km',
        firstGrandPrix: '2012',
        laps: 56,
        raceDistance: '308.405 km',
        lapRecord: { time: '1:36.169', driver: 'Charles Leclerc', year: '2019' },
    },

    // Round 20 — Mexico
    rodriguez: {
        circuitId: 'rodriguez',
        imageUrl: F1_IMG('Mexico'),
        length: '4.304 km',
        firstGrandPrix: '1963',
        laps: 71,
        raceDistance: '305.354 km',
        lapRecord: { time: '1:17.774', driver: 'Valtteri Bottas', year: '2021' },
    },

    // Round 21 — Brazil
    interlagos: {
        circuitId: 'interlagos',
        imageUrl: F1_IMG('Brazil'),
        length: '4.309 km',
        firstGrandPrix: '1973',
        laps: 71,
        raceDistance: '305.879 km',
        lapRecord: { time: '1:10.540', driver: 'Valtteri Bottas', year: '2018' },
    },

    // Round 22 — Las Vegas
    vegas: {
        circuitId: 'vegas',
        imageUrl: F1_IMG('Las%20Vegas'),
        length: '6.201 km',
        firstGrandPrix: '2023',
        laps: 50,
        raceDistance: '309.958 km',
        lapRecord: { time: '1:35.490', driver: 'Oscar Piastri', year: '2024' },
    },

    // Round 23 — Qatar
    losail: {
        circuitId: 'losail',
        imageUrl: F1_IMG('Qatar'),
        length: '5.419 km',
        firstGrandPrix: '2021',
        laps: 57,
        raceDistance: '308.611 km',
        lapRecord: { time: '1:24.319', driver: 'Max Verstappen', year: '2023' },
    },

    // Round 24 — Abu Dhabi
    yas_marina: {
        circuitId: 'yas_marina',
        imageUrl: F1_IMG('Abu%20Dhabi'),
        length: '5.281 km',
        firstGrandPrix: '2009',
        laps: 58,
        raceDistance: '306.183 km',
        lapRecord: { time: '1:26.103', driver: 'Max Verstappen', year: '2021' },
    },
};
