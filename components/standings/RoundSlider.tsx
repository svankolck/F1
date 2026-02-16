'use client';

import { useRef, useEffect, useState } from 'react';
import { Race } from '@/lib/types/f1';

interface RoundSliderProps {
    races: Race[];
    selectedRound: string;
    onSelectRound: (round: string) => void;
    countryFlags: Record<string, string>;
}

// 3-letter country abbreviations
const COUNTRY_ABBR: Record<string, string> = {
    'Australia': 'AUS',
    'Austria': 'AUT',
    'Azerbaijan': 'AZE',
    'Bahrain': 'BHR',
    'Belgium': 'BEL',
    'Brazil': 'BRA',
    'Canada': 'CAN',
    'China': 'CHN',
    'France': 'FRA',
    'Germany': 'GER',
    'Hungary': 'HUN',
    'India': 'IND',
    'Italy': 'ITA',
    'Japan': 'JPN',
    'Korea': 'KOR',
    'Malaysia': 'MAL',
    'Mexico': 'MEX',
    'Monaco': 'MON',
    'Netherlands': 'NED',
    'Portugal': 'POR',
    'Qatar': 'QAT',
    'Russia': 'RUS',
    'Saudi Arabia': 'KSA',
    'Singapore': 'SGP',
    'Spain': 'ESP',
    'Turkey': 'TUR',
    'UAE': 'UAE',
    'UK': 'GBR',
    'USA': 'USA',
    'United States': 'USA',
    'Las Vegas': 'LVS',
};

function getCountryAbbr(country: string): string {
    return COUNTRY_ABBR[country] || country.substring(0, 3).toUpperCase();
}

export default function RoundSlider({ races, selectedRound, onSelectRound, countryFlags }: RoundSliderProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const selectedRef = useRef<HTMLButtonElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    // Scroll active round into view
    useEffect(() => {
        if (selectedRef.current && scrollRef.current) {
            const container = scrollRef.current;
            const el = selectedRef.current;
            const offset = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2;
            container.scrollTo({ left: offset, behavior: 'smooth' });
        }
    }, [selectedRound]);

    // Track scroll position to show/hide arrows
    const updateArrows = () => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setShowLeftArrow(scrollLeft > 10);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    };

    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;
        updateArrows();
        container.addEventListener('scroll', updateArrows, { passive: true });
        return () => container.removeEventListener('scroll', updateArrows);
    }, [races]);

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollRef.current) return;
        const scrollAmount = scrollRef.current.clientWidth * 0.6;
        scrollRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth',
        });
    };

    return (
        <div className="relative group">
            {/* Left arrow */}
            {showLeftArrow && (
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-0 bottom-0 z-10 w-8 flex items-center justify-center bg-gradient-to-r from-f1-bg via-f1-bg/80 to-transparent hover:from-f1-surface transition-colors"
                    aria-label="Scroll left"
                >
                    <span className="material-icons text-white/70 hover:text-white text-lg">chevron_left</span>
                </button>
            )}

            {/* Scrollable container */}
            <div
                ref={scrollRef}
                className="round-slider flex gap-1.5 pb-2 pr-8"
            >
                {races.map((race) => {
                    const isActive = race.round === selectedRound;
                    const country = race.Circuit.Location.country;
                    const flagUrl = countryFlags[country] || '';
                    const abbr = getCountryAbbr(country);

                    return (
                        <button
                            key={race.round}
                            ref={isActive ? selectedRef : null}
                            onClick={() => onSelectRound(race.round)}
                            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-300 w-[80px] ${isActive
                                ? 'bg-f1-red/20 border border-f1-red/50 shadow-[0_0_12px_rgba(225,6,0,0.2)]'
                                : 'bg-f1-surface/50 border border-f1-border/50 hover:bg-f1-surface hover:border-f1-border'
                                }`}
                        >
                            {flagUrl && (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                    src={flagUrl}
                                    alt={country}
                                    className="w-5 h-3.5 object-cover rounded-[2px] flex-shrink-0"
                                />
                            )}
                            <div className="flex flex-col items-start min-w-0">
                                <span className={`text-[8px] font-mono uppercase tracking-wider ${isActive ? 'text-f1-red' : 'text-f1-text-muted'
                                    }`}>
                                    R{race.round}
                                </span>
                                <span className={`text-[10px] font-bold ${isActive ? 'text-white' : 'text-f1-text-secondary'
                                    }`}>
                                    {abbr}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Right arrow */}
            {showRightArrow && (
                <button
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-0 bottom-0 z-10 w-8 flex items-center justify-center bg-gradient-to-l from-f1-bg via-f1-bg/80 to-transparent hover:from-f1-surface transition-colors"
                    aria-label="Scroll right"
                >
                    <span className="material-icons text-white/70 hover:text-white text-lg">chevron_right</span>
                </button>
            )}
        </div>
    );
}
