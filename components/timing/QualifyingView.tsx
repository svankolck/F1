'use client';

import { useMemo, useState } from 'react';
import { TimingRowData } from '@/lib/api/timing';
import LiveTimingTable from './LiveTimingTable';

type QualiPhase = 'Q1' | 'Q2' | 'Q3';

interface QualifyingViewProps {
    rows: TimingRowData[];
}

export default function QualifyingView({ rows }: QualifyingViewProps) {
    const [phase, setPhase] = useState<QualiPhase>('Q1');

    const phaseRows = useMemo(() => {
        if (phase === 'Q1') return rows;
        if (phase === 'Q2') return rows.filter((row) => row.position <= 15);
        return rows.filter((row) => row.position <= 10);
    }, [phase, rows]);

    return (
        <div className="flex flex-col gap-3">
            <div className="flex gap-1 bg-f1-surface/50 p-1 rounded-lg w-fit">
                {(['Q1', 'Q2', 'Q3'] as QualiPhase[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setPhase(tab)}
                        className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${phase === tab ? 'bg-f1-red text-white shadow-lg shadow-f1-red/20' : 'text-f1-text-muted hover:text-white'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
            <LiveTimingTable rows={phaseRows} />
        </div>
    );
}
