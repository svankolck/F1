export const TEAM_COLORS: Record<string, string> = {
    // Current 2024/2026 Teams (Standardized IDs from Jolpica/Ergast)
    'red_bull': '#3671C6',
    'mercedes': '#27F4D2',
    'ferrari': '#E80020',
    'mclaren': '#FF8000',
    'aston_martin': '#229971',
    'alpine': '#0093CC',
    'williams': '#64C4FF',
    'rb': '#6692FF',
    'sauber': '#52E252',
    'haas': '#B6BABD',
    
    // Historical or alternative IDs
    'alphatauri': '#5E8FAA',
    'alfa': '#C92D4B',
    'toro_rosso': '#469BFF',
    'racing_point': '#F596C8',
    'renault': '#FFF500',
    'force_india': '#FF80C1',
    'lotus_f1': '#FFB800',
    'manor': '#F1194E',
    'caterham': '#005030',
    'sauber_f1': '#006EFF',
};

const TEAM_ID_ALIASES: Record<string, string> = {
    redbull: 'red_bull',
    red_bull_racing: 'red_bull',
    oracle_red_bull_racing: 'red_bull',
    scuderia_ferrari: 'ferrari',
    mclaren_formula_1_team: 'mclaren',
    mercedes_amg: 'mercedes',
    mercedes_amg_petronas_f1_team: 'mercedes',
    astonmartin: 'aston_martin',
    aston_martin_aramco_formula_one_team: 'aston_martin',
    bwt_alpine_f1_team: 'alpine',
    alpine_f1_team: 'alpine',
    atlassian_williams_racing: 'williams',
    williams_racing: 'williams',
    visa_cash_app_racing_bulls_f1_team: 'racing_bulls',
    racingbulls: 'racing_bulls',
    rb: 'racing_bulls',
    moneygram_haas_f1_team: 'haas',
    haas_f1_team: 'haas',
    stake_f1_team_kick_sauber: 'sauber',
    kick_sauber: 'sauber',
    audi_f1_team: 'audi',
    cadillac_f1_team: 'cadillac',
};

export function normalizeConstructorId(value: string): string {
    const normalized = value
        .trim()
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .replace(/_+/g, '_');

    return TEAM_ID_ALIASES[normalized] || normalized;
}

export function getTeamColor(constructorId: string): string {
    return TEAM_COLORS[normalizeConstructorId(constructorId)] || '#777777';
}
