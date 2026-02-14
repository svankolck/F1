'use client';

import { Race } from '@/lib/types/f1';
import RoundSlider from '@/components/standings/RoundSlider';

interface RaceSliderProps {
    races: Race[];
    selectedRound: string;
    onSelectRound: (round: string) => void;
    countryFlags: Record<string, string>;
}

export default function RaceSlider({ races, selectedRound, onSelectRound, countryFlags }: RaceSliderProps) {
    return (
        <RoundSlider
            races={races}
            selectedRound={selectedRound}
            onSelectRound={onSelectRound}
            countryFlags={countryFlags}
        />
    );
}
