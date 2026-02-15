'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BattleDataPoint, BattleDriver } from '@/lib/api/battle';
import BattleChart from './BattleChart';
import DriverSelector from './DriverSelector';

interface BattleClientProps {
    initialSeason: string;
    initialDrivers: BattleDriver[];
    initialData: BattleDataPoint[];
    initialDefaultDriverIds: string[];
    availableSeasons: string[];
}

interface BattleApiResponse {
    season: string;
    drivers: BattleDriver[];
    data: BattleDataPoint[];
    defaultDriverIds: string[];
}

export default function BattleClient({
    initialSeason,
    initialDrivers,
    initialData,
    initialDefaultDriverIds,
    availableSeasons,
}: BattleClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [season, setSeason] = useState(searchParams.get('season') || initialSeason);
    const [drivers, setDrivers] = useState<BattleDriver[]>(initialDrivers);
    const [data, setData] = useState<BattleDataPoint[]>(initialData);
    const [selectedDriverIds, setSelectedDriverIds] = useState<string[]>(
        initialDefaultDriverIds.length ? initialDefaultDriverIds : initialDrivers.slice(0, 3).map((driver) => driver.driverId)
    );
    const [loading, setLoading] = useState(false);

    const updateUrl = useCallback((nextSeason: string) => {
        const params = new URLSearchParams();
        params.set('season', nextSeason);
        router.replace(`/standings/battle?${params.toString()}`, { scroll: false });
    }, [router]);

    const fetchBattleData = useCallback(async (targetSeason: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/standings/battle?season=${targetSeason}`);
            if (!res.ok) {
                throw new Error('Failed to fetch battle data');
            }

            const payload: BattleApiResponse = await res.json();
            setDrivers(payload.drivers || []);
            setData(payload.data || []);
            setSelectedDriverIds(
                payload.defaultDriverIds?.length
                    ? payload.defaultDriverIds
                    : (payload.drivers || []).slice(0, 3).map((driver) => driver.driverId)
            );
        } catch (error) {
            console.error('Battle data fetch failed:', error);
            setDrivers([]);
            setData([]);
            setSelectedDriverIds([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSeasonChange = useCallback(async (nextSeason: string) => {
        setSeason(nextSeason);
        updateUrl(nextSeason);
        await fetchBattleData(nextSeason);
    }, [fetchBattleData, updateUrl]);

    const toggleDriver = useCallback((driverId: string) => {
        setSelectedDriverIds((prev) => {
            if (prev.includes(driverId)) {
                if (prev.length === 1) {
                    return prev;
                }
                return prev.filter((id) => id !== driverId);
            }
            return [...prev, driverId];
        });
    }, []);

    useEffect(() => {
        const urlSeason = searchParams.get('season');
        if (urlSeason && urlSeason !== initialSeason) {
            fetchBattleData(urlSeason);
            setSeason(urlSeason);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const selectedCount = selectedDriverIds.length;
    const rounds = useMemo(() => data.length, [data]);

    return (
        <div className="flex flex-col gap-5 w-full">
            <div className="flex items-center gap-2 text-sm">
                <Link href="/standings" className="text-f1-text-muted hover:text-white transition-colors">Standings</Link>
                <span className="text-f1-text-muted">/</span>
                <span className="text-white">Battle</span>
            </div>

            <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-4">
                <div>
                    <h2 className="text-xs font-mono text-f1-red mb-1 uppercase tracking-widest">Analytics</h2>
                    <h1 className="text-2xl md:text-4xl font-bold uppercase tracking-tight">Driver Battle</h1>
                    <p className="text-sm text-f1-text-secondary mt-1">Puntenverloop per ronde met teamkleur-lijnen.</p>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-[10px] text-f1-text-muted uppercase tracking-widest font-mono">Season</span>
                    <select
                        value={season}
                        onChange={(event) => handleSeasonChange(event.target.value)}
                        className="bg-f1-surface border border-f1-border rounded-lg px-3 py-2 text-sm font-bold text-white appearance-none cursor-pointer hover:border-f1-red/30 transition-colors focus:outline-none focus:border-f1-red/50"
                    >
                        {availableSeasons.map((option) => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 items-start">
                <div className="xl:col-span-3 order-2 xl:order-1">
                    {loading ? (
                        <div className="glass-card p-8 flex items-center justify-center gap-3 border border-f1-border min-h-[340px]">
                            <div className="w-5 h-5 border-2 border-f1-red/30 border-t-f1-red rounded-full animate-spin" />
                            <span className="text-sm text-f1-text-muted font-mono uppercase tracking-wider">Loading…</span>
                        </div>
                    ) : (
                        <BattleChart
                            data={data}
                            drivers={drivers}
                            selectedDriverIds={selectedDriverIds}
                        />
                    )}
                </div>

                <div className="xl:col-span-1 order-1 xl:order-2">
                    <DriverSelector
                        drivers={drivers}
                        selectedDriverIds={selectedDriverIds}
                        onToggleDriver={toggleDriver}
                    />
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                <div className="glass-card px-3 py-2 border border-f1-border">
                    <p className="text-[10px] text-f1-text-muted uppercase tracking-widest font-mono">Rounds</p>
                    <p className="text-lg font-bold font-mono">{rounds}</p>
                </div>
                <div className="glass-card px-3 py-2 border border-f1-border">
                    <p className="text-[10px] text-f1-text-muted uppercase tracking-widest font-mono">Compared Drivers</p>
                    <p className="text-lg font-bold font-mono">{selectedCount}</p>
                </div>
            </div>
        </div>
    );
}
