import React, { useState } from 'react';
import {
    Box,
    Typography,
    TableRow,
    TableCell,
    IconButton,
    Stack,
    Chip,
    Button,
    TextField,
    Tooltip,
} from '@mui/material';
import {
    CheckOutlined,
    CloseOutlined,
    UndoOutlined,
    CheckCircleOutlined,
    DeleteOutlined,
    EditOutlined,
    ContentCopy,
    AccessTime as ClockIcon,
    PlayArrow as PlayIcon,
    Pause as PauseIcon,
    FreeBreakfast as BreakIcon,
} from '@mui/icons-material';
import type { Task, Project } from '../types';
import { formatDate, formatDuration, getTimeAgo } from '../utils/dateUtils';
import { Timestamp } from 'firebase/firestore';
import { getDeterministicColor } from '../constants/colors';

interface TaskRowProps {
    record: Task;
    project?: Project;
    editingTaskId: string | null;
    editingField: 'timestamp' | 'completedAt' | 'name' | null;
    editingValue: string;
    startEditingTime: (task: Task, field: 'timestamp' | 'completedAt') => void;
    startEditingTaskName: (task: Task) => void;
    saveEditedTime: (id: string) => void;
    saveEditedTaskName: (id: string) => void;
    updateToNow: (id: string, field: 'timestamp' | 'completedAt') => void;
    handleCompleteTask: (id: string) => void;
    handleCompleteAndDuplicateTask: (id: string) => void;
    handleUncompleteTask: (id: string) => void;
    handleDeleteTask: (id: string) => void;
    handleUpdateTask: (id: string, updates: Partial<Task>) => void;
    handleSetTaskActive: (id: string, active: boolean) => void;
    setEditingTaskId: (id: string | null) => void;
    setEditingField: (field: 'timestamp' | 'completedAt' | 'name' | null) => void;
    setEditingValue: (val: string) => void;
}

export const TaskRow: React.FC<TaskRowProps> = ({
    record,
    project,
    editingTaskId,
    editingField,
    editingValue,
    startEditingTime,
    startEditingTaskName,
    saveEditedTime,
    saveEditedTaskName,
    updateToNow,
    handleCompleteTask,
    handleCompleteAndDuplicateTask,
    handleUncompleteTask,
    handleDeleteTask,
    handleUpdateTask,
    handleSetTaskActive,
    setEditingTaskId,
    setEditingField,
    setEditingValue,
}) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const projectColor = project?.color || (project?.id ? getDeterministicColor(project.id) : '#3b82f6');
    const ts = record.timestamp instanceof Timestamp ? record.timestamp.toMillis() : record.timestamp;
    const isTracking = record.isTracking;

    return (
        <TableRow sx={{
            '& td': { borderBottom: '1px solid rgba(255,255,255,0.05)' },
            bgcolor: isTracking ? 'rgba(16, 185, 129, 0.04)' : 'transparent',
            boxShadow: isTracking ? 'inset 2px 0 0 #10b981' : 'none',
            transition: 'all 0.3s ease'
        }}>
            <TableCell sx={{
                width: { xs: 85, sm: 110 },
                p: { xs: 0.5, sm: 1.5 },
                borderLeft: `4px solid ${isTracking ? '#10b981' : projectColor}`,
            }}>

                {editingTaskId === record.id && editingField === 'timestamp' ? (
                    <Stack spacing={0.5}>
                        <TextField
                            type="datetime-local"
                            size="small"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            sx={{ '& .MuiInputBase-input': { fontSize: '11px', p: '4px' } }}
                        />
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                            <IconButton size="small" onClick={() => saveEditedTime(record.id)} sx={{ color: '#10b981', p: 0.2 }}><CheckOutlined sx={{ fontSize: 14 }} /></IconButton>
                            <IconButton size="small" onClick={() => { setEditingTaskId(null); setEditingField(null); }} sx={{ color: '#ef4444', p: 0.2 }}><CloseOutlined sx={{ fontSize: 14 }} /></IconButton>
                        </Stack>
                    </Stack>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box
                            onClick={() => !isTracking && startEditingTime(record, 'timestamp')}
                            sx={{ cursor: (record.completedAt || isTracking) ? 'default' : 'pointer', display: 'flex', flexDirection: 'column' }}
                        >
                            <Typography variant="subtitle2" sx={{ color: isTracking ? '#10b981' : 'var(--text-main)', fontSize: { xs: '12px', sm: '14px' }, lineHeight: 1, fontWeight: isTracking ? 800 : 500 }}>{formatDate(ts, 'HH:mm')}</Typography>
                            <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontSize: '10px' }}>{formatDate(ts, 'MMM DD')}</Typography>
                        </Box>
                        <Stack direction="row" spacing={0.5}>
                            <IconButton
                                size="small"
                                onClick={() => !isTracking && startEditingTime(record, 'timestamp')}
                                disabled={isTracking}
                                sx={{ p: 0.3, opacity: isTracking ? 0.1 : 0.3 }}
                            >
                                <EditOutlined sx={{ fontSize: 10 }} />
                            </IconButton>
                            {!record.completedAt && !isTracking && (
                                <IconButton size="small" onClick={() => updateToNow(record.id, 'timestamp')} sx={{ color: 'var(--text-muted)', p: 0.3 }}><ClockIcon sx={{ fontSize: 12 }} /></IconButton>
                            )}
                        </Stack>
                    </Box>
                )}
            </TableCell>
            <TableCell sx={{ p: { xs: 0.5, sm: 1.5 } }}>
                <Box sx={{ flex: 1 }}>
                    {editingTaskId === record.id && editingField === 'name' ? (
                        <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                            <TextField size="small" fullWidth value={editingValue} onChange={e => setEditingValue(e.target.value)} onKeyPress={e => e.key === 'Enter' && saveEditedTaskName(record.id)} autoFocus />
                            <IconButton onClick={() => saveEditedTaskName(record.id)} sx={{ color: '#10b981' }}><CheckOutlined fontSize="small" /></IconButton>
                            <IconButton onClick={() => { setEditingTaskId(null); setEditingField(null); }} sx={{ color: '#ef4444' }}><CloseOutlined fontSize="small" /></IconButton>
                        </Stack>
                    ) : (
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Typography
                                variant="body1"
                                onClick={() => !isTracking && startEditingTaskName(record)}
                                sx={{
                                    color: record.completedAt ? 'var(--text-muted)' : isTracking ? '#10b981' : 'var(--text-main)',
                                    fontSize: { xs: '13px', sm: '15px' },
                                    fontWeight: isTracking ? 700 : 500,
                                    textDecoration: record.completedAt ? 'line-through' : 'none',
                                    cursor: isTracking ? 'default' : 'pointer',
                                    '&:hover': { color: isTracking ? '#10b981' : 'primary.main' },
                                    wordBreak: 'break-word',
                                    lineHeight: 1.2
                                }}
                            >
                                {record.name}
                                {!isTracking && <EditOutlined sx={{ fontSize: '10px', opacity: 0.3, ml: 1 }} />}
                                {isTracking && (
                                    <Box component="span" sx={{
                                        ml: 1,
                                        px: 0.8,
                                        py: 0.2,
                                        borderRadius: 0.5,
                                        bgcolor: 'rgba(16, 185, 129, 0.2)',
                                        color: '#10b981',
                                        fontSize: '9px',
                                        letterSpacing: '0.5px',
                                        fontWeight: 900
                                    }}>FOCUSING</Box>
                                )}
                            </Typography>
                            <Tooltip title="Copy name">
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(record.name);
                                    }}
                                    sx={{
                                        p: 0.5,
                                        opacity: 0.5,
                                        transition: 'all 0.2s',
                                        '&:hover': { opacity: 1, color: 'primary.main' }
                                    }}
                                >
                                    <ContentCopy sx={{ fontSize: 14 }} />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    )}
                    <Stack direction="row" spacing={1} sx={{ mt: 0.5, alignItems: 'center' }}>
                        {project && (
                            <Chip
                                size="small"
                                label={project.name}
                                variant="outlined"
                                sx={{
                                    fontSize: '10px',
                                    height: 20,
                                    borderColor: projectColor,
                                    color: projectColor,
                                    bgcolor: `${projectColor}1A` // 1A is ~10% opacity in hex
                                }}
                            />
                        )}
                        {record.complexity && (
                            <Chip
                                size="small"
                                label={record.complexity}
                                onClick={() => {
                                    const nextComplexity = record.complexity === 'simple' ? 'complex' : 'simple';
                                    handleUpdateTask(record.id, { complexity: nextComplexity });
                                }}
                                sx={{
                                    fontSize: '10px',
                                    height: 20,
                                    bgcolor: record.complexity === 'complex' ? 'rgba(217, 119, 6, 0.08)' : 'rgba(46, 204, 113, 0.08)',
                                    color: record.complexity === 'complex' ? '#d97706' : '#2ecc71',
                                    border: `1px solid ${record.complexity === 'complex' ? 'rgba(217, 119, 6, 0.2)' : 'rgba(46, 204, 113, 0.2)'}`,
                                    textTransform: 'capitalize',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    '&:hover': {
                                        bgcolor: record.complexity === 'complex' ? 'rgba(217, 119, 6, 0.15)' : 'rgba(46, 204, 113, 0.15)',
                                    }
                                }}
                            />
                        )}
                        {record.duration && <Chip size="small" label={formatDuration(record.duration)} sx={{ fontSize: '10px', height: 20, bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }} />}
                        {record.createdAt && (
                            <Chip
                                size="small"
                                label={record.completedAt ? formatDate(record.createdAt, 'MMM DD HH:mm') : getTimeAgo(record.createdAt)}
                                sx={{
                                    fontSize: '9px',
                                    height: 18,
                                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                                    color: 'var(--text-muted)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            />
                        )}
                    </Stack>
                </Box>
            </TableCell>
            <TableCell align="right" sx={{ width: { xs: 60, sm: 220 }, p: { xs: 0.5, sm: 1.5 } }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.5} alignItems="center" justifyContent="flex-end">
                    {!record.completedAt && (
                        <Tooltip title={isTracking ? "Stop Focusing" : "Start Focusing"}>
                            <IconButton
                                size="small"
                                onClick={() => handleSetTaskActive(record.id, !isTracking)}
                                sx={{
                                    color: isTracking ? '#10b981' : 'var(--text-muted)',
                                    bgcolor: isTracking ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                                    '&:hover': { bgcolor: isTracking ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)' }
                                }}
                            >
                                {isTracking ? <PauseIcon sx={{ fontSize: 20 }} /> : <PlayIcon sx={{ fontSize: 20 }} />}
                            </IconButton>
                        </Tooltip>
                    )}

                    {record.completedAt ? (
                        editingTaskId === record.id && editingField === 'completedAt' ? (
                            <Stack spacing={0.5} alignItems="center">
                                <TextField
                                    type="datetime-local"
                                    size="small"
                                    value={editingValue}
                                    onChange={(e) => setEditingValue(e.target.value)}
                                    sx={{ '& .MuiInputBase-input': { fontSize: '10px', p: '2px' }, width: 140 }}
                                />
                                <Stack direction="row" spacing={0.5}>
                                    <IconButton size="small" onClick={() => saveEditedTime(record.id)} sx={{ color: '#10b981', p: 0.2 }}><CheckOutlined sx={{ fontSize: 14 }} /></IconButton>
                                    <IconButton size="small" onClick={() => { setEditingTaskId(null); setEditingField(null); }} sx={{ color: '#ef4444', p: 0.2 }}><CloseOutlined sx={{ fontSize: 14 }} /></IconButton>
                                </Stack>
                            </Stack>
                        ) : (
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0} alignItems="center">
                                <Button size="small" onClick={() => startEditingTime(record, 'completedAt')} sx={{ color: 'var(--text-muted)', textAlign: 'center', p: 0.3, textTransform: 'none', minWidth: 0 }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <Stack direction="row" spacing={0.3} alignItems="center">
                                            <CheckCircleOutlined sx={{ fontSize: 13, color: '#10b981' }} />
                                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '10px' }}>{formatDate(record.completedAt, 'MMM DD, HH:mm')}</Typography>
                                        </Stack>
                                    </Box>
                                </Button>
                                <IconButton size="small" onClick={() => handleUncompleteTask(record.id)} sx={{ color: 'var(--text-muted)', p: 0.3 }}><UndoOutlined sx={{ fontSize: 14 }} /></IconButton>
                            </Stack>
                        )
                    ) : (
                        <Stack direction="row" spacing={0.5}>
                            <Tooltip title="Complete & Duplicate (Take Break)">
                                <IconButton
                                    size="small"
                                    onClick={() => handleCompleteAndDuplicateTask(record.id)}
                                    sx={{
                                        color: '#d97706',
                                        bgcolor: 'rgba(217, 119, 6, 0.05)',
                                        '&:hover': { bgcolor: 'rgba(217, 119, 6, 0.15)' },
                                        p: 0.5
                                    }}
                                >
                                    <BreakIcon sx={{ fontSize: 20 }} />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Complete Task">
                                <IconButton
                                    size="small"
                                    onClick={() => handleCompleteTask(record.id)}
                                    sx={{
                                        color: 'primary.main',
                                        p: 0.5,
                                        '&:hover': { bgcolor: 'rgba(37, 99, 235, 0.1)' }
                                    }}
                                >
                                    <CheckCircleOutlined sx={{ fontSize: 20 }} />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    )}
                    {!isTracking && (
                        isDeleting ? (
                            <Stack direction="row" spacing={0.5} alignItems="center">
                                <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 600, fontSize: '10px' }}>Confirm?</Typography>
                                <IconButton size="small" onClick={() => handleDeleteTask(record.id)} sx={{ color: 'error.main', p: 0.5 }}><CheckOutlined sx={{ fontSize: 16 }} /></IconButton>
                                <IconButton size="small" onClick={() => setIsDeleting(false)} sx={{ color: 'var(--text-muted)', p: 0.5 }}><CloseOutlined sx={{ fontSize: 16 }} /></IconButton>
                            </Stack>
                        ) : (
                            <IconButton size="small" onClick={() => setIsDeleting(true)} sx={{ color: 'error.main', opacity: 0.5, '&:hover': { opacity: 1 }, p: 0.5 }}><DeleteOutlined sx={{ fontSize: 18 }} /></IconButton>
                        )
                    )}
                </Stack>
            </TableCell>
        </TableRow>
    );
};
