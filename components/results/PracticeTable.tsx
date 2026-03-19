'use client';

import { PracticeResult } from '@/lib/api/openf1-results';

interface PracticeTableProps {
    results: PracticeResult[];
}

export default function PracticeTable({ results }: PracticeTableProps) {
    if (!results || results.length === 0) {
        return (
            <div className="glass-card p-8 text-center">
                <span className="material-icons text-3xl text-f1-text-muted mb-2 block">timer_off</span>
                <p className="text-f1-text-secondary">No practice data available for this session.</p>
            </div>
        );
    }

    return (
        <div className="glass-card overflow-hidden border border-f1-border">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                    <thead className="bg-white/5 border-b border-f1-border">
                        <tr className="text-[10px] font-mono uppercase tracking-widest text-f1-text-muted">
                            <th className="text-left py-3 px-3">Pos</th>
                            <th className="text-left py-3 px-3">Driver</th>
                            <th className="text-left py-3 px-3">Team</th>
                            <th className="text-left py-3 px-3">Best Lap</th>
                            <th className="text-left py-3 px-3">Gap</th>
                            <th className="text-right py-3 px-3">Laps</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.map((result, idx) => (
                            <tr 
                                key={result.driverNumber}
                                className={`border-b border-f1-border/40 ${idx % 2 === 0 ? 'bg-white/[0.02]' : 'bg-transparent'} hover:bg-white/5 transition-colors group`}
                            >
                                <td className="py-3 px-3 text-sm font-mono font-bold">P{result.position}</td>
                                <td className="py-3 px-3 text-sm font-semibold">
                                    <div className="flex items-center gap-2">
                                        <div 
                                            className="w-1 h-4 rounded-full" 
                                            style={{ backgroundColor: result.teamColor }} 
                                        />
                                        <span>
                                            {result.firstName} <span className="uppercase">{result.lastName}</span>
                                        </span>
                                    </div>
                                </td>
                                <td className="py-3 px-3 text-xs text-f1-text-secondary uppercase tracking-wide">
                                    {result.teamName}
                                </td>
                                <td className="py-3 px-3 text-sm font-mono font-bold text-white">
                                    {result.bestLapFormatted}
                                </td>
                                <td className="py-3 px-3 text-xs font-mono text-f1-text-muted">
                                    {result.gap}
                                </td>
                                <td className="py-3 px-3 text-right font-mono text-xs text-f1-text-muted">
                                    {result.lapsCompleted}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
