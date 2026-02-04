import React from 'react';
import {
    Card,
    CardContent,
    Box,
    Typography,
} from '@mui/material';
import {
    History as HistoryIcon,
} from '@mui/icons-material';
import { formatTotalDuration } from '../utils/dateUtils';

interface DurationSummaryProps {
    totalDurationMillis: number;
}

export const DurationSummary: React.FC<DurationSummaryProps> = ({ totalDurationMillis }) => {
    return (
        <Card sx={{ mb: 3, bgcolor: 'rgba(37, 99, 235, 0.05)', border: '1px solid rgba(37, 99, 235, 0.1)' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', py: '12px !important' }}>
                <Box sx={{ p: 1, bgcolor: 'rgba(37, 99, 235, 0.1)', borderRadius: 'var(--border-radius)', mr: 2 }}>
                    <HistoryIcon sx={{ color: 'primary.main' }} />
                </Box>
                <Box>
                    <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontWeight: 700, letterSpacing: 1 }}>TIME SPENT</Typography>
                    <Typography variant="h5" sx={{ color: 'var(--text-main)', fontWeight: 800 }}>{formatTotalDuration(totalDurationMillis)}</Typography>
                </Box>
            </CardContent>
        </Card>
    );
};
