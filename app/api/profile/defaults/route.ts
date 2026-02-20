import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const supabase = createClient();

    // Validate session server-side — this is the reliable way
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Whitelist only the fields we allow — never trust the client blindly
    const allowed = ['default_pole_driver', 'default_p1_driver', 'default_p2_driver', 'default_p3_driver'];
    const updates: Record<string, string | null> = {};
    for (const field of allowed) {
        const value = body[field];
        updates[field] = typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
    }

    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

    if (error) {
        console.error('[profile/defaults] Supabase error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
