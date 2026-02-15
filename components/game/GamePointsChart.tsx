'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface PointsData {
    round: number;
    raceName: string;
    points: number;
    cumulative: number;
}

interface GamePointsChartProps {
    data: PointsData[];
    userName?: string;
}

export default function GamePointsChart({ data, userName }: GamePointsChartProps) {
    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
                <span className="material-icons text-4xl text-f1-text-muted">show_chart</span>
                <p className="text-f1-text-muted text-sm">Nog geen puntendata</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-widest text-f1-text-muted">
                Puntenverloop {userName && `— ${userName}`}
            </h3>

            <div className="w-full h-[250px] glass-card p-4 rounded-xl">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                            dataKey="round"
                            stroke="rgba(255,255,255,0.3)"
                            fontSize={10}
                            tickLine={false}
                        />
                        <YAxis
                            stroke="rgba(255,255,255,0.3)"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(15, 15, 15, 0.95)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                fontSize: '12px',
                            }}
                            labelFormatter={(round) => {
                                const d = data.find(d => d.round === round);
                                return d?.raceName || `Ronde ${round}`;
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="cumulative"
                            stroke="#E10600"
                            strokeWidth={2}
                            dot={{ r: 4, fill: '#E10600', strokeWidth: 0 }}
                            activeDot={{ r: 6, fill: '#E10600', stroke: '#fff', strokeWidth: 2 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="points"
                            stroke="rgba(255,255,255,0.4)"
                            strokeWidth={1}
                            strokeDasharray="4 4"
                            dot={{ r: 3, fill: 'rgba(255,255,255,0.4)', strokeWidth: 0 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
