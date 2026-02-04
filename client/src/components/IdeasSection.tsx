import React from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Stack,
    TextField,
    Button,
    IconButton,
} from '@mui/material';
import {
    History as HistoryIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import type { Idea } from '../types';

interface IdeasSectionProps {
    ideaContent: string;
    setIdeaContent: (val: string) => void;
    handleAddIdea: () => void;
    ideas: Idea[] | undefined;
    editingIdeaNotesId: string | null;
    setEditingIdeaNotesId: (val: string | null) => void;
    tempNotes: string;
    setTempNotes: (val: string) => void;
    handleUpdateIdeaNotes: (id: string) => void;
    handleCreateProjectFromIdea: (idea: Idea) => void;
    handleDeleteIdea: (id: string) => void;
}

export const IdeasSection: React.FC<IdeasSectionProps> = ({
    ideaContent,
    setIdeaContent,
    handleAddIdea,
    ideas,
    editingIdeaNotesId,
    setEditingIdeaNotesId,
    tempNotes,
    setTempNotes,
    handleUpdateIdeaNotes,
    handleCreateProjectFromIdea,
    handleDeleteIdea,
}) => {
    return (
        <Box>
            <Card sx={{ mb: 4, bgcolor: 'background.paper', borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                    <Typography variant="overline" sx={{ color: 'var(--text-muted)', fontWeight: 700, mb: 1, display: 'block' }}>NEW IDEA</Typography>
                    <Stack direction="row" spacing={2}>
                        <TextField fullWidth placeholder="What's your idea?" value={ideaContent} onChange={(e) => setIdeaContent(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddIdea()} />
                        <Button variant="contained" onClick={handleAddIdea} sx={{ px: 4 }}>Save</Button>
                    </Stack>
                </CardContent>
            </Card>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Stored Ideas</Typography>
            <Stack spacing={1.5}>
                {ideas?.map(idea => (
                    <Card key={idea.id} sx={{ bgcolor: 'background.paper', borderRadius: 'var(--border-radius)' }}>
                        <CardContent sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={{ fontWeight: 600 }}>{idea.content}</Typography>
                                {editingIdeaNotesId === idea.id ? (
                                    <Stack spacing={1} sx={{ mt: 1 }}>
                                        <TextField fullWidth size="small" multiline rows={2} value={tempNotes} onChange={(e) => setTempNotes(e.target.value)} autoFocus />
                                        <Stack direction="row" spacing={1}>
                                            <Button size="small" variant="contained" onClick={() => handleUpdateIdeaNotes(idea.id)}>Save</Button>
                                            <Button size="small" variant="text" onClick={() => setEditingIdeaNotesId(null)}>Cancel</Button>
                                        </Stack>
                                    </Stack>
                                ) : (
                                    <Box onClick={() => { setEditingIdeaNotesId(idea.id); setTempNotes(idea.notes || ''); }} sx={{ cursor: 'pointer', mt: 0.5 }}>
                                        {idea.notes ? (
                                            <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>{idea.notes}</Typography>
                                        ) : (
                                            <Typography variant="caption" sx={{ color: 'var(--text-muted)', opacity: 0.5 }}>+ Add notes</Typography>
                                        )}
                                    </Box>
                                )}
                            </Box>
                            <Stack direction="row" spacing={0.5}>
                                <IconButton size="small" onClick={() => handleCreateProjectFromIdea(idea)} sx={{ color: 'primary.main' }} title="Convert to Project"><HistoryIcon fontSize="small" /></IconButton>
                                <IconButton size="small" onClick={() => handleDeleteIdea(idea.id)} sx={{ color: 'error.main' }} title="Delete"><DeleteIcon fontSize="small" /></IconButton>
                            </Stack>
                        </CardContent>
                    </Card>
                ))}
                {(!ideas || ideas.length === 0) && (
                    <Typography sx={{ textAlign: 'center', py: 4, color: 'var(--text-muted)' }}>No ideas yet.</Typography>
                )}
            </Stack>
        </Box>
    );
};
