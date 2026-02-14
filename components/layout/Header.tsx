import Link from 'next/link';

export default function Header() {
    return (
        <header className="w-full fixed top-0 left-0 z-50 bg-gradient-to-b from-f1-bg via-f1-bg/80 to-transparent">
            <div className="max-w-7xl mx-auto w-full p-4 md:px-8 lg:px-12 flex justify-between items-center">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="px-2.5 h-10 md:h-12 bg-f1-red rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(225,6,0,0.3)] animate-pulse-glow group-hover:scale-105 transition-transform duration-300">
                        <span className="font-bold text-base md:text-lg tracking-tighter text-white font-display">
                            F1#247
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg md:text-2xl font-bold tracking-tight uppercase leading-none text-f1-text-muted">
                            F1 #247
                        </span>
                        <span className="hidden md:block text-[8px] font-bold tracking-[0.3em] text-f1-text-muted uppercase mt-0.5">
                            Formula 1 Companion
                        </span>
                    </div>
                </Link>
                <div className="flex items-center gap-3">
                    <button className="p-2 rounded-full hover:bg-white/5 transition-colors group">
                        <span className="material-icons text-f1-text-secondary text-xl group-hover:text-f1-red transition-colors">
                            notifications
                        </span>
                    </button>
                </div>
            </div>
        </header>
    );
}
