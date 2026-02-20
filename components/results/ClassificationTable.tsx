import { RaceResult } from '@/lib/types/f1';
import FastestLapBadge from './FastestLapBadge';

interface ClassificationTableProps {
    results: RaceResult[];
}

export default function ClassificationTable({ results }: ClassificationTableProps) {
    if (!results || results.length === 0) {
        return (
            <div className="glass-card p-8 text-center">
                <span className="material-icons text-3xl text-f1-text-muted mb-2 block">event_busy</span>
                <p className="text-f1-text-secondary">No race results available for this round.</p>
            </div>
        );
    }

    return (
        <div className="glass-card overflow-hidden border border-f1-border">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[820px]">
                    <thead className="bg-white/5 border-b border-f1-border">
                        <tr className="text-[10px] font-mono uppercase tracking-widest text-f1-text-muted">
                            <th className="text-left py-3 px-3">Pos</th>
                            <th className="text-left py-3 px-3">Driver</th>
                            <th className="text-left py-3 px-3">Team</th>
                            <th className="text-left py-3 px-3">Grid</th>
                            <th className="text-left py-3 px-3">Laps</th>
                            <th className="text-left py-3 px-3">Time / Status</th>
                            <th className="text-right py-3 px-3">Pts</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.map((row, idx) => {
                            const isFastest = row.FastestLap?.rank === '1';
                            return (
                                <tr
                                    key={`${row.Driver.driverId}-${row.position}`}
                                    className={`border-b border-f1-border/40 ${idx % 2 === 0 ? 'bg-white/[0.02]' : 'bg-transparent'}`}
                                >
                                    <td className="py-3 px-3 text-sm font-mono font-bold">P{row.position}</td>
                                    <td className="py-3 px-3 text-sm font-semibold">
                                        {row.Driver.givenName} <span className="uppercase">{row.Driver.familyName}</span>
                                    </td>
                                    <td className="py-3 px-3 text-xs text-f1-text-secondary uppercase tracking-wide">{row.Constructor.name}</td>
                                    <td className="py-3 px-3 text-sm font-mono">P{row.grid}</td>
                                    <td className="py-3 px-3 text-sm font-mono">{row.laps}</td>
                                    <td className="py-3 px-3 text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono">{row.Time?.time || row.status}</span>
                                            {isFastest && <FastestLapBadge />}
                                        </div>
                                    </td>
                                    <td className="py-3 px-3 text-right text-sm font-mono font-bold">{row.points}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
