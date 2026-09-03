import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,32}$/;

export async function GET(request: NextRequest) {
    const username = request.nextUrl.searchParams.get('username')?.trim();

    if (!username || !USERNAME_PATTERN.test(username)) {
        return NextResponse.json({ error: 'Invalid username' }, { status: 400 });
    }

    try {
        const admin = createAdminClient();
        const { data, error } = await admin
            .from('profiles')
            .select('id')
            .ilike('username', username)
            .limit(1);

        if (error) throw error;

        return NextResponse.json(
            { available: data.length === 0 },
            { headers: { 'Cache-Control': 'no-store' } }
        );
    } catch (error) {
        console.error('Username availability check failed:', error);
        return NextResponse.json({ error: 'Unable to check username' }, { status: 503 });
    }
}
