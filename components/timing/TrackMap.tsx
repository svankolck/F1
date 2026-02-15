import { TimingRowData } from '@/lib/api/timing';

interface TrackMapProps {
    rows: TimingRowData[];
}

export default function TrackMap({ rows }: TrackMapProps) {
    if (!rows.length) return null;

    const topRows = rows.slice(0, 10);

    return (
        <div className="hidden xl:block glass-card border border-f1-border p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-mono text-f1-red uppercase tracking-widest">Track Position</h3>
                <span className="text-[10px] text-f1-text-muted uppercase tracking-widest">Preview</span>
            </div>

            <div className="relative h-[220px] rounded-xl bg-f1-surface/40 border border-f1-border overflow-hidden">
                <div className="absolute inset-6 border-2 border-dashed border-white/10 rounded-full" />
                {topRows.map((row, index) => {
                    const angle = (index / topRows.length) * Math.PI * 2;
                    const x = 50 + Math.cos(angle) * 35;
                    const y = 50 + Math.sin(angle) * 35;
                    return (
                        <div
                            key={row.driverNumber}
                            className="absolute w-7 h-7 rounded-full border text-[10px] font-bold flex items-center justify-center"
                            style={{
                                left: `${x}%`,
                                top: `${y}%`,
                                transform: 'translate(-50%, -50%)',
                                backgroundColor: `${row.teamColor}33`,
                                borderColor: row.teamColor,
                                color: 'white',
                            }}
                            title={`${row.code} P${row.position}`}
                        >
                            {row.code}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
