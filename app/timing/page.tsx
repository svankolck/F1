import { Suspense } from 'react';
import TimingClient from '@/components/timing/TimingClient';
import { getTimingData } from '@/lib/api/timing';

export const revalidate = 15;

export default async function TimingPage() {
    const initialData = await getTimingData().catch(() => ({
        mode: 'idle' as const,
        session: null,
        rows: [],
        updatedAt: new Date().toISOString(),
        weekendSessions: [],
        nextSession: null,
    }));

    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center py-20 gap-3">
                    <div className="w-5 h-5 border-2 border-f1-red/30 border-t-f1-red rounded-full animate-spin" />
                    <span className="text-sm text-f1-text-muted font-mono uppercase tracking-wider">Loading…</span>
                </div>
            }
        >
            <TimingClient initialData={initialData} />
        </Suspense>
    );
}
