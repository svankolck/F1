'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
    { href: '/', icon: 'home', label: 'Home' },
    { href: '/timing', icon: 'timer', label: 'Timing' },
    { href: '/standings', icon: 'leaderboard', label: 'Standings' },
    { href: '/results', icon: 'flag', label: 'Results' },
    { href: '/game', icon: 'sports_esports', label: 'Game', authOnly: true },
    { href: '/login', icon: 'person', label: 'Login' },
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 w-full bg-f1-bg/95 backdrop-blur-md border-t border-f1-border z-50">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between md:justify-center md:gap-8 h-20 items-center">
                    {NAV_ITEMS.map((item) => {
                        const isActive =
                            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center justify-center gap-1 w-16 relative transition-colors ${isActive
                                        ? 'text-f1-red'
                                        : 'text-f1-text-muted hover:text-white'
                                    }`}
                            >
                                {isActive && (
                                    <div className="absolute -top-[1px] w-10 h-[3px] bg-f1-red rounded-b-full shadow-[0_0_10px_var(--f1-red)]" />
                                )}
                                <span className="material-icons text-[22px]">{item.icon}</span>
                                <span className="text-[9px] font-bold uppercase tracking-wider">
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
