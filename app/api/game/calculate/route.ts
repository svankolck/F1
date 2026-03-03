import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { GameSessionType } from '@/lib/types/f1';
import { calculateScores } from '@/lib/api/scoring';

// POST: Admin triggers score calculation
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Admin only' }, { status: 403 });
        }

        const { season, round, sessionType } = await request.json() as {
            season: string;
            round: string;
            sessionType: GameSessionType;
        };

        const result = await calculateScores(season, round, sessionType, user.id);

        return NextResponse.json({
            message: `Scored ${result.scored} predictions`,
            ...result,
        });
    } catch (error) {
        console.error('Score calculation error:', error);
        const message = error instanceof Error ? error.message : 'Failed to calculate scores';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// PATCH: Mark a round as official
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Admin only' }, { status: 403 });
        }

        const { season, round, sessionType, status } = await request.json() as {
            season: number;
            round: number;
            sessionType: GameSessionType;
            status: 'official' | 'provisional';
        };

        const admin = createAdminClient();
        const { error } = await admin
            .from('scoring_log')
            .update({ status })
            .eq('season', season)
            .eq('round', round)
            .eq('session_type', sessionType);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ message: `Status updated to ${status}` });
    } catch (error) {
        console.error('Status update error:', error);
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }
}
