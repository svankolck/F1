import Image from 'next/image';
import Link from 'next/link';

export default function Header() {
    return (
        <header className="w-full fixed top-0 left-0 z-50 bg-gradient-to-b from-f1-bg via-f1-bg/80 to-transparent">
            <div className="max-w-7xl mx-auto w-full p-4 md:px-8 lg:px-12 flex justify-between items-center gap-4">
                <Link href="/" className="flex min-w-0 items-center gap-3 group">
                    <div className="relative h-10 w-[76px] overflow-hidden rounded-xl shadow-[0_0_15px_rgba(225,6,0,0.3)] animate-pulse-glow transition-transform duration-300 group-hover:scale-105 md:h-12 md:w-[88px]">
                        <Image
                            src="/logo.png"
                            alt="F1#247 logo"
                            fill
                            sizes="88px"
                            className="object-cover object-center"
                            priority
                        />
                    </div>
                    <div className="min-w-0 flex flex-col justify-center">
                        <span className="block truncate text-[10px] md:text-xs font-bold tracking-[0.18em] md:tracking-[0.28em] text-f1-text-muted uppercase leading-none">
                            Driven By Northern Madness
                        </span>
                    </div>
                </Link>
                <nav aria-label="Main navigation" className="hidden md:flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
                    <Link className="rounded-md px-3 py-2 text-f1-text-secondary transition-colors hover:bg-white/5 hover:text-white" href="/calendar">Calendar</Link>
                    <Link className="rounded-md px-3 py-2 text-f1-text-secondary transition-colors hover:bg-white/5 hover:text-white" href="/standings">Standings</Link>
                    <Link className="rounded-md px-3 py-2 text-f1-text-secondary transition-colors hover:bg-white/5 hover:text-white" href="/results">Results</Link>
                    <Link className="rounded-md px-3 py-2 text-f1-text-secondary transition-colors hover:bg-white/5 hover:text-white" href="/game">Game</Link>
                </nav>

            </div>
        </header>
    );
}
