'use client';

import { useEffect, useMemo, useState } from 'react';
import { GameDriver } from '@/lib/types/f1';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { FALLBACK_2026_DRIVERS } from '@/lib/api/game';

interface DefaultDriverSettingsProps {
    drivers: GameDriver[];
}

export default function DefaultDriverSettings({ drivers }: DefaultDriverSettingsProps) {
    const { user } = useAuth();
    // Supabase client is only used for READING defaults (SELECT is safe client-side with RLS)
    const supabase = useMemo(() => createClient(), []);
    const [defaults, setDefaults] = useState({
        default_pole_driver: '',
        default_p1_driver: '',
        default_p2_driver: '',
        default_p3_driver: '',
    });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loadedDrivers, setLoadedDrivers] = useState<GameDriver[]>(drivers);

    // Keep local options in sync with server-provided drivers.
    useEffect(() => {
        if (drivers.length > 0) {
            setLoadedDrivers(drivers);
        }
    }, [drivers]);

    // Load drivers if not provided
    useEffect(() => {
        if (drivers.length > 0) return;
        async function load() {
            try {
                const res = await fetch('/api/drivers');
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        setLoadedDrivers(data);
                    } else {
                        setLoadedDrivers(FALLBACK_2026_DRIVERS);
                    }
                } else {
                    setLoadedDrivers(FALLBACK_2026_DRIVERS);
                }
            } catch {
                setLoadedDrivers(FALLBACK_2026_DRIVERS);
            }
        }
        load();
    }, [drivers]);

    // Load existing defaults via Supabase (SELECT is fine client-side — RLS allows owner reads)
    useEffect(() => {
        const userId = user?.id;
        if (!userId) return;

        async function loadDefaults() {
            const { data, error } = await supabase
                .from('profiles')
                .select('default_pole_driver, default_p1_driver, default_p2_driver, default_p3_driver')
                .eq('id', userId)
                .maybeSingle();

            if (error) {
                console.error('Failed to load default drivers:', error);
                return;
            }

            if (data) {
                setDefaults({
                    default_pole_driver: data.default_pole_driver || '',
                    default_p1_driver: data.default_p1_driver || '',
                    default_p2_driver: data.default_p2_driver || '',
                    default_p3_driver: data.default_p3_driver || '',
                });
            }
        }

        loadDefaults();
    }, [user?.id, supabase]);

    // Save via server-side API route — session is validated on the server,
    // which avoids client-side RLS cookie issues and is more secure.
    const handleSave = async () => {
        if (!user?.id) return;
        setSaving(true);

        try {
            const res = await fetch('/api/profile/defaults', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(defaults),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(err.error || `HTTP ${res.status}`);
            }

            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err: unknown) {
            console.error('Failed to save defaults:', err);
            const message = err instanceof Error ? err.message : 'Unknown error';
            alert(`Failed to save: ${message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field: keyof typeof defaults, value: string) => {
        setDefaults(prev => ({ ...prev, [field]: value }));
        setSaved(false);
    };

    const driverOptions = loadedDrivers;

    const renderSelect = (label: string, field: keyof typeof defaults, icon: string) => {
        const selectedDriver = driverOptions.find(d => d.driverId === defaults[field]);

        return (
            <div className="space-y-1">
                <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-f1-text-muted">
                    <span className="material-icons text-xs">{icon}</span>
                    {label}
                </label>
                <select
                    value={defaults[field]}
                    onChange={(e) => handleChange(field, e.target.value)}
                    className="w-full bg-f1-surface/50 border border-f1-border/30 rounded-lg px-3 py-2 text-sm
                        focus:outline-none focus:border-f1-red/50 transition-colors"
                    style={selectedDriver ? { borderLeftColor: selectedDriver.teamColor, borderLeftWidth: '3px' } : {}}
                >
                    <option value="">— Not set —</option>
                    {driverOptions.map(d => (
                        <option key={d.driverId} value={d.driverId}>
                            {d.code} — {d.firstName} {d.lastName} ({d.teamName})
                        </option>
                    ))}
                </select>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest">Default Predictions</h3>
                    <p className="text-[10px] text-f1-text-muted mt-0.5">
                        These will be used automatically if you don&apos;t make a manual choice
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {renderSelect('Pole Position', 'default_pole_driver', 'emoji_events')}
                {renderSelect('P1 (Winner)', 'default_p1_driver', 'looks_one')}
                {renderSelect('P2', 'default_p2_driver', 'looks_two')}
                {renderSelect('P3', 'default_p3_driver', 'looks_3')}
            </div>

            <button
                onClick={handleSave}
                disabled={saving}
                className={`w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all
                    ${saved
                        ? 'bg-green-600 text-white'
                        : 'bg-f1-red hover:bg-f1-red/80 text-white'
                    }`}
            >
                {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Defaults'}
            </button>
        </div>
    );
}
