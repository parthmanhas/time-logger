import React, { useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
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

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
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
                    {data.startTimeStr} - {data.endTimeStr}
                </Typography>
                <Typography variant="body2" sx={{ color: 'var(--text-main)', fontWeight: 700, mb: 0.5, lineHeight: 1.2 }}>
                    {data.taskName}
                </Typography>
                <Divider sx={{ my: 1, opacity: 0.1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontWeight: 600 }}>Duration:</Typography>
                    <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700 }}>
                        {formatTotalDuration(data.duration)}
                    </Typography>
                </Box>
            </Box>
        );
    }
    return null;
};

export const TimelineGraph: React.FC<TimelineGraphProps> = ({ tasks }) => {
    const theme = useTheme();

    const chartData = useMemo(() => {
        // Group tasks into lanes to avoid overlap
        const sortedTasks = [...tasks]
            .filter(t => t.completedAt)
            .sort((a, b) => {
                const startA = a.timestamp instanceof Timestamp ? a.timestamp.toMillis() : (a.timestamp as number);
                const startB = b.timestamp instanceof Timestamp ? b.timestamp.toMillis() : (b.timestamp as number);
                return startA - startB;
            });

        const lanes: { end: number }[] = [];
        const result = sortedTasks.map(task => {
            const startTs = task.timestamp instanceof Timestamp ? task.timestamp.toMillis() : (task.timestamp as number);
            const endTs = task.completedAt instanceof Timestamp ? task.completedAt.toMillis() : (task.completedAt as number);

            const startDate = new Date(startTs);
            const endDate = new Date(endTs);

            const startMin = dayjs(startDate).hour() * 60 + dayjs(startDate).minute();
            const endMin = dayjs(endDate).hour() * 60 + dayjs(endDate).minute();

            // Find first lane that doesn't conflict
            let laneIndex = lanes.findIndex(l => l.end <= startMin);
            if (laneIndex === -1) {
                laneIndex = lanes.length;
                lanes.push({ end: endMin });
            } else {
                lanes[laneIndex].end = endMin;
            }

            return {
                taskName: task.name,
                timeRange: [startMin, Math.max(startMin + 1, endMin)], // Ensure at least 1 min width
                duration: (task.duration || 0),
                startTimeStr: dayjs(startDate).format('HH:mm'),
                endTimeStr: dayjs(endDate).format('HH:mm'),
                lane: laneIndex
            };
        });

        return { data: result, laneCount: lanes.length };
    }, [tasks]);

    if (tasks.length === 0 || chartData.data.length === 0) return null;

    const chartHeight = Math.max(chartData.laneCount * 35 + 50, 120);

    return (
        <Card sx={{ mb: 4, bgcolor: 'background.paper', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)' }}>
            <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="overline" sx={{ color: 'var(--text-muted)', fontWeight: 700 }}>PULSE TIMELINE</Typography>
                    <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
                        {chartData.data.length} Finished Logs
                    </Typography>
                </Box>
                <Box sx={{ width: '100%', height: chartHeight }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={chartData.data}
                            margin={{ top: 5, right: 30, left: -20, bottom: 5 }}
                        >
                            <XAxis
                                type="number"
                                domain={[0, 1440]}
                                ticks={[0, 240, 480, 720, 960, 1200, 1440]}
                                tickFormatter={(tick) => `${Math.floor(tick / 60)}h`}
                                fontSize={10}
                                tick={{ fill: 'var(--text-muted)' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                type="category"
                                dataKey="lane"
                                hide
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                            <Bar
                                dataKey="timeRange"
                                fill={theme.palette.primary.main}
                                radius={0}
                                barSize={24}
                            >
                                {chartData.data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={theme.palette.primary.main}
                                        fillOpacity={0.8}
                                        stroke={theme.palette.primary.main}
                                        strokeWidth={1}
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
