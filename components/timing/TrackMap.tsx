import { useEffect, useRef, useState } from 'react';
import { TimingRowData } from '@/lib/api/timing';
import { OpenF1Session } from '@/lib/types/f1';
import { CIRCUIT_SVG_MAP } from '@/lib/types/f1';

interface TrackMapProps {
    rows: TimingRowData[];
    session: OpenF1Session | null;
}

export default function TrackMap({ rows, session }: TrackMapProps) {
    const [svgPath, setSvgPath] = useState<string | null>(null);
    const [pathLength, setPathLength] = useState<number>(0);
    const pathRef = useRef<SVGPathElement>(null);

    // Heuristic mapper from OpenF1 to svg filename
    useEffect(() => {
        setSvgPath(null);
        if (!session) return;

        const shortName = session.circuit_short_name.toLowerCase();
        const country = session.country_name.toLowerCase();
        const availableSvgs = Object.values(CIRCUIT_SVG_MAP);

        // Try precise matches first
        let matchedSvg = availableSvgs.find(s => shortName.includes(s) || country.includes(s));

        // Manual fallbacks for tricky ones
        if (!matchedSvg) {
            if (country === 'australia') matchedSvg = 'melbourne';
            else if (country === 'saudi arabia') matchedSvg = 'jeddah';
            else if (country === 'united states') {
                if (shortName.includes('austin') || shortName.includes('americas')) matchedSvg = 'austin';
                else if (shortName.includes('vegas')) matchedSvg = 'las-vegas';
                else if (shortName.includes('miami')) matchedSvg = 'miami';
            }
            else if (country === 'united arab emirates') matchedSvg = 'yas-marina';
            else if (country === 'great britain') matchedSvg = 'silverstone';
            else if (shortName.includes('sakhir')) matchedSvg = 'bahrain';
        }

        if (matchedSvg) {
            // Fetch the SVG file and extract the path
            fetch(`/tracks/${matchedSvg}.svg`)
                .then(res => res.text())
                .then(text => {
                    // Quick regex to extract the main path d="..."
                    const match = text.match(/<path[^>]*d="([^"]+)"/i);
                    // Often there's a background path and a foreground path in these SVGs. We just need the first valid path.
                    if (match && match[1]) {
                        setSvgPath(match[1]);
                    }
                })
                .catch(err => console.error("Failed to fetch SVG for TrackMap", err));
        }
    }, [session]);

    useEffect(() => {
        if (pathRef.current) {
            setPathLength(pathRef.current.getTotalLength());
        }
    }, [svgPath]);

    if (!rows.length) return null;

    const topRows = rows.slice(0, 10);

    return (
        <div className="hidden xl:block glass-card border border-f1-border p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-mono text-f1-red uppercase tracking-widest">Track Position</h3>
                <span className="text-[10px] text-f1-text-muted uppercase tracking-widest">Preview</span>
            </div>

            <div className="relative h-[220px] rounded-xl bg-f1-surface/40 border border-f1-border overflow-hidden flex items-center justify-center">

                {svgPath && pathLength > 0 ? (
                    <>
                        <svg viewBox="0 0 500 500" className="w-[85%] h-[85%] opacity-30 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
                            <path
                                ref={pathRef}
                                d={svgPath}
                                fill="none"
                                stroke="white"
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        {topRows.map((row, index) => {
                            // Calculate dot position on path
                            const fraction = Math.max(0, Math.min(1, 1 - (index / topRows.length))); // Rough spread based on position for preview
                            // If we had realistic lapDuration intervals, we could base fraction on that. For now, spread them out.
                            const point = pathRef.current?.getPointAtLength(fraction * pathLength);

                            // Map viewBox 0-500 to percentage for absolute positioning
                            const x = point ? (point.x / 500) * 100 : 50;
                            const y = point ? (point.y / 500) * 100 : 50;

                            return (
                                <div
                                    key={row.driverNumber}
                                    className="absolute w-6 h-6 rounded-full border text-[9px] font-bold flex items-center justify-center transition-all duration-1000 ease-linear shadow-lg"
                                    style={{
                                        left: `${x}%`,
                                        top: `${y}%`,
                                        transform: 'translate(-50%, -50%)',
                                        backgroundColor: `${row.teamColor}D0`,
                                        borderColor: row.teamColor,
                                        color: 'white',
                                        zIndex: 20 - index
                                    }}
                                    title={`${row.code} P${row.position}`}
                                >
                                    {row.code}
                                </div>
                            );
                        })}
                    </>
                ) : (
                    // Fallback Circle
                    <>
                        <div className="absolute inset-6 border-2 border-dashed border-white/10 rounded-full" />
                        {topRows.map((row, index) => {
                            const angle = (index / topRows.length) * Math.PI * 2;
                            const x = 50 + Math.cos(angle) * 35;
                            const y = 50 + Math.sin(angle) * 35;
                            return (
                                <div
                                    key={row.driverNumber}
                                    className="absolute w-6 h-6 rounded-full border text-[9px] font-bold flex items-center justify-center"
                                    style={{
                                        left: `${x}%`,
                                        top: `${y}%`,
                                        transform: 'translate(-50%, -50%)',
                                        backgroundColor: `${row.teamColor}D0`,
                                        borderColor: row.teamColor,
                                        color: 'white',
                                        zIndex: 20 - index
                                    }}
                                    title={`${row.code} P${row.position}`}
                                >
                                    {row.code}
                                </div>
                            );
                        })}
                    </>
                )}
            </div>
        </div>
    );
}
