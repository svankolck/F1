import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const searchParams = request.nextUrl.searchParams;
        const season = searchParams.get('season') || new Date().getFullYear().toString();

        const { data, error } = await supabase
            .from('scoring_log')
            .select('*')
            .eq('season', parseInt(season))
            .order('round', { ascending: true });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data || []);
    } catch (error) {
        console.error('Scoring status error:', error);
        return NextResponse.json({ error: 'Failed to fetch scoring status' }, { status: 500 });
    }
}
