interface TyreIndicatorProps {
    compound: string;
}

const TYRE_STYLES: Record<string, string> = {
    SOFT: 'bg-red-500/20 text-red-300 border-red-400/30',
    MEDIUM: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
    HARD: 'bg-slate-100/15 text-slate-200 border-slate-200/30',
    INTERMEDIATE: 'bg-green-500/20 text-green-300 border-green-400/30',
    WET: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
};

const TYRE_SHORT: Record<string, string> = {
    SOFT: 'S',
    MEDIUM: 'M',
    HARD: 'H',
    INTERMEDIATE: 'I',
    WET: 'W',
};

export default function TyreIndicator({ compound }: TyreIndicatorProps) {
    const normalized = (compound || '').toUpperCase();
    const style = TYRE_STYLES[normalized] || 'bg-white/10 text-f1-text-muted border-white/20';
    const label = TYRE_SHORT[normalized] || '—';

    return (
        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full border text-[10px] font-bold ${style}`} title={normalized || 'Unknown'}>
            {label}
        </span>
    );
}
