'use client';

import { PracticeResult } from '@/lib/api/openf1-results';

interface PracticeTableProps {
    results: PracticeResult[];
}

export default function PracticeTable({ results }: PracticeTableProps) {
    if (!results || results.length === 0) {
        return (
            <div className="glass-card p-8 text-center">
                <p className="text-f1-text-muted font-mono uppercase tracking-widest text-sm">
                    No practice data available for this session
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-f1-border bg-f1-surface/30 backdrop-blur-md">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-f1-border/20 text-[10px] uppercase tracking-widest font-mono text-f1-text-muted">
                        <th className="px-4 py-3 font-medium">Pos</th>
                        <th className="px-4 py-3 font-medium">Driver</th>
                        <th className="px-4 py-3 font-medium">Team</th>
                        <th className="px-4 py-3 font-medium text-right">Best Lap</th>
                        <th className="px-4 py-3 font-medium text-right">Gap</th>
                        <th className="px-4 py-3 font-medium text-center">Laps</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-f1-border/50">
                    {results.map((result) => (
                        <tr 
                            key={result.driverNumber}
                            className="hover:bg-f1-white/5 transition-colors group"
                        >
                            <td className="px-4 py-4 font-mono text-sm font-bold">
                                {result.position}
                            </td>
                            <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                    <div 
                                        className="w-1 h-8 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.3)]" 
                                        style={{ backgroundColor: result.teamColor }} 
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-xs font-mono text-f1-text-muted leading-tight group-hover:text-f1-red transition-colors">
                                            {result.driverCode}
                                        </span>
                                        <span className="text-sm font-bold tracking-tight">
                                            {result.firstName} <span className="uppercase">{result.lastName}</span>
                                        </span>
                                    </div>
                                </div>
                            </td>
                            <td className="px-4 py-4 text-xs font-medium text-f1-text-muted uppercase tracking-wide">
                                {result.teamName}
                            </td>
                            <td className="px-4 py-4 text-right font-mono text-sm font-bold text-white">
                                {result.bestLapFormatted}
                            </td>
                            <td className="px-4 py-4 text-right font-mono text-xs text-f1-text-muted">
                                {result.gap}
                            </td>
                            <td className="px-4 py-4 text-center font-mono text-xs text-f1-text-muted">
                                {result.lapsCompleted}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
