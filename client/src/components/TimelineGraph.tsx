import React, { useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
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
        const item = payload[0];
        const data = item.payload[`${item.dataKey}_meta`] || {};
        return (
            <Box sx={{
                bgcolor: 'background.paper',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius)',
                p: 1.5,
                boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
                backdropFilter: 'blur(8px)',
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

        const dataObj: any = { lane: 'Timeline' };
        const taskKeys: { key: string; fill: string }[] = [];

        sortedTasks.forEach((task, index) => {
            const startTs = task.timestamp instanceof Timestamp ? task.timestamp.toMillis() : (task.timestamp as number);
            const endTs = task.completedAt instanceof Timestamp ? task.completedAt.toMillis() : (task.completedAt as number);

            const startDate = new Date(startTs);
            const endDate = new Date(endTs);

            const startMin = dayjs(startDate).hour() * 60 + dayjs(startDate).minute();
            const endMin = dayjs(endDate).hour() * 60 + dayjs(endDate).minute();

            const fill = index % 2 === 0 ? theme.palette.primary.main : theme.palette.primary.dark;
            const meta = {
                taskName: task.name,
                duration: task.duration || 0,
                startTimeStr: dayjs(startDate).format('HH:mm'),
                endTimeStr: dayjs(endDate).format('HH:mm'),
            };

            // Calculate duration in minutes and check if it crosses midnight
            const durationMins = dayjs(endDate).diff(dayjs(startDate), 'minute');
            const isDifferentDay = !dayjs(startDate).isSame(dayjs(endDate), 'day');

            if (durationMins >= 1440) {
                // Task is 24h or longer - fill the entire day
                const key = `${task.name}_${task.id}_full`;
                dataObj[key] = [0, 1440];
                dataObj[`${key}_meta`] = meta;
                taskKeys.push({ key, fill });
            } else if (isDifferentDay) {
                // Task crosses midnight (but shorter than 24h)
                const key1 = `${task.name}_${task.id}_1`;
                dataObj[key1] = [startMin, 1440];
                dataObj[`${key1}_meta`] = meta;
                taskKeys.push({ key: key1, fill });

                const key2 = `${task.name}_${task.id}_2`;
                dataObj[key2] = [0, endMin];
                dataObj[`${key2}_meta`] = meta;
                taskKeys.push({ key: key2, fill });
            } else {
                // Normal same-day task
                const key = `${task.name}_${task.id}`;
                dataObj[key] = [startMin, Math.max(startMin + 1, endMin)];
                dataObj[`${key}_meta`] = meta;
                taskKeys.push({ key, fill });
            }
        });

        return { data: [dataObj], taskKeys };
    }, [tasks, theme]);

    if (tasks.length === 0 || chartData.taskKeys.length === 0) return null;

    const chartHeight = 80;

    return (
        <Card sx={{ mb: 4, bgcolor: 'background.paper', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)', overflow: 'visible' }}>
            <CardContent sx={{ p: 2, overflow: 'visible' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="overline" sx={{ color: 'var(--text-muted)', fontWeight: 700 }}>PULSE TIMELINE</Typography>
                    <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
                        {chartData.data.length} Finished Logs
                    </Typography>
                </Box>
                <Box sx={{ width: '100%', height: chartHeight, overflow: 'visible' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={chartData.data}
                            margin={{ top: 5, right: 30, left: -20, bottom: 5 }}
                            barGap="-100%"
                            barCategoryGap={0}
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
                            <Tooltip
                                content={<CustomTooltip />}
                                cursor={{ fill: 'rgba(255,255,255, 0.02)' }}
                                shared={false}
                                isAnimationActive={false}
                                animationDuration={0}
                                allowEscapeViewBox={{ x: true, y: true }}
                            />
                            {chartData.taskKeys.map((item) => (
                                <Bar
                                    key={item.key}
                                    dataKey={item.key}
                                    fill={item.fill}
                                    radius={0}
                                    stroke={item.fill}
                                    strokeWidth={1}
                                    fillOpacity={0.8}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </Box>
            </CardContent>
        </Card>
    );
};
