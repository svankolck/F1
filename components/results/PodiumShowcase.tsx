import { RaceResult, getDriverImageUrl, getTeamColor } from '@/lib/types/f1';

interface PodiumShowcaseProps {
    results: RaceResult[];
}

export default function PodiumShowcase({ results }: PodiumShowcaseProps) {
    if (!results || results.length < 3) {
        return (
            <div className="glass-card p-8 text-center">
                <span className="material-icons text-3xl text-f1-text-muted mb-2 block">emoji_events</span>
                <p className="text-f1-text-secondary">Podium data is nog niet beschikbaar.</p>
            </div>
        );
    }

    const podium = [results[1], results[0], results[2]];
    const positions = [2, 1, 3];
    const heights = ['md:mt-10 min-h-[210px]', 'min-h-[250px]', 'md:mt-16 min-h-[190px]'];

    return (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {podium.map((result, idx) => {
                const pos = positions[idx];
                const teamColor = getTeamColor(result.Constructor.constructorId);
                const driverImage = getDriverImageUrl(result.Driver.driverId);
                const timeLabel = result.Time?.time || result.status || '—';

                return (
                    <article
                        key={`${result.Driver.driverId}-${pos}`}
                        className={`relative overflow-hidden rounded-xl bg-gradient-to-b from-f1-surface/80 to-f1-bg border border-f1-border p-4 md:p-5 ${heights[idx]} ${idx === 0 ? 'order-2 md:order-1' : idx === 1 ? 'order-1 md:order-2' : 'order-3'}`}
                        style={{ borderTop: `4px solid ${teamColor}` }}
                    >
                        <div className="absolute -top-4 -right-2 text-[110px] font-bold text-white/[0.04] leading-none select-none">
                            {pos}
                        </div>

                        {pos === 1 && (
                            <div className="absolute top-0 right-0 text-[10px] font-bold uppercase tracking-widest bg-f1-red text-white px-3 py-1 rounded-bl-lg">
                                Winner
                            </div>
                        )}

                        <div className="relative z-10 flex h-full flex-col justify-between">
                            <div>
                                <p className="text-[10px] text-f1-text-muted uppercase tracking-widest font-mono">P{pos}</p>
                                <h3 className="text-xl md:text-2xl font-bold leading-none mt-1">
                                    {result.Driver.givenName}{' '}
                                    <span className="uppercase">{result.Driver.familyName}</span>
                                </h3>
                                <p className="text-xs text-f1-text-muted uppercase tracking-wider mt-2">{result.Constructor.name}</p>
                            </div>

                            <div className="mt-4 flex items-end justify-between gap-3">
                                <div>
                                    <p className="text-[10px] text-f1-text-muted uppercase tracking-widest">Time / Status</p>
                                    <p className="text-sm font-mono font-bold text-white">{timeLabel}</p>
                                </div>
                                {driverImage && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={driverImage}
                                        alt={`${result.Driver.givenName} ${result.Driver.familyName}`}
                                        className="w-20 h-20 object-cover object-top rounded-lg border border-white/10"
                                    />
                                )}
                            </div>
                        </div>
                    </article>
                );
            })}
        </section>
    );
}
