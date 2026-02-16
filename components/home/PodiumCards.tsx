import Link from 'next/link';
import { RaceResult, QualifyingResult, getTeamColor, getDriverImageUrl } from '@/lib/types/f1';

interface PodiumCardsProps {
    results: RaceResult[];
    season: string;
    round: string;
    polePosition?: QualifyingResult;
}

export default function PodiumCards({ results, season, round, polePosition }: PodiumCardsProps) {
    if (!results || results.length < 3) return null;

    const podium = [results[1], results[0], results[2]]; // P2, P1, P3 order for visual
    const heights = ['h-56 md:h-60 mt-0 md:mt-8', 'h-64 md:h-80', 'h-52 md:h-56 mt-0 md:mt-12'];
    const positions = [2, 1, 3];

    return (
        <section className="flex flex-col gap-5 w-full relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
                <div>
                    <h2 className="text-xs font-mono text-f1-red mb-1 uppercase tracking-widest">
                        Rewind
                    </h2>
                    <h3 className="text-xl md:text-2xl font-bold text-white uppercase tracking-tight">
                        {season} Podium Results
                    </h3>
                </div>
                {polePosition && (
                    <div className="flex items-center gap-3 glass-card px-4 py-2">
                        <div className="text-right">
                            <p className="text-[10px] text-f1-text-muted uppercase tracking-widest">
                                Pole Position
                            </p>
                            <p className="text-sm font-bold">
                                {polePosition.Driver.code}
                            </p>
                        </div>
                        <div className="h-8 w-px bg-f1-border" />
                        <span className="text-f1-red font-mono font-bold text-base">
                            {polePosition.Q3 || polePosition.Q2 || polePosition.Q1 || '—'}
                        </span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {podium.map((result, idx) => {
                    const teamColor = getTeamColor(result.Constructor.constructorId);
                    const pos = positions[idx];
                    const driverImg = getDriverImageUrl(result.Driver.driverId);

                    return (
                        <div
                            key={result.Driver.driverId}
                            className={`relative bg-gradient-to-t from-f1-bg to-f1-surface/50 rounded-xl overflow-hidden group hover:bg-f1-surface transition-colors ${heights[idx]} ${idx === 0 ? 'order-2 md:order-1' : idx === 1 ? 'order-1 md:order-2' : 'order-3'
                                }`}
                            style={{ borderTop: `4px solid ${teamColor}` }}
                        >
                            {/* Position number watermark */}
                            <div
                                className={`absolute top-2 left-3 font-bold z-0 group-hover:opacity-20 transition-opacity ${pos === 1 ? 'text-7xl text-f1-red/10' : 'text-6xl text-white/5'
                                    }`}
                            >
                                {pos}
                            </div>

                            {/* Winner badge */}
                            {pos === 1 && (
                                <div className="absolute top-0 right-0 bg-f1-red text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg z-20 uppercase tracking-wider">
                                    Winner
                                </div>
                            )}

                            {/* Driver headshot */}
                            {driverImg && (
                                <div className="absolute bottom-0 right-0 z-10 opacity-60 group-hover:opacity-80 transition-opacity duration-500">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={driverImg}
                                        alt={`${result.Driver.givenName} ${result.Driver.familyName}`}
                                        className={`object-contain object-bottom ${pos === 1 ? 'h-48 md:h-64' : 'h-40 md:h-48'}`}
                                        style={{
                                            maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)',
                                            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)',
                                        }}
                                    />
                                </div>
                            )}

                            {/* Gradient overlay */}
                            <div className="absolute bottom-0 left-0 w-full h-2/3 gradient-overlay z-10" />

                            {/* Driver info */}
                            <div className="absolute bottom-4 left-4 z-20">
                                <div className="flex items-center gap-2 mb-1">
                                    <div
                                        className="w-1 h-4 rounded-full"
                                        style={{ backgroundColor: teamColor }}
                                    />
                                    <span className="text-[10px] text-f1-text-muted uppercase font-bold tracking-widest">
                                        {result.Constructor.name}
                                    </span>
                                </div>
                                <h4 className={`font-bold leading-none ${pos === 1 ? 'text-xl md:text-2xl' : 'text-lg md:text-xl'}`}>
                                    {result.Driver.givenName}{' '}
                                    <span className="text-white/90">{result.Driver.familyName}</span>
                                </h4>
                                <span className="text-xs font-mono text-f1-text-muted">
                                    {result.Time?.time || result.status || '—'}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Full Race Results Button */}
            <div className="flex justify-center mt-2">
                <Link
                    href={`/results?season=${season}&round=${round}`}
                    className="group/btn flex items-center gap-2 px-6 py-3 glass-card hover:border-f1-red/40 hover:bg-f1-red/5 transition-all duration-300 rounded-lg"
                >
                    <span className="text-sm font-bold uppercase tracking-widest text-f1-text-secondary group-hover/btn:text-white transition-colors">
                        Full Race Results
                    </span>
                    <span className="material-icons text-f1-red text-base group-hover/btn:translate-x-1 transition-transform">
                        arrow_forward
                    </span>
                </Link>
            </div>
        </section>
    );
}
