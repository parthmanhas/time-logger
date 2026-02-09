import React, { useState, memo } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Stack,
    Button,
    TextField,
    IconButton,
    Tooltip,
    ToggleButtonGroup,
    ToggleButton as MuiToggleButton,
} from '@mui/material';
import {
    Add as PlusIcon,
    Visibility,
    VisibilityOff,
    PushPin,
    PushPinOutlined,
    EditOutlined,
    Check,
    Close,
    Sort,
    PlayArrow as PlayIcon,
} from '@mui/icons-material';
import { Timestamp } from 'firebase/firestore';
import dayjs from 'dayjs';
import type { Project, Task } from '../types';
import { getDeterministicColor } from '../constants/colors';
import { getTimeAgo } from '../utils/dateUtils';

interface ProjectRowProps {
    project: Project;
    handleToggleProjectFocus: (id: string, isFocused: boolean) => void;
    isRenamingProject: boolean;
    selectedProjectId: string | undefined;
    setSelectedProjectId: (val: string | undefined) => void;
    editingProjectName: string;
    setEditingProjectName: (val: string) => void;
    editingProjectType: 'everyday' | 'finishing';
    setEditingProjectType: (val: 'everyday' | 'finishing') => void;
    handleUpdateProject: () => void;
    handleAddTask: (projectId: string, taskName: string, complexity?: 'simple' | 'complex', startTracking?: boolean) => void;
    handleToggleEverydayTask: (projectId: string, date: Date) => void;
    setIsRenamingProject: (val: boolean) => void;
    lastWorkedOn?: number;
    pendingCount?: number;
    tasks: Task[];
}

const EverydayHeatmap = ({ tasks, onToggle }: { tasks: Task[], onToggle: (date: Date) => void }) => {
    const today = dayjs().startOf('day');
    const days = [];
    for (let i = 29; i >= 0; i--) {
        days.push(today.subtract(i, 'day'));
    }

    const tasksOnDaySymbol = (date: dayjs.Dayjs) => {
        return tasks.some(t => {
            const taskDate = dayjs(t.timestamp instanceof Timestamp ? t.timestamp.toDate() : t.timestamp);
            return taskDate.isSame(date, 'day');
        });
    };

    return (
        <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(15, 2fr)',
            gap: 0.75,
            flexShrink: 0,
            alignItems: 'center',
            maxWidth: 'fit-content'
        }}>
            {days.map(day => {
                const isActive = tasksOnDaySymbol(day);
                const isToday = day.isSame(today, 'day');
                return (
                    <Tooltip key={day.toISOString()} title={day.format('MMM D')}>
                        <Box
                            onClick={() => onToggle(day.toDate())}
                            sx={{
                                width: { xs: 10, sm: 12 },
                                height: { xs: 10, sm: 12 },
                                bgcolor: isActive ? 'primary.main' : 'rgba(255,255,255,0.05)',
                                borderRadius: '2px',
                                border: isToday ? '2px solid #fff' : 'none',
                                cursor: 'pointer',
                                transition: 'all 0.1s',
                                '&:hover': {
                                    bgcolor: isActive ? 'primary.dark' : 'rgba(255,255,255,0.2)',
                                    transform: 'scale(1.2)',
                                    zIndex: 1
                                }
                            }}
                        />
                    </Tooltip>
                );
            })}
        </Box>
    );
};

const ProjectRow = memo(({
    project,
    handleToggleProjectFocus,
    isRenamingProject,
    selectedProjectId,
    setSelectedProjectId,
    editingProjectName,
    setEditingProjectName,
    editingProjectType,
    setEditingProjectType,
    handleUpdateProject,
    handleAddTask,
    handleToggleEverydayTask,
    setIsRenamingProject,
    lastWorkedOn,
    pendingCount,
    tasks,
}: ProjectRowProps) => {
    const [taskName, setTaskName] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [complexity, setComplexity] = useState<'simple' | 'complex'>('simple');

    const onAddTask = () => {
        if (!taskName.trim()) return;
        handleAddTask(project.id, taskName, complexity);
        setTaskName('');
    };

    const toggleComplexity = () => {
        setComplexity(prev => prev === 'simple' ? 'complex' : 'simple');
    };

    const projectColor = project.color || getDeterministicColor(project.id);

    return (
        <Box sx={{
            display: 'flex',
            gap: { xs: 1, sm: 1.5 },
            alignItems: 'center',
            p: { xs: '4px 8px', sm: '6px 12px' },
            background: 'rgba(0,0,0,0.2)',
            borderRadius: 'var(--border-radius)',
            border: '1px solid',
            borderColor: 'var(--border-color)',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'rgba(255,255,255,0.03)',
                transform: 'translateX(2px)'
            }
        }}>
            <Box
                sx={{
                    width: project.projectType === 'everyday' ? 'auto' : { xs: 80, sm: 140 },
                    flex: project.projectType === 'everyday' ? 1 : 'none',
                    minWidth: 0,
                    display: 'flex',
                    alignItems: 'center',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease'
                }}
            >
                <IconButton
                    size="small"
                    onClick={() => handleToggleProjectFocus(project.id, !!project.isFocused)}
                    sx={{ color: project.isFocused ? projectColor : 'rgba(255,255,255,0.2)', p: 0.2, mr: 1, flexShrink: 0 }}
                >
                    {project.isFocused ? <PushPin sx={{ fontSize: { xs: 12, sm: 16 } }} /> : <PushPinOutlined sx={{ fontSize: { xs: 12, sm: 16 } }} />}
                </IconButton>
                {isRenamingProject && selectedProjectId === project.id ? (
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <TextField
                                size="small"
                                value={editingProjectName}
                                onChange={(e) => setEditingProjectName(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleUpdateProject()}
                                autoFocus
                                sx={{ flex: 1, '& .MuiInputBase-input': { py: 0.3, px: 0.5, fontSize: '11px' } }}
                            />
                            <IconButton size="small" onClick={handleUpdateProject} sx={{ p: 0.2, color: 'success.main' }}>
                                <Check sx={{ fontSize: 16 }} />
                            </IconButton>
                            <IconButton size="small" onClick={() => setIsRenamingProject(false)} sx={{ p: 0.2, color: 'error.main' }}>
                                <Close sx={{ fontSize: 16 }} />
                            </IconButton>
                        </Box>
                        <ToggleButtonGroup
                            value={editingProjectType}
                            exclusive
                            onChange={(_, val) => val && setEditingProjectType(val)}
                            size="small"
                            sx={{ height: 20, '& .MuiToggleButton-root': { py: 0, px: 1, fontSize: '8px' } }}
                        >
                            <MuiToggleButton value="everyday">Everyday</MuiToggleButton>
                            <MuiToggleButton value="finishing">Finishing</MuiToggleButton>
                        </ToggleButtonGroup>
                    </Box>
                ) : (
                    <>
                        <Box
                            sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            <Tooltip title={project.name} disableHoverListener={isExpanded}>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        '&:hover': { textDecoration: 'underline' },
                                        whiteSpace: isExpanded ? 'normal' : 'nowrap',
                                        overflow: isExpanded ? 'visible' : 'hidden',
                                        textOverflow: isExpanded ? 'clip' : 'ellipsis',
                                        fontSize: { xs: '11px', sm: '13px' },
                                        wordBreak: 'break-word',
                                        lineHeight: 1.1,
                                        mb: lastWorkedOn ? 0.2 : 0
                                    }}
                                >
                                    {project.name}
                                </Typography>
                            </Tooltip>
                            {project.projectType && (
                                <Typography
                                    variant="caption"
                                    sx={{
                                        fontSize: '7px',
                                        fontWeight: 800,
                                        textTransform: 'uppercase',
                                        color: project.projectType === 'everyday' ? '#3b82f6' : '#ec4899',
                                        bgcolor: project.projectType === 'everyday' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(236, 72, 153, 0.1)',
                                        px: 0.5,
                                        borderRadius: '2px',
                                        width: 'fit-content',
                                        mb: 0.2,
                                        lineHeight: 1.2
                                    }}
                                >
                                    {project.projectType}
                                </Typography>
                            )}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {lastWorkedOn && (
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            fontSize: { xs: '8px', sm: '9px' },
                                            color: 'var(--text-muted)',
                                            opacity: 0.7,
                                            lineHeight: 1
                                        }}
                                    >
                                        {getTimeAgo(lastWorkedOn)}
                                    </Typography>
                                )}
                                {pendingCount ? (
                                    <Box
                                        sx={{
                                            bgcolor: 'primary.main',
                                            color: 'white',
                                            fontSize: { xs: '8px', sm: '9px' },
                                            fontWeight: 800,
                                            px: 0.6,
                                            borderRadius: '10px',
                                            minWidth: 14,
                                            height: 14,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: '0 0 5px rgba(0,0,0,0.3)'
                                        }}
                                    >
                                        {pendingCount}
                                    </Box>
                                ) : null}
                            </Box>
                        </Box>
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProjectId(project.id);
                                setEditingProjectName(project.name);
                                setEditingProjectType(project.projectType || 'everyday');
                                setIsRenamingProject(true);
                            }}
                            sx={{ p: 0.1, opacity: 0.3, ml: 0.2, flexShrink: 0 }}
                        >
                            <EditOutlined sx={{ fontSize: 9 }} />
                        </IconButton>
                        {project.projectType === 'everyday' && (
                            <Tooltip title="Start project task">
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddTask(project.id, project.name, 'simple', true);
                                    }}
                                    sx={{
                                        p: 0.5,
                                        ml: 0.5,
                                        color: 'primary.main',
                                        bgcolor: 'rgba(37, 99, 235, 0.1)',
                                        '&:hover': { bgcolor: 'rgba(37, 99, 235, 0.2)' }
                                    }}
                                >
                                    <PlayIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                            </Tooltip>
                        )}
                    </>
                )}
            </Box>
            {project.projectType === 'everyday' ? (
                <>
                    <Box sx={{ flex: 1 }} />
                    <EverydayHeatmap
                        tasks={tasks.filter(t => t.projectId === project.id)}
                        onToggle={(date) => handleToggleEverydayTask(project.id, date)}
                    />
                </>
            ) : (
                <>
                    <TextField
                        size="small"
                        placeholder="What are you doing?"
                        value={taskName}
                        onChange={(e) => setTaskName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && onAddTask()}
                        sx={{
                            flex: 1,
                            minWidth: 0,
                            '& .MuiOutlinedInput-root': {
                                bgcolor: 'rgba(255,255,255,0.05)',
                                height: { xs: 26, sm: 32 },
                                cursor: 'text',
                                '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                                '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                            },
                            '& .MuiInputBase-input': {
                                py: 0,
                                fontSize: { xs: '12px', sm: '13px' },
                                px: 1,
                                cursor: 'text',
                                caretColor: 'primary.main'
                            }
                        }}
                    />
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={toggleComplexity}
                        sx={{
                            minWidth: { xs: 50, sm: 70 },
                            height: { xs: 24, sm: 28 },
                            fontSize: { xs: '9px', sm: '11px' },
                            p: 0,
                            borderColor: complexity === 'complex' ? 'rgba(217, 119, 6, 0.3)' : 'rgba(46, 204, 113, 0.2)',
                            color: complexity === 'complex' ? '#d97706' : '#2ecc71',
                            '&:hover': {
                                borderColor: complexity === 'complex' ? 'rgba(217, 119, 6, 0.5)' : 'rgba(46, 204, 113, 0.4)',
                                bgcolor: complexity === 'complex' ? 'rgba(217, 119, 6, 0.05)' : 'rgba(46, 204, 113, 0.05)'
                            }
                        }}
                    >
                        {complexity}
                    </Button>
                    <IconButton
                        onClick={onAddTask}
                        sx={{
                            bgcolor: 'primary.main',
                            color: 'white',
                            width: { xs: 24, sm: 28 },
                            height: { xs: 24, sm: 28 },
                            borderRadius: '4px',
                            '&:hover': { bgcolor: 'primary.dark' },
                            p: 0
                        }}
                    >
                        <PlusIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
                    </IconButton>
                </>
            )}
        </Box>
    );
});

interface ProjectSectionProps {
    projects: Project[] | undefined;
    isFocusMode: boolean;
    setIsFocusMode: (val: boolean) => void;
    isAddingProject: boolean;
    setIsAddingProject: (val: boolean) => void;
    newProjectName: string;
    setNewProjectName: (val: string) => void;
    newProjectType: 'everyday' | 'finishing';
    setNewProjectType: (val: 'everyday' | 'finishing') => void;
    editingProjectName: string;
    setEditingProjectName: (val: string) => void;
    editingProjectType: 'everyday' | 'finishing';
    setEditingProjectType: (val: 'everyday' | 'finishing') => void;
    newProjectDescription: string;
    setNewProjectDescription: (val: string) => void;
    handleAddProject: () => void;
    handleToggleProjectFocus: (id: string, isFocused: boolean) => void;
    isRenamingProject: boolean;
    setIsRenamingProject: (val: boolean) => void;
    selectedProjectId: string | undefined;
    setSelectedProjectId: (val: string | undefined) => void;
    handleUpdateProject: () => void;
    handleAddTask: (projectId: string, taskName: string, complexity?: 'simple' | 'complex', startTracking?: boolean) => void;
    handleToggleEverydayTask: (projectId: string, date: Date) => void;
    projectLastWorkedOn: Map<string, number>;
    projectPendingCounts: Map<string, number>;
    tasks: Task[];
    isRecentSorted: boolean;
    setIsRecentSorted: (val: boolean) => void;
}

export const ProjectSection: React.FC<ProjectSectionProps> = memo(({
    projects,
    isFocusMode,
    setIsFocusMode,
    isAddingProject,
    setIsAddingProject,
    newProjectName,
    setNewProjectName,
    newProjectType,
    setNewProjectType,
    editingProjectName,
    setEditingProjectName,
    editingProjectType,
    setEditingProjectType,
    newProjectDescription,
    setNewProjectDescription,
    handleAddProject,
    handleToggleProjectFocus,
    isRenamingProject,
    setIsRenamingProject,
    selectedProjectId,
    setSelectedProjectId,
    handleUpdateProject,
    handleAddTask,
    handleToggleEverydayTask,
    projectLastWorkedOn,
    projectPendingCounts,
    tasks,
    isRecentSorted,
    setIsRecentSorted,
}) => {
    const sortProjects = (list: Project[]) => {
        if (!isRecentSorted) {
            return [...list].sort((a, b) => {
                const timeA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : (a.createdAt as number || 0);
                const timeB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : (b.createdAt as number || 0);
                return timeA - timeB;
            });
        }
        return [...list].sort((a, b) => {
            const timeA = projectLastWorkedOn.get(a.id) || 0;
            const timeB = projectLastWorkedOn.get(b.id) || 0;
            return timeB - timeA;
        });
    };

    const everydayProjects = sortProjects(projects?.filter(p => (!isFocusMode || p.isFocused) && (!p.projectType || p.projectType === 'everyday')) || []);
    const finishingProjects = sortProjects(projects?.filter(p => (!isFocusMode || p.isFocused) && p.projectType === 'finishing') || []);

    const renderProjectList = (title: string, list: Project[]) => (
        <Box sx={{ mb: 3 }}>
            <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontWeight: 800, mb: 1.5, display: 'block', letterSpacing: 1, opacity: 0.6 }}>
                {title} ({list.length})
            </Typography>
            <Stack spacing={1.5}>
                {list.length > 0 ? (
                    list.map((p) => (
                        <ProjectRow
                            key={p.id}
                            project={p}
                            handleToggleProjectFocus={handleToggleProjectFocus}
                            isRenamingProject={isRenamingProject}
                            setIsRenamingProject={setIsRenamingProject}
                            selectedProjectId={selectedProjectId}
                            setSelectedProjectId={setSelectedProjectId}
                            editingProjectName={editingProjectName}
                            setEditingProjectName={setEditingProjectName}
                            editingProjectType={editingProjectType}
                            setEditingProjectType={setEditingProjectType}
                            handleUpdateProject={handleUpdateProject}
                            handleAddTask={handleAddTask}
                            handleToggleEverydayTask={handleToggleEverydayTask}
                            lastWorkedOn={projectLastWorkedOn.get(p.id)}
                            pendingCount={projectPendingCounts.get(p.id)}
                            tasks={tasks || []}
                        />
                    ))
                ) : (
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.1)', fontStyle: 'italic', pl: 1 }}>
                        {isFocusMode ? "No pinned projects in this category" : "No projects in this category"}
                    </Typography>
                )}
            </Stack>
        </Box>
    );

    return (
        <Card sx={{ mb: 4, bgcolor: 'background.paper', borderRadius: 'var(--border-radius)' }}>
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
                    <Typography variant="overline" sx={{ color: 'var(--text-muted)', fontWeight: 700, letterSpacing: 1 }}>PROJECTS & LOGGING</Typography>
                    <Stack direction="row" spacing={1}>
                        {(isFocusMode || projects?.some(p => p.isFocused)) && (
                            <Button size="small" startIcon={isFocusMode ? <Visibility /> : <VisibilityOff />} onClick={() => setIsFocusMode(!isFocusMode)} sx={{ color: isFocusMode ? 'primary.main' : 'var(--text-muted)', fontSize: '12px' }}>{isFocusMode ? 'Show All' : 'Focus'}</Button>
                        )}
                        <Button
                            size="small"
                            startIcon={<Sort />}
                            onClick={() => setIsRecentSorted(!isRecentSorted)}
                            sx={{ color: isRecentSorted ? 'primary.main' : 'var(--text-muted)', fontSize: '12px' }}
                        >
                            Sort: {isRecentSorted ? 'Recent' : 'Oldest'}
                        </Button>
                        <Button size="small" onClick={() => setIsAddingProject(!isAddingProject)} sx={{ color: 'primary.main', fontWeight: 700, fontSize: '12px' }}>{isAddingProject ? 'Cancel' : '+ New'}</Button>
                    </Stack>
                </Box>
                {isAddingProject && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3, p: 2, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 1, border: '1px dashed rgba(255,255,255,0.1)' }}>
                        <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontWeight: 600 }}>NEW PROJECT PREVIEW</Typography>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Project name (max 20 words)"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            sx={{ '& .MuiInputBase-input': { cursor: 'text', caretColor: 'primary.main' } }}
                        />
                        <TextField
                            fullWidth
                            size="small"
                            multiline
                            rows={2}
                            placeholder="Project description"
                            value={newProjectDescription}
                            onChange={(e) => setNewProjectDescription(e.target.value)}
                            sx={{ '& .MuiInputBase-input': { cursor: 'text', caretColor: 'primary.main' } }}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontWeight: 600 }}>TYPE:</Typography>
                            <ToggleButtonGroup
                                value={newProjectType}
                                exclusive
                                onChange={(_, val) => val && setNewProjectType(val)}
                                size="small"
                            >
                                <MuiToggleButton value="everyday">Everyday</MuiToggleButton>
                                <MuiToggleButton value="finishing">Finishing</MuiToggleButton>
                            </ToggleButtonGroup>
                        </Box>
                        <Button
                            variant="contained"
                            onClick={handleAddProject}
                            fullWidth
                            startIcon={<PlusIcon />}
                            sx={{ mt: 1, transition: 'all 0.2s', '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' } }}
                        >
                            Create Project
                        </Button>
                    </Box>
                )}
                {renderProjectList("EVERYDAY PROJECTS", everydayProjects)}
                {renderProjectList("CAN BE FINISHED", finishingProjects)}
            </CardContent>
        </Card >
    );
});
