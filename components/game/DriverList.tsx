'use client';

import { GameDriver } from '@/lib/types/f1';
import DriverCard from './DriverCard';

interface DriverListProps {
    drivers: GameDriver[];
    placedDriverIds: string[]; // Drivers placed in Race slots (to visually dim them?) OR just to know state
    // Actually, per requirements: "I can drag Max to Pole. And I can drag Max to P1".
    // So drivers shouldn't be fully disabled if placed in Quali.
    // They should only be disabled if they are in a specific *Race* slot if we want to prevent duplicates in Race?
    // But the requirement says "if I drag Max to P2, he moves from P1".
    // So the driver list should probably always be active/draggable, maybe just visual indication of status.
    onSelect: (driver: GameDriver) => void;
    selectedDriverId?: string | null;
}

export default function DriverList({ drivers, placedDriverIds, onSelect, selectedDriverId }: DriverListProps) {
    return (
        <div>
            <p className="text-[10px] text-f1-text-muted uppercase tracking-widest mb-2 font-bold">
                {selectedDriverId ? 'Tap a position to place driver' : 'Drag or tap a driver'}
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-2 max-h-[300px] overflow-y-auto p-1">
                {drivers.map(driver => (
                    <DriverCard
                        key={driver.driverId}
                        driver={driver}
                        // We might want to show visual feedback if they are used, but they remain draggable
                        isPlaced={placedDriverIds.includes(driver.driverId)}
                        onSelect={onSelect}
                        compact={false}
                        isSelected={driver.driverId === selectedDriverId}
                    />
                ))}
            </div>
        </div>
    );
}
