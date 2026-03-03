import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GameSessionType, Prediction } from '@/lib/types/f1';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const season = parseInt(searchParams.get('season') || '');
        const round = parseInt(searchParams.get('round') || '');

        if (!season || !round) {
            return NextResponse.json({ error: 'Missing season or round' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('predictions')
            .select('*')
            .eq('user_id', user.id)
            .eq('season', season)
            .eq('round', round);

        if (error) {
            console.error('Failed to load predictions:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Map to session-type keyed object
        const predictions: Record<GameSessionType, Prediction | null> = {
            qualifying: null,
            race: null,
            sprint_qualifying: null,
            sprint: null,
        };

        if (data) {
            for (const p of data) {
                predictions[p.session_type as GameSessionType] = p as Prediction;
            }
        }

        return NextResponse.json(predictions);
    } catch (error) {
        console.error('Prediction load error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
