import React from 'react';
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
} from '@mui/material';
import {
    CheckOutlined,
    CloseOutlined,
    UndoOutlined,
    CheckCircleOutlined,
    DeleteOutlined,
    EditOutlined,
    AccessTime as ClockIcon,
} from '@mui/icons-material';
import type { Task, Project } from '../types';
import { formatDate, formatDuration } from '../utils/dateUtils';
import { Timestamp } from 'firebase/firestore';

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
    handleUncompleteTask: (id: string) => void;
    handleDeleteTask: (id: string) => void;
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
    handleUncompleteTask,
    handleDeleteTask,
    setEditingTaskId,
    setEditingField,
    setEditingValue,
}) => {
    const ts = record.timestamp instanceof Timestamp ? record.timestamp.toMillis() : record.timestamp;

    return (
        <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
            <TableCell sx={{ width: { xs: 85, sm: 110 }, p: { xs: 0.5, sm: 1.5 } }}>
                {editingTaskId === record.id && editingField === 'timestamp' ? (
                    <Stack spacing={0.5}>
                        <Typography variant="caption" sx={{ fontSize: '12px' }}>{formatDate(record.timestamp, 'HH:mm')}</Typography>
                        <Stack direction="row" spacing={0.5}>
                            <IconButton size="small" onClick={() => saveEditedTime(record.id)} sx={{ color: '#10b981', p: 0.2 }}><CheckOutlined sx={{ fontSize: 14 }} /></IconButton>
                            <IconButton size="small" onClick={() => { setEditingTaskId(null); setEditingField(null); }} sx={{ color: '#ef4444', p: 0.2 }}><CloseOutlined sx={{ fontSize: 14 }} /></IconButton>
                        </Stack>
                    </Stack>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box onClick={() => startEditingTime(record, 'timestamp')} sx={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="subtitle2" sx={{ color: 'var(--text-main)', fontSize: { xs: '12px', sm: '14px' }, lineHeight: 1 }}>{formatDate(ts, 'HH:mm')}</Typography>
                            <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontSize: '10px' }}>{formatDate(ts, 'MMM DD')}</Typography>
                        </Box>
                        <Stack direction="row" spacing={0.5}>
                            <IconButton size="small" onClick={() => startEditingTime(record, 'timestamp')} sx={{ p: 0.3, opacity: 0.3 }}><EditOutlined sx={{ fontSize: 10 }} /></IconButton>
                            <IconButton size="small" onClick={() => updateToNow(record.id, 'timestamp')} sx={{ color: 'var(--text-muted)', p: 0.3 }}><ClockIcon sx={{ fontSize: 12 }} /></IconButton>
                        </Stack>
                    </Box>
                )}
            </TableCell>
            <TableCell sx={{ p: { xs: 0.5, sm: 1.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ flex: 1 }}>
                        {editingTaskId === record.id && editingField === 'name' ? (
                            <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                                <TextField size="small" fullWidth value={editingValue} onChange={e => setEditingValue(e.target.value)} onKeyPress={e => e.key === 'Enter' && saveEditedTaskName(record.id)} autoFocus />
                                <IconButton onClick={() => saveEditedTaskName(record.id)} sx={{ color: '#10b981' }}><CheckOutlined fontSize="small" /></IconButton>
                                <IconButton onClick={() => { setEditingTaskId(null); setEditingField(null); }} sx={{ color: '#ef4444' }}><CloseOutlined fontSize="small" /></IconButton>
                            </Stack>
                        ) : (
                            <Typography variant="body1" onClick={() => startEditingTaskName(record)} sx={{ color: record.completedAt ? 'var(--text-muted)' : 'var(--text-main)', fontSize: { xs: '13px', sm: '15px' }, fontWeight: 500, textDecoration: record.completedAt ? 'line-through' : 'none', cursor: 'pointer', '&:hover': { color: 'primary.main' }, wordBreak: 'break-word', lineHeight: 1.2 }}>
                                {record.name}
                                <EditOutlined sx={{ fontSize: '10px', opacity: 0.3, ml: 1 }} />
                            </Typography>
                        )}
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                            {project && <Chip size="small" label={project.name} variant="outlined" sx={{ fontSize: '10px', height: 20, borderColor: 'primary.main', color: 'primary.main' }} />}
                            {record.duration && <Chip size="small" label={formatDuration(record.duration)} sx={{ fontSize: '10px', height: 20, bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }} />}
                        </Stack>
                    </Box>
                    <Box>
                        {record.completedAt ? (
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Button size="small" onClick={() => startEditingTime(record, 'completedAt')} sx={{ color: 'var(--text-muted)', textAlign: 'left', p: 0.5, textTransform: 'none' }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                            <CheckCircleOutlined sx={{ fontSize: 13, color: '#10b981' }} />
                                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'var(--text-main)' }}>{formatDate(record.completedAt, 'HH:mm')}</Typography>
                                        </Stack>
                                        <Typography sx={{ fontSize: '9px', opacity: 0.7, ml: 2.2 }}>{formatDate(record.completedAt, 'MMM DD')}</Typography>
                                    </Box>
                                </Button>
                                <IconButton size="small" onClick={() => handleUncompleteTask(record.id)} sx={{ color: 'var(--text-muted)' }}><UndoOutlined fontSize="small" /></IconButton>
                            </Stack>
                        ) : (
                            <Button size="small" onClick={() => handleCompleteTask(record.id)} sx={{ color: 'primary.main', minWidth: 0, p: 0.5 }}><CheckCircleOutlined fontSize="small" /></Button>
                        )}
                    </Box>
                </Box>
            </TableCell>
            <TableCell align="right" sx={{ width: { xs: 40, sm: 50 }, p: { xs: 0.5, sm: 1.5 } }}>
                <IconButton size="small" onClick={() => handleDeleteTask(record.id)} sx={{ color: 'error.main', opacity: 0.5, '&:hover': { opacity: 1 }, p: 0.5 }}><DeleteOutlined sx={{ fontSize: 18 }} /></IconButton>
            </TableCell>
        </TableRow>
    );
};
