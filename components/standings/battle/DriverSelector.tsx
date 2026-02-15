import { BattleDriver } from '@/lib/api/battle';

interface DriverSelectorProps {
    drivers: BattleDriver[];
    selectedDriverIds: string[];
    onToggleDriver: (driverId: string) => void;
}

export default function DriverSelector({ drivers, selectedDriverIds, onToggleDriver }: DriverSelectorProps) {
    return (
        <div className="glass-card p-3 md:p-4 border border-f1-border">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-mono text-f1-red uppercase tracking-widest">Drivers</h3>
                <span className="text-[10px] text-f1-text-muted font-mono uppercase tracking-wider">
                    {selectedDriverIds.length} selected
                </span>
            </div>

            <div className="flex xl:flex-col gap-2 overflow-x-auto xl:overflow-visible pb-1 xl:pb-0">
                {drivers.map((driver) => {
                    const selected = selectedDriverIds.includes(driver.driverId);
                    return (
                        <button
                            key={driver.driverId}
                            onClick={() => onToggleDriver(driver.driverId)}
                            className={`flex-shrink-0 xl:w-full text-left rounded-lg border px-2.5 py-2 transition-all duration-200 ${selected ? 'bg-white/10 border-white/30' : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.06]'}`}
                            style={{ borderLeftWidth: 4, borderLeftColor: driver.teamColor }}
                        >
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-f1-surface border border-white/10 flex items-center justify-center">
                                    {driver.imageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={driver.imageUrl}
                                            alt={driver.familyName}
                                            className="w-full h-full object-cover object-top"
                                        />
                                    ) : (
                                        <span className="text-[10px] font-bold text-f1-text-muted">{driver.code || '?'}</span>
                                    )}
                                </div>

                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-white truncate">{driver.givenName} {driver.familyName}</p>
                                    <p className="text-[10px] text-f1-text-muted uppercase tracking-wide truncate">{driver.constructorName}</p>
                                </div>

                                <div className="ml-auto text-right">
                                    <p className="text-[10px] text-f1-text-muted uppercase tracking-wider">Pts</p>
                                    <p className="text-xs font-mono font-bold text-white">{driver.points.toFixed(0)}</p>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
