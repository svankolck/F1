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

export function getTeamColor(constructorId: string): string {
    return TEAM_COLORS[constructorId] || '#777777';
}
