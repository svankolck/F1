import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const season = parseInt(request.nextUrl.searchParams.get('season') || new Date().getFullYear().toString());
        const admin = createAdminClient();

        const { data: scores, error: scoresError } = await admin
            .from('game_scores')
            .select('user_id, total_points, round')
            .eq('season', season);

        if (scoresError) {
            return NextResponse.json({ error: scoresError.message }, { status: 500 });
        }

        if (!scores || scores.length === 0) {
            return NextResponse.json({ entries: [], chartData: [] });
        }

        const userMap = new Map<string, { total: number; rounds: Set<number> }>();
        for (const score of scores) {
            const existing = userMap.get(score.user_id) || { total: 0, rounds: new Set<number>() };
            existing.total += score.total_points;
            existing.rounds.add(score.round);
            userMap.set(score.user_id, existing);
        }

        const userIds = Array.from(userMap.keys());
        const { data: profiles, error: profilesError } = await admin
            .from('profiles')
            .select('id, username, avatar_url')
            .in('id', userIds);

        if (profilesError) {
            return NextResponse.json({ error: profilesError.message }, { status: 500 });
        }

        const entries = Array.from(userMap.entries()).map(([userId, data]) => {
            const profile = profiles?.find((p) => p.id === userId);
            return {
                userId,
                username: profile?.username || 'Unknown',
                avatarUrl: profile?.avatar_url || undefined,
                totalPoints: data.total,
                raceCount: data.rounds.size,
                scores: [],
            };
        });

        const userScores = scores
            .filter((score) => score.user_id === user.id)
            .sort((a, b) => a.round - b.round);

        const byRound = new Map<number, number>();
        for (const score of userScores) {
            byRound.set(score.round, (byRound.get(score.round) || 0) + score.total_points);
        }

        let cumulative = 0;
        const chartData = Array.from(byRound.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([round, points]) => {
                cumulative += points;
                return {
                    round,
                    raceName: `R${round}`,
                    points,
                    cumulative,
                };
            });

        return NextResponse.json({ entries, chartData });
    } catch (error) {
        console.error('Leaderboard fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }
}
