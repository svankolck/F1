'use client';

import { useState, useEffect } from 'react';
import { GameDriver } from '@/lib/types/f1';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

interface DefaultDriverSettingsProps {
    drivers: GameDriver[];
}

export default function DefaultDriverSettings({ drivers }: DefaultDriverSettingsProps) {
    const { user } = useAuth();
    const supabase = createClient();
    const [defaults, setDefaults] = useState({
        default_pole_driver: '',
        default_p1_driver: '',
        default_p2_driver: '',
        default_p3_driver: '',
    });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loadedDrivers, setLoadedDrivers] = useState<GameDriver[]>(drivers);

    // Load drivers if not provided
    useEffect(() => {
        if (drivers.length > 0) return;
        async function load() {
            try {
                const res = await fetch('/api/drivers');
                if (res.ok) {
                    const data = await res.json();
                    setLoadedDrivers(data);
                }
            } catch { /* ignore */ }
        }
        load();
    }, [drivers]);

    // Load existing defaults
    useEffect(() => {
        if (!user) return;
        async function loadDefaults() {
            const { data } = await supabase
                .from('profiles')
                .select('default_pole_driver, default_p1_driver, default_p2_driver, default_p3_driver')
                .eq('id', user!.id)
                .single();
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
    }, [user, supabase]);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update(defaults)
                .eq('id', user.id);
            if (error) throw error;
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error('Failed to save defaults:', err);
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
