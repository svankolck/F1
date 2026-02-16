// ===== Jolpica API Types =====

export interface JolpicaResponse<T> {
    MRData: {
        xmlns: string;
        series: string;
        url: string;
        limit: string;
        offset: string;
        total: string;
    } & T;
}

export interface Race {
    season: string;
    round: string;
    url: string;
    raceName: string;
    Circuit: Circuit;
    date: string;
    time?: string;
    FirstPractice?: SessionTime;
    SecondPractice?: SessionTime;
    ThirdPractice?: SessionTime;
    Qualifying?: SessionTime;
    Sprint?: SessionTime;
    SprintQualifying?: SessionTime;
}

export interface Circuit {
    circuitId: string;
    url: string;
    circuitName: string;
    Location: {
        lat: string;
        long: string;
        locality: string;
        country: string;
    };
}

export interface CircuitDetails {
    circuitId: string;
    imageUrl?: string;
    length: string;
    firstGrandPrix: string;
    laps: number;
    raceDistance: string;
    lapRecord: {
        time: string;
        driver: string;
        year: string;
    };
}

export interface SessionTime {
    date: string;
    time: string;
}

export interface Driver {
    driverId: string;
    permanentNumber?: string;
    code: string;
    url: string;
    givenName: string;
    familyName: string;
    dateOfBirth: string;
    nationality: string;
}

export interface Constructor {
    constructorId: string;
    url: string;
    name: string;
    nationality: string;
}

export interface RaceResult {
    number: string;
    position: string;
    positionText: string;
    points: string;
    Driver: Driver;
    Constructor: Constructor;
    grid: string;
    laps: string;
    status: string;
    Time?: { millis: string; time: string };
    FastestLap?: {
        rank: string;
        lap: string;
        Time: { time: string };
        AverageSpeed: { units: string; speed: string };
    };
}

export interface DriverStanding {
    position: string;
    positionText: string;
    points: string;
    wins: string;
    Driver: Driver;
    Constructors: Constructor[];
}

export interface ConstructorStanding {
    position: string;
    positionText: string;
    points: string;
    wins: string;
    Constructor: Constructor;
}

export interface QualifyingResult {
    number: string;
    position: string;
    Driver: Driver;
    Constructor: Constructor;
    Q1?: string;
    Q2?: string;
    Q3?: string;
}

// ===== OpenF1 API Types =====

export interface OpenF1Session {
    session_key: number;
    session_name: string;
    session_type: string;
    date_start: string;
    date_end: string;
    gmt_offset: string;
    country_name: string;
    country_code: string;
    circuit_key: number;
    circuit_short_name: string;
    year: number;
    meeting_key: number;
}

export interface OpenF1Driver {
    driver_number: number;
    broadcast_name: string;
    full_name: string;
    name_acronym: string;
    team_name: string;
    team_colour: string;
    first_name: string;
    last_name: string;
    headshot_url?: string;
    country_code: string;
    session_key: number;
}

export interface OpenF1Position {
    session_key: number;
    driver_number: number;
    position: number;
    date: string;
    meeting_key: number;
}

export interface OpenF1Lap {
    session_key: number;
    driver_number: number;
    lap_number: number;
    lap_duration: number | null;
    duration_sector_1: number | null;
    duration_sector_2: number | null;
    duration_sector_3: number | null;
    is_pit_out_lap: boolean;
    st_speed: number | null;
    date_start: string;
}

export interface OpenF1Stint {
    session_key: number;
    driver_number: number;
    stint_number: number;
    compound: string;
    tyre_age_at_start: number;
    lap_start: number;
    lap_end: number;
}

export interface OpenF1Pit {
    session_key: number;
    driver_number: number;
    lap_number: number;
    pit_duration: number | null;
    date: string;
}

export interface OpenF1RaceControl {
    meeting_key: number;
    session_key: number;
    date: string;
    driver_number: number | null;
    lap_number: number | null;
    category: string;
    flag: string | null;
    scope: string | null;
    sector: number | null;
    qualifying_phase: number | null;
    message: string;
}

// ===== App Types =====

export interface CountdownData {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isLive: boolean;
    raceName: string;
    circuitName: string;
    country: string;
    locality: string;
    raceDate: string;
    raceTime: string;
    round: string;
    season: string;
}

export interface PodiumResult {
    position: number;
    driver: Driver;
    constructor: Constructor;
    time?: string;
    gap?: string;
}

// Team colors mapping
export const TEAM_COLORS: Record<string, string> = {
    red_bull: '#3671C6',
    ferrari: '#E8002D',
    mercedes: '#27F4D2',
    mclaren: '#FF8000',
    aston_martin: '#229971',
    alpine: '#FF87BC',
    williams: '#64C4FF',
    rb: '#6692FF',
    sauber: '#52E252',
    haas: '#B6BABD',
    // Aliases
    alphatauri: '#6692FF',
    alfa: '#52E252',
};

// Country code mapping for flags
export const COUNTRY_CODES: Record<string, string> = {
    'Australia': 'au',
    'Austria': 'at',
    'Azerbaijan': 'az',
    'Bahrain': 'bh',
    'Belgium': 'be',
    'Brazil': 'br',
    'Canada': 'ca',
    'China': 'cn',
    'France': 'fr',
    'Germany': 'de',
    'Hungary': 'hu',
    'Italy': 'it',
    'Japan': 'jp',
    'Mexico': 'mx',
    'Monaco': 'mc',
    'Netherlands': 'nl',
    'Portugal': 'pt',
    'Qatar': 'qa',
    'Russia': 'ru',
    'Saudi Arabia': 'sa',
    'Singapore': 'sg',
    'Spain': 'es',
    'Turkey': 'tr',
    'UAE': 'ae',
    'UK': 'gb',
    'United Kingdom': 'gb',
    'USA': 'us',
    'United States': 'us',
    'Las Vegas': 'us',
};

export function getFlagUrl(country: string): string {
    const code = COUNTRY_CODES[country] || 'un';
    return `https://flagcdn.com/w40/${code}.png`;
}

export function getTeamColor(constructorId: string): string {
    return TEAM_COLORS[constructorId] || '#888888';
}

// Circuit SVG file mapping (circuitId → SVG filename in /public/tracks/)
export const CIRCUIT_SVG_MAP: Record<string, string> = {
    albert_park: 'melbourne',
    bahrain: 'bahrain',
    shanghai: 'shanghai',
    suzuka: 'suzuka',
    miami: 'miami',
    imola: 'imola',
    monaco: 'monaco',
    villeneuve: 'montreal',
    catalunya: 'catalunya',
    red_bull_ring: 'spielberg',
    silverstone: 'silverstone',
    hungaroring: 'hungaroring',
    spa: 'spa-francorchamps',
    zandvoort: 'zandvoort',
    monza: 'monza',
    marina_bay: 'marina-bay',
    losail: 'lusail',
    americas: 'austin',
    rodriguez: 'mexico-city',
    interlagos: 'interlagos',
    vegas: 'las-vegas',
    yas_marina: 'yas-marina',
    jeddah: 'jeddah',
    baku: 'baku',
};

export function getCircuitSvgPath(circuitId: string): string {
    const file = CIRCUIT_SVG_MAP[circuitId];
    if (!file) return '';
    return `/tracks/${file}.svg`;
}

// Driver headshot URL from F1 media CDN
// Pattern: MAXVER01 = first 3 chars of lastName + first 3 of firstName + "01"
export const DRIVER_IMAGE_MAP: Record<string, string> = {
    max_verstappen: 'MAXVER01_Max_Verstappen/maxver01',
    norris: 'LANNOR01_Lando_Norris/lannor01',
    russell: 'GEORUS01_George_Russell/georus01',
    leclerc: 'CHALEC01_Charles_Leclerc/chalec01',
    sainz: 'CARSAI01_Carlos_Sainz/carsai01',
    hamilton: 'LEWHAM01_Lewis_Hamilton/lewham01',
    piastri: 'OSCPIA01_Oscar_Piastri/oscpia01',
    alonso: 'FERALO01_Fernando_Alonso/feralo01',
    stroll: 'LANSTR01_Lance_Stroll/lanstr01',
    gasly: 'PIEGAS01_Pierre_Gasly/piegas01',
    ocon: 'ESTOCO01_Esteban_Ocon/estoco01',
    albon: 'ALEALB01_Alexander_Albon/alealb01',
    tsunoda: 'YUKTSU01_Yuki_Tsunoda/yuktsu01',
    ricciardo: 'DANRIC01_Daniel_Ricciardo/danric01',
    hulkenberg: 'NICHUL01_Nico_Hulkenberg/nichul01',
    perez: 'SERPER01_Sergio_Perez/serper01',
    magnussen: 'KEVMAG01_Kevin_Magnussen/kevmag01',
    bottas: 'VALBOT01_Valtteri_Bottas/valbot01',
    zhou: 'GUAZHO01_Guanyu_Zhou/guazho01',
    sargeant: 'LOGSAR01_Logan_Sargeant/logsar01',
    lawson: 'LIALAW01_Liam_Lawson/lialaw01',
    bearman: 'OLIBEA01_Oliver_Bearman/olibea01',
    colapinto: 'FRANCOL01_Franco_Colapinto/francol01',
    doohan: 'JACDOO01_Jack_Doohan/jacdoo01',
    hadjar: 'ISAHAD01_Isack_Hadjar/isahad01',
    antonelli: 'ANDANT01_Andrea_Kimi_Antonelli/andant01',
    bortoleto: 'GABBOT01_Gabriel_Bortoleto/gabbot01',
};

export const TEAM_LOGO_MAP: Record<string, string> = {
    red_bull: 'https://media.formula1.com/image/upload/c_lfill,w_40/q_auto/v1740000000/common/f1/2025/redbullracing/2025redbullracinglogowhite.webp',
    mercedes: 'https://media.formula1.com/image/upload/c_lfill,w_40/q_auto/v1740000000/common/f1/2025/mercedes/2025mercedeslogowhite.webp',
    ferrari: 'https://media.formula1.com/image/upload/c_lfill,w_40/q_auto/v1740000000/common/f1/2025/ferrari/2025ferrarilogowhite.webp',
    mclaren: 'https://media.formula1.com/image/upload/c_lfill,w_40/q_auto/v1740000000/common/f1/2025/mclaren/2025mclarenlogowhite.webp',
    aston_martin: 'https://media.formula1.com/image/upload/c_lfill,w_40/q_auto/v1740000000/common/f1/2025/astonmartin/2025astonmartinlogowhite.webp',
    alpine: 'https://media.formula1.com/image/upload/c_lfill,w_40/q_auto/v1740000000/common/f1/2025/alpine/2025alpinelogowhite.webp',
    williams: 'https://media.formula1.com/image/upload/c_lfill,w_40/q_auto/v1740000000/common/f1/2025/williams/2025williamslogowhite.webp',
    sauber: 'https://media.formula1.com/image/upload/c_lfill,w_40/q_auto/v1740000000/common/f1/2025/kicksauber/2025kicksauberlogowhite.webp',
    rb: 'https://media.formula1.com/image/upload/c_lfill,w_40/q_auto/v1740000000/common/f1/2025/rb/2025rblogowhite.webp',
    haas: 'https://media.formula1.com/image/upload/c_lfill,w_40/q_auto/v1740000000/common/f1/2025/haas/2025haaslogowhite.webp',
    // Aliases
    alphatauri: 'https://media.formula1.com/image/upload/c_lfill,w_40/q_auto/v1740000000/common/f1/2025/rb/2025rblogowhite.webp',
    alfa: 'https://media.formula1.com/image/upload/c_lfill,w_40/q_auto/v1740000000/common/f1/2025/kicksauber/2025kicksauberlogowhite.webp',
};

export function getTeamLogoUrl(constructorId: string): string {
    return TEAM_LOGO_MAP[constructorId] || '';
}

export function getDriverImageUrl(driverId: string): string {
    const path = DRIVER_IMAGE_MAP[driverId];
    if (!path) return '';
    const code = path.split('/')[0];
    return `https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/${code.charAt(0)}/${path}.png.transform/2col/image.png`;
}

// ===== Game Types =====

export type GameSessionType = 'qualifying' | 'race' | 'sprint_qualifying' | 'sprint';

export interface GameDriver {
    driverId: string;
    code: string;
    firstName: string;
    lastName: string;
    teamName: string;
    teamColor: string;
    headshotUrl: string;
    number: string;
}

export interface Prediction {
    id?: string;
    user_id: string;
    season: number;
    round: number;
    session_type: GameSessionType;
    pole_driver_id: string | null;
    p1_driver_id: string | null;
    p2_driver_id: string | null;
    p3_driver_id: string | null;
    is_default: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface GameScore {
    id?: string;
    user_id: string;
    season: number;
    round: number;
    session_type: GameSessionType;
    pole_points: number;
    p1_points: number;
    p2_points: number;
    p3_points: number;
    bonus_points: number;
    total_points: number;
    created_at?: string;
}

export interface SessionSchedule {
    type: GameSessionType;
    label: string;
    startTime: string; // ISO string
    isLocked: boolean;
    isCompleted: boolean;
    points?: number; // earned points (if completed)
}

export interface WeekendSchedule {
    season: number;
    round: number;
    raceName: string;
    circuitName: string;
    country: string;
    isSprint: boolean;
    sessions: SessionSchedule[];
}

// Sprint scoring constants
export const RACE_SCORING = {
    pole: 25,
    p1: 25,
    p2: 18,
    p3: 15,
    bonus: 10, // right driver, wrong position
} as const;

export const SPRINT_SCORING = {
    pole: 8,
    p1: 8,
    p2: 7,
    p3: 6,
    bonus: 5, // right driver, wrong position
} as const;
