import { TimingRowData } from '@/lib/api/timing';
import TimingRow from './TimingRow';

interface LiveTimingTableProps {
    rows: TimingRowData[];
}

export default function LiveTimingTable({ rows }: LiveTimingTableProps) {
    if (!rows.length) {
        return (
            <div className="glass-card p-8 text-center border border-f1-border">
                <span className="material-icons text-3xl text-f1-text-muted mb-2 block">timer_off</span>
                <p className="text-f1-text-secondary">No timing data available for this session.</p>
            </div>
        );
    }

    return (
        <div className="glass-card border border-f1-border overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[780px]">
                    <thead className="bg-white/5 border-b border-f1-border">
                        <tr className="text-[10px] font-mono uppercase tracking-widest text-f1-text-muted">
                            <th className="text-left py-3 px-2">Pos</th>
                            <th className="text-left py-3 px-2">Driver</th>
                            <th className="text-left py-3 px-2">Interval</th>
                            <th className="text-left py-3 px-2">Gap</th>
                            <th className="hidden md:table-cell text-left py-3 px-2">Last</th>
                            <th className="hidden lg:table-cell text-left py-3 px-2">S1</th>
                            <th className="hidden lg:table-cell text-left py-3 px-2">S2</th>
                            <th className="hidden lg:table-cell text-left py-3 px-2">S3</th>
                            <th className="hidden md:table-cell text-left py-3 px-2">Pit</th>
                            <th className="text-left py-3 px-2">Tyre</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <TimingRow key={row.driverNumber} row={row} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
