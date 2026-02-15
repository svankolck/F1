import { OpenF1Session } from '@/lib/types/f1';

interface SessionSelectorProps {
    sessions: OpenF1Session[];
    selectedSessionKey: number | null;
    onSelectSession: (sessionKey: number) => void;
}

function shortLabel(session: OpenF1Session): string {
    const name = session.session_name.toLowerCase();
    if (name.includes('practice 1')) return 'FP1';
    if (name.includes('practice 2')) return 'FP2';
    if (name.includes('practice 3')) return 'FP3';
    if (name.includes('sprint qualifying')) return 'SQ';
    if (name.includes('qualifying')) return 'QUALI';
    if (name.includes('sprint')) return 'SPRINT';
    if (name.includes('race')) return 'RACE';
    return session.session_name.toUpperCase();
}

export default function SessionSelector({ sessions, selectedSessionKey, onSelectSession }: SessionSelectorProps) {
    if (!sessions.length) return null;

    return (
        <div className="flex gap-2 overflow-x-auto pb-1">
            {sessions.map((session) => {
                const active = session.session_key === selectedSessionKey;
                return (
                    <button
                        key={session.session_key}
                        onClick={() => onSelectSession(session.session_key)}
                        className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${active ? 'bg-f1-red text-white shadow-lg shadow-f1-red/20' : 'bg-f1-surface/60 border border-f1-border text-f1-text-muted hover:text-white'}`}
                    >
                        {shortLabel(session)}
                    </button>
                );
            })}
        </div>
    );
}
