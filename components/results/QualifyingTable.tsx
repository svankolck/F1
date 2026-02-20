import { QualifyingResult } from '@/lib/types/f1';

interface QualifyingTableProps {
    qualifying: QualifyingResult[];
}

function getEliminationTag(row: QualifyingResult): { label: string; className: string } | null {
    if (!row.Q2) {
        return { label: 'Out in Q1', className: 'text-red-300 bg-red-500/10 border-red-400/20' };
    }
    if (!row.Q3) {
        return { label: 'Out in Q2', className: 'text-amber-300 bg-amber-500/10 border-amber-400/20' };
    }
    return null;
}

export default function QualifyingTable({ qualifying }: QualifyingTableProps) {
    if (!qualifying || qualifying.length === 0) {
        return (
            <div className="glass-card p-8 text-center">
                <span className="material-icons text-3xl text-f1-text-muted mb-2 block">timer_off</span>
                <p className="text-f1-text-secondary">No qualifying data available for this round.</p>
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
                            <th className="text-left py-3 px-3">Q1</th>
                            <th className="text-left py-3 px-3">Q2</th>
                            <th className="text-left py-3 px-3">Q3</th>
                            <th className="text-right py-3 px-3">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {qualifying.map((row, idx) => {
                            const elimination = getEliminationTag(row);
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
                                    <td className="py-3 px-3 text-sm font-mono">{row.Q1 || '—'}</td>
                                    <td className="py-3 px-3 text-sm font-mono">{row.Q2 || '—'}</td>
                                    <td className="py-3 px-3 text-sm font-mono">{row.Q3 || '—'}</td>
                                    <td className="py-3 px-3 text-right">
                                        {elimination ? (
                                            <span className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${elimination.className}`}>
                                                {elimination.label}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-emerald-300 uppercase tracking-widest font-bold">Q3</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
