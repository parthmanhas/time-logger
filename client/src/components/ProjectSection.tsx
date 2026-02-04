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
} from '@mui/material';
import {
    Add as PlusIcon,
    Visibility,
    VisibilityOff,
    PushPin,
    PushPinOutlined,
    EditOutlined,
} from '@mui/icons-material';
import type { Project } from '../types';

interface ProjectRowProps {
    project: Project;
    handleToggleProjectFocus: (id: string, isFocused: boolean) => void;
    isRenamingProject: boolean;
    selectedProjectId: string | undefined;
    setSelectedProjectId: (val: string | undefined) => void;
    newProjectName: string;
    setNewProjectName: (val: string) => void;
    handleRenameProject: () => void;
    handleAddTask: (projectId: string, taskName: string) => void;
    setIsRenamingProject: (val: boolean) => void;
}

const ProjectRow = memo(({
    project,
    handleToggleProjectFocus,
    isRenamingProject,
    selectedProjectId,
    setSelectedProjectId,
    newProjectName,
    setNewProjectName,
    handleRenameProject,
    handleAddTask,
    setIsRenamingProject,
}: ProjectRowProps) => {
    const [taskName, setTaskName] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);

    const onAddTask = () => {
        if (!taskName.trim()) return;
        handleAddTask(project.id, taskName);
        setTaskName('');
    };

    return (
        <Box sx={{ display: 'flex', gap: { xs: 1, sm: 1.5 }, alignItems: 'center', p: { xs: '4px 8px', sm: '6px 12px' }, background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)', '&:hover': { borderColor: 'primary.main' } }}>
            <Box
                sx={{
                    width: isExpanded ? { xs: 'auto', sm: 140 } : { xs: 80, sm: 140 },
                    maxWidth: isExpanded ? { xs: 150, sm: 140 } : { xs: 80, sm: 140 },
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease'
                }}
            >
                <IconButton
                    size="small"
                    onClick={() => handleToggleProjectFocus(project.id, !!project.isFocused)}
                    sx={{ color: project.isFocused ? 'primary.main' : 'rgba(255,255,255,0.2)', p: 0.2, mr: 0.5, flexShrink: 0 }}
                >
                    {project.isFocused ? <PushPin sx={{ fontSize: { xs: 12, sm: 16 } }} /> : <PushPinOutlined sx={{ fontSize: { xs: 12, sm: 16 } }} />}
                </IconButton>
                {isRenamingProject && selectedProjectId === project.id ? (
                    <TextField
                        size="small"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        onBlur={handleRenameProject}
                        onKeyPress={(e) => e.key === 'Enter' && handleRenameProject()}
                        autoFocus
                        sx={{ flex: 1, '& .MuiInputBase-input': { py: 0.3, px: 0.5, fontSize: '12px' } }}
                    />
                ) : (
                    <Box
                        sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}
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
                                    lineHeight: 1.1
                                }}
                            >
                                {project.name}
                            </Typography>
                        </Tooltip>
                        <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); setSelectedProjectId(project.id); setNewProjectName(project.name); setIsRenamingProject(true); }}
                            sx={{ p: 0.1, opacity: 0.3, ml: 0.2, flexShrink: 0 }}
                        >
                            <EditOutlined sx={{ fontSize: 9 }} />
                        </IconButton>
                    </Box>
                )}
            </Box>
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
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                        '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                        '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                    },
                    '& .MuiInputBase-input': {
                        py: 0,
                        fontSize: { xs: '12px', sm: '13px' },
                        px: 1
                    }
                }}
            />
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
    newProjectDescription: string;
    setNewProjectDescription: (val: string) => void;
    handleAddProject: () => void;
    handleToggleProjectFocus: (id: string, isFocused: boolean) => void;
    isRenamingProject: boolean;
    setIsRenamingProject: (val: boolean) => void;
    selectedProjectId: string | undefined;
    setSelectedProjectId: (val: string | undefined) => void;
    handleRenameProject: () => void;
    handleAddTask: (projectId: string, taskName: string) => void;
}

export const ProjectSection: React.FC<ProjectSectionProps> = memo(({
    projects,
    isFocusMode,
    setIsFocusMode,
    isAddingProject,
    setIsAddingProject,
    newProjectName,
    setNewProjectName,
    newProjectDescription,
    setNewProjectDescription,
    handleAddProject,
    handleToggleProjectFocus,
    isRenamingProject,
    setIsRenamingProject,
    selectedProjectId,
    setSelectedProjectId,
    handleRenameProject,
    handleAddTask,
}) => {
    return (
        <Card sx={{ mb: 4, bgcolor: 'background.paper', borderRadius: 'var(--border-radius)' }}>
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
                    <Typography variant="overline" sx={{ color: 'var(--text-muted)', fontWeight: 700, letterSpacing: 1 }}>PROJECTS & LOGGING</Typography>
                    <Stack direction="row" spacing={1}>
                        {projects?.some(p => p.isFocused) && (
                            <Button size="small" startIcon={isFocusMode ? <Visibility /> : <VisibilityOff />} onClick={() => setIsFocusMode(!isFocusMode)} sx={{ color: isFocusMode ? 'primary.main' : 'var(--text-muted)', fontSize: '12px' }}>{isFocusMode ? 'Show All' : 'Focus'}</Button>
                        )}
                        <Button size="small" onClick={() => setIsAddingProject(!isAddingProject)} sx={{ color: 'primary.main', fontWeight: 700, fontSize: '12px' }}>{isAddingProject ? 'Cancel' : '+ New'}</Button>
                    </Stack>
                </Box>
                {isAddingProject && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Project name (max 20 words)"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                        />
                        <TextField
                            fullWidth
                            size="small"
                            multiline
                            rows={2}
                            placeholder="Project description"
                            value={newProjectDescription}
                            onChange={(e) => setNewProjectDescription(e.target.value)}
                        />
                        <Button variant="contained" onClick={handleAddProject} fullWidth startIcon={<PlusIcon />}>Create Project</Button>
                    </Box>
                )}
                <Stack spacing={1.5}>
                    {projects?.filter(p => !isFocusMode || p.isFocused).map((p) => (
                        <ProjectRow
                            key={p.id}
                            project={p}
                            handleToggleProjectFocus={handleToggleProjectFocus}
                            isRenamingProject={isRenamingProject}
                            selectedProjectId={selectedProjectId}
                            setSelectedProjectId={setSelectedProjectId}
                            newProjectName={newProjectName}
                            setNewProjectName={setNewProjectName}
                            handleRenameProject={handleRenameProject}
                            handleAddTask={handleAddTask}
                            setIsRenamingProject={setIsRenamingProject}
                        />
                    ))}
                </Stack>
            </CardContent>
        </Card >
    );
});
