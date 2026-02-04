import React, { memo } from 'react';
import {
    Box,
    Typography,
    Stack,
    IconButton,
    ToggleButtonGroup,
    ToggleButton,
    Chip,
    TableContainer,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Paper,
} from '@mui/material';
import {
    Download as DownloadIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import type { Task, Project } from '../types';
import { TaskRow } from './TaskRow';
import { formatTotalDuration } from '../utils/dateUtils';

interface HistorySectionProps {
    filteredTasks: Task[];
    taskFilter: string;
    setTaskFilter: (val: string) => void;
    exportToCSV: () => void;
    projectFilter: string;
    setProjectFilter: (val: string) => void;
    dateFilter: string;
    setDateFilter: (val: string) => void;
    projects: Project[] | undefined;
    sortedDays: string[];
    dailyTotals: Record<string, number>;
    editingTaskId: string | null;
    editingField: 'timestamp' | 'completedAt' | 'name' | null;
    editingValue: string;
    startEditingTime: (task: Task, field: 'timestamp' | 'completedAt') => void;
    startEditingTaskName: (task: Task) => void;
    saveEditedTime: (id: string) => void;
    saveEditedTaskName: (id: string) => void;
    updateToNow: (id: string, field: 'timestamp' | 'completedAt') => void;
    handleCompleteTask: (id: string) => void;
    handleUncompleteTask: (id: string) => void;
    handleDeleteTask: (id: string) => void;
    setEditingTaskId: (id: string | null) => void;
    setEditingField: (field: 'timestamp' | 'completedAt' | 'name' | null) => void;
    setEditingValue: (val: string) => void;
}

export const HistorySection: React.FC<HistorySectionProps> = memo(({
    filteredTasks,
    taskFilter,
    setTaskFilter,
    exportToCSV,
    projectFilter,
    setProjectFilter,
    dateFilter,
    setDateFilter,
    projects,
    sortedDays,
    dailyTotals,
    ...taskRowProps
}) => {
    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>History</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                    <ToggleButtonGroup value={taskFilter} exclusive onChange={(_, v) => v && setTaskFilter(v)} size="small">
                        <ToggleButton value="all">All</ToggleButton>
                        <ToggleButton value="pending">Pending</ToggleButton>
                        <ToggleButton value="completed">Completed</ToggleButton>
                    </ToggleButtonGroup>
                    <IconButton size="small" onClick={exportToCSV} title="Export CSV"><DownloadIcon fontSize="small" /></IconButton>
                </Stack>
            </Box>

            {(projectFilter !== 'all' || dateFilter !== 'all') && (
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    {projectFilter !== 'all' && (
                        <Chip
                            label={`Project: ${projects?.find(p => p.id === projectFilter)?.name}`}
                            onDelete={() => setProjectFilter('all')}
                            size="small"
                            color="primary"
                            variant="outlined"
                        />
                    )}
                    {dateFilter !== 'all' && (
                        <Chip
                            label={`Date: ${dayjs(dateFilter).format('MMM DD')}`}
                            onDelete={() => setDateFilter('all')}
                            size="small"
                            color="secondary"
                            variant="outlined"
                        />
                    )}
                </Stack>
            )}

            {sortedDays.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 2, mb: 2, '&::-webkit-scrollbar': { display: 'none' } }}>
                    {sortedDays.map(day => (
                        <Box
                            key={day}
                            onClick={() => setDateFilter(dateFilter === day ? 'all' : day)}
                            sx={{
                                minWidth: 90,
                                p: 1.5,
                                borderRadius: 'var(--border-radius)',
                                border: '1px solid',
                                borderColor: dateFilter === day ? 'primary.main' : 'rgba(255,255,255,0.1)',
                                bgcolor: dateFilter === day ? 'rgba(37, 99, 235, 0.1)' : 'background.paper',
                                cursor: 'pointer',
                                textAlign: 'center',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>{dayjs(day).format('ddd')}</Typography>
                            <Typography sx={{ fontWeight: 700 }}>{formatTotalDuration(dailyTotals[day])}</Typography>
                        </Box>
                    ))}
                </Box>
            )}

            <TableContainer component={Paper} sx={{ bgcolor: 'background.paper', borderRadius: 'var(--border-radius)', padding: '10px', overflow: 'hidden' }}>
                <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ width: { xs: 85, sm: 110 }, color: 'var(--text-muted)', fontWeight: 700, fontSize: '11px', p: { xs: 0.5, sm: 1.5 } }}>TIME</TableCell>
                            <TableCell sx={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '11px', p: { xs: 0.5, sm: 1.5 } }}>TASK</TableCell>
                            <TableCell align="right" sx={{ width: { xs: 60, sm: 180 }, color: 'var(--text-muted)', fontWeight: 700, fontSize: '11px', p: { xs: 0.5, sm: 1.5 } }}>ACTIONS</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredTasks.length > 0 ? (
                            filteredTasks.map(task => (
                                <TaskRow
                                    key={task.id}
                                    record={task}
                                    project={projects?.find(p => p.id === task.projectId)}
                                    {...taskRowProps}
                                />
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={3} sx={{ py: 6, textAlign: 'center', color: 'var(--text-muted)' }}>No logs found.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
});
