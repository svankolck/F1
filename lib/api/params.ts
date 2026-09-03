export function parseSeason(value: string | null, fallback = 'current'): string | null {
    const season = value || fallback;
    if (season === 'current') return season;
    if (!/^\d{4}$/.test(season)) return null;

    const year = Number(season);
    return year >= 1950 && year <= new Date().getFullYear() + 1 ? season : null;
}

export function parseRound(value: string | null, fallback?: string): string | null {
    const round = value || fallback;
    if (!round || !/^\d{1,2}$/.test(round)) return null;

    const number = Number(round);
    return number >= 1 && number <= 30 ? String(number) : null;
}

export const PUBLIC_CACHE_HEADERS = {
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
};
