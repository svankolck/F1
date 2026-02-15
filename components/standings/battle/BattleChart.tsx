'use client';

import { BattleDataPoint, BattleDriver } from '@/lib/api/battle';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartTooltip from './ChartTooltip';

interface BattleChartProps {
    data: BattleDataPoint[];
    drivers: BattleDriver[];
    selectedDriverIds: string[];
}

export default function BattleChart({ data, drivers, selectedDriverIds }: BattleChartProps) {
    const visibleDrivers = drivers.filter((driver) => selectedDriverIds.includes(driver.driverId));

    if (!data.length) {
        return (
            <div className="glass-card p-8 text-center border border-f1-border">
                <span className="material-icons text-3xl text-f1-text-muted mb-2 block">show_chart</span>
                <p className="text-f1-text-secondary">Geen battle data beschikbaar voor dit seizoen.</p>
            </div>
        );
    }

    if (!visibleDrivers.length) {
        return (
            <div className="glass-card p-8 text-center border border-f1-border">
                <span className="material-icons text-3xl text-f1-text-muted mb-2 block">person_search</span>
                <p className="text-f1-text-secondary">Selecteer minimaal één rijder om de grafiek te tonen.</p>
            </div>
        );
    }

    return (
        <div className="glass-card border border-f1-border p-3 md:p-5">
            <div className="overflow-x-auto">
                <div className="min-w-[760px] h-[320px] md:h-[420px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                            <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
                            <XAxis
                                dataKey="roundLabel"
                                tick={{ fill: '#9ca3af', fontSize: 11 }}
                                axisLine={{ stroke: 'rgba(255,255,255,0.15)' }}
                                tickLine={{ stroke: 'rgba(255,255,255,0.15)' }}
                            />
                            <YAxis
                                tick={{ fill: '#9ca3af', fontSize: 11 }}
                                axisLine={{ stroke: 'rgba(255,255,255,0.15)' }}
                                tickLine={{ stroke: 'rgba(255,255,255,0.15)' }}
                                allowDecimals={false}
                            />
                            <Tooltip content={<ChartTooltip drivers={drivers} />} />

                            {visibleDrivers.map((driver) => (
                                <Line
                                    key={driver.driverId}
                                    type="monotone"
                                    dataKey={driver.driverId}
                                    name={driver.code}
                                    stroke={driver.teamColor}
                                    strokeWidth={2.5}
                                    dot={false}
                                    activeDot={{ r: 5, stroke: driver.teamColor, strokeWidth: 2, fill: '#1a0a0a' }}
                                    connectNulls
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
