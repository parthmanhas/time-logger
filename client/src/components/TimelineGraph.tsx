import React, { useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { Box, Typography, Card, CardContent, useTheme, Divider } from '@mui/material';
import dayjs from 'dayjs';
import type { Task } from '../types';
import { Timestamp } from 'firebase/firestore';
import { formatTotalDuration } from '../utils/dateUtils';

interface TimelineGraphProps {
    tasks: Task[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        if (data.count === 0) return null;

        return (
            <Box sx={{
                bgcolor: 'var(--bg-paper)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius)',
                p: 1.5,
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                minWidth: 180,
                maxWidth: 240
            }}>
                <Typography variant="caption" sx={{ color: 'var(--text-muted)', display: 'block', mb: 0.5, fontWeight: 700 }}>
                    {label}:00 - {label}:59
                </Typography>

                <Box sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontWeight: 600 }}>Total Time:</Typography>
                        <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700 }}>
                            {formatTotalDuration(data.totalDuration)}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontWeight: 600 }}>Logs:</Typography>
                        <Typography variant="caption" sx={{ color: 'var(--text-main)', fontWeight: 700 }}>
                            {data.count}
                        </Typography>
                    </Box>
                </Box>

                <Divider sx={{ mb: 1, opacity: 0.1 }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {data.taskNames.map((name: string, i: number) => (
                        <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'primary.main', mt: 0.8, flexShrink: 0 }} />
                            <Typography
                                variant="body2"
                                sx={{
                                    fontSize: '11px',
                                    color: 'var(--text-main)',
                                    lineHeight: 1.2,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical'
                                }}
                            >
                                {name}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            </Box>
        );
    }
    return null;
};

export const TimelineGraph: React.FC<TimelineGraphProps> = ({ tasks }) => {
    const theme = useTheme();

    const data = useMemo(() => {
        // Initialize 24 hours
        const hours = Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            count: 0,
            totalDuration: 0,
            taskNames: [] as string[]
        }));

        tasks.forEach(task => {
            if (!task.completedAt) return; // Only show completed tasks in the graph

            const ts = task.timestamp;
            const date = ts instanceof Timestamp ? ts.toDate() : (typeof ts === 'number' ? new Date(ts) : null);
            if (date) {
                const hour = dayjs(date).hour();
                hours[hour].count += 1;
                hours[hour].totalDuration += (task.duration || 0);
                if (task.name && !hours[hour].taskNames.includes(task.name)) {
                    hours[hour].taskNames.push(task.name);
                }
            }
        });

        // Limit shown task names in tooltip if there are too many
        hours.forEach(h => {
            if (h.taskNames.length > 5) {
                const extraCount = h.taskNames.length - 5;
                h.taskNames = h.taskNames.slice(0, 5);
                h.taskNames.push(`+ ${extraCount} more...`);
            }
        });

        return hours;
    }, [tasks]);

    const activeHoursCount = data.filter(h => h.count > 0).length;

    if (tasks.length === 0) return null;

    return (
        <Card sx={{ mb: 4, bgcolor: 'background.paper', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)' }}>
            <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="overline" sx={{ color: 'var(--text-muted)', fontWeight: 700 }}>24HR COMPLETED ACTIVITY</Typography>
                    <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
                        {activeHoursCount} Productive Hours
                    </Typography>
                </Box>
                <Box sx={{ width: '100%', height: 120 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                                dataKey="hour"
                                tick={{ fontSize: 9, fill: 'var(--text-muted)' }}
                                axisLine={false}
                                tickLine={false}
                                interval={3}
                                tickFormatter={(value) => `${value}h`}
                            />
                            <Tooltip
                                content={<CustomTooltip />}
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            />
                            <Bar
                                dataKey="count"
                                radius={[2, 2, 0, 0]}
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.count > 0 ? theme.palette.primary.main : 'rgba(255,255,255,0.05)'}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </Box>
            </CardContent>
        </Card>
    );
};
