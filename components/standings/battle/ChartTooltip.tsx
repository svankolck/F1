import { BattleDriver } from '@/lib/api/battle';

interface ChartTooltipProps {
    active?: boolean;
    payload?: Array<{ value?: number; dataKey?: string; color?: string; payload?: { raceName?: string; circuitName?: string; roundLabel?: string } }>;
    label?: string;
    drivers: BattleDriver[];
}

export default function ChartTooltip({ active, payload, label, drivers }: ChartTooltipProps) {
    if (!active || !payload || payload.length === 0) {
        return null;
    }

    const validPayload = payload
        .filter((item) => typeof item.value === 'number' && item.dataKey)
        .sort((a, b) => (b.value || 0) - (a.value || 0));

    const raceName = payload[0]?.payload?.raceName || '';
    const circuitName = payload[0]?.payload?.circuitName || '';

    return (
        <div className="glass-card p-3 min-w-[210px] border border-f1-border bg-f1-bg/95">
            <div className="mb-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-f1-text-muted">{label}</p>
                <p className="text-sm font-bold text-white">{raceName}</p>
                <p className="text-[10px] text-f1-text-muted">{circuitName}</p>
            </div>

            <div className="flex flex-col gap-1.5">
                {validPayload.map((item) => {
                    const driver = drivers.find((entry) => entry.driverId === item.dataKey);
                    if (!driver) return null;

                    return (
                        <div key={driver.driverId} className="flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                                <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: item.color || driver.teamColor }}
                                />
                                <span className="font-bold text-white truncate">{driver.code || driver.familyName}</span>
                            </div>
                            <span className="font-mono text-f1-text-secondary">{item.value?.toFixed(0)} pts</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
