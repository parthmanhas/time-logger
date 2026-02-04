import React from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Stack,
    Button,
    TextField,
    IconButton,
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
    projectTaskNames: Record<string, string>;
    setProjectTaskNames: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    handleAddTask: (projectId: string) => void;
}

export const ProjectSection: React.FC<ProjectSectionProps> = ({
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
    projectTaskNames,
    setProjectTaskNames,
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
                        <Box key={p.id} sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 1.5, background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)', '&:hover': { borderColor: 'primary.main' } }}>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 120 }}>
                                <IconButton size="small" onClick={() => handleToggleProjectFocus(p.id, !!p.isFocused)} sx={{ color: p.isFocused ? 'primary.main' : 'rgba(255,255,255,0.2)', p: 0.5 }}>
                                    {p.isFocused ? <PushPin fontSize="small" /> : <PushPinOutlined fontSize="small" />}
                                </IconButton>
                                {isRenamingProject && selectedProjectId === p.id ? (
                                    <TextField
                                        size="small"
                                        value={newProjectName}
                                        onChange={(e) => setNewProjectName(e.target.value)}
                                        onBlur={handleRenameProject}
                                        onKeyPress={(e) => e.key === 'Enter' && handleRenameProject()}
                                        autoFocus
                                    />
                                ) : (
                                    <Stack spacing={0.2} sx={{ minWidth: 120 }}>
                                        <Stack direction="row" alignItems="center" spacing={0.5}>
                                            <Typography variant="body2" sx={{ fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }} onClick={() => setSelectedProjectId(p.id)}>{p.name}</Typography>
                                            <IconButton size="small" onClick={() => { setSelectedProjectId(p.id); setNewProjectName(p.name); setIsRenamingProject(true); }} sx={{ p: 0.2, opacity: 0.3 }}><EditOutlined sx={{ fontSize: 12 }} /></IconButton>
                                        </Stack>
                                        {p.description && <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontSize: '10px' }}>{p.description}</Typography>}
                                    </Stack>
                                )}
                            </Stack>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="What are you doing?"
                                value={projectTaskNames[p.id] || ''}
                                onChange={(e) => setProjectTaskNames(prev => ({ ...prev, [p.id]: e.target.value }))}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddTask(p.id)}
                                sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(0,0,0,0.1)' } }}
                            />
                            <Button variant="contained" onClick={() => handleAddTask(p.id)} sx={{ minWidth: '40px', p: 1 }}><PlusIcon /></Button>
                        </Box>
                    ))}
                </Stack>
            </CardContent>
        </Card>
    );
};
