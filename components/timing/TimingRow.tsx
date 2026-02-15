import { TimingRowData } from '@/lib/api/timing';
import TyreIndicator from './TyreIndicator';

interface TimingRowProps {
    row: TimingRowData;
}

export default function TimingRow({ row }: TimingRowProps) {
    return (
        <tr className="border-b border-f1-border/40 odd:bg-white/[0.02]">
            <td className="py-2.5 px-2 text-xs md:text-sm font-mono font-bold">P{row.position}</td>
            <td className="py-2.5 px-2">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: row.teamColor }} />
                    <span className="text-xs md:text-sm font-bold">{row.code}</span>
                    <span className="hidden md:inline text-[10px] text-f1-text-muted uppercase tracking-wide">{row.teamName}</span>
                </div>
            </td>
            <td className="py-2.5 px-2 text-[11px] md:text-xs font-mono text-f1-text-secondary">{row.interval}</td>
            <td className="py-2.5 px-2 text-[11px] md:text-xs font-mono text-f1-text-secondary">{row.gapToLeader}</td>
            <td className="hidden md:table-cell py-2.5 px-2 text-xs font-mono">{row.lastLap}</td>
            <td className="hidden lg:table-cell py-2.5 px-2 text-xs font-mono">{row.sector1}</td>
            <td className="hidden lg:table-cell py-2.5 px-2 text-xs font-mono">{row.sector2}</td>
            <td className="hidden lg:table-cell py-2.5 px-2 text-xs font-mono">{row.sector3}</td>
            <td className="hidden md:table-cell py-2.5 px-2 text-xs font-mono">{row.pitStops}</td>
            <td className="py-2.5 px-2"><TyreIndicator compound={row.tyre} /></td>
        </tr>
    );
}
