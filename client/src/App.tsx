import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  Stack,
  Card,
  CardContent,
  Chip,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Select,
  MenuItem,
  Tabs,
  Tab,
  IconButton,
  Container,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Add as PlusIcon,
  Download as DownloadIcon,
  AccessTime as ClockIcon,
  Delete as DeleteIcon,
  Lightbulb as BulbIcon,
  Google as GoogleIcon,
  Logout as LogoutIcon,
  Person as UserIcon,
  History as HistoryIcon,
  CheckOutlined,
  CloseOutlined,
  UndoOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  PushPinOutlined,
  PushPin,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useCollection } from 'react-firebase-hooks/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { signInWithPopup, signOut } from 'firebase/auth';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  getDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import dayjs from 'dayjs';
import { db, auth, googleProvider } from './firebase';
import type { Task, Idea, Project } from './types';

const formatDate = (ts: Timestamp | number | undefined, format: string) => {
  if (!ts) return 'Pending...';
  const date = ts instanceof Timestamp ? ts.toDate() : ts;
  return dayjs(date).format(format);
};

const themes: Record<string, any> = {
  default: {
    primary: '#2563eb',
    background: '#0f172a',
    paper: '#1e293b',
    text: '#f8fafc',
    textMuted: '#94a3b8',
  },
  midnight: {
    primary: '#8b5cf6',
    background: '#000000',
    paper: '#111111',
    text: '#f8fafc',
    textMuted: '#94a3b8',
  },
  emerald: {
    primary: '#10b981',
    background: '#064e3b',
    paper: '#065f46',
    text: '#f8fafc',
    textMuted: '#94a3b8',
  },
  rose: {
    primary: '#e11d48',
    background: '#4c0519',
    paper: '#881337',
    text: '#f8fafc',
    textMuted: '#94a3b8',
  },
};

const App: React.FC = () => {
  const [user] = useAuthState(auth);
  const [projectTaskNames, setProjectTaskNames] = useState<Record<string, string>>({});
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isRenamingProject, setIsRenamingProject] = useState(false);

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'timestamp' | 'completedAt' | 'name' | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [editingDateValue, setEditingDateValue] = useState<dayjs.Dayjs | null>(null);

  const [currentTheme, setCurrentTheme] = useState<string>('default');
  const [ideaContent, setIdeaContent] = useState('');
  const [editingIdeaNotesId, setEditingIdeaNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  const [activeTab, setActiveTab] = useState('1');

  const selectedTheme = themes[currentTheme] || themes.default;

  const muiTheme = useMemo(() => createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: selectedTheme.primary,
      },
      background: {
        default: selectedTheme.background,
        paper: selectedTheme.paper,
      },
      text: {
        primary: selectedTheme.text,
        secondary: selectedTheme.textMuted,
      },
    },
    typography: {
      fontFamily: 'Inter, sans-serif',
    },
    shape: {
      borderRadius: 'var(--border-radius)' as any,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
        },
      },
    },
  }), [selectedTheme]);

  const [taskFilter, setTaskFilter] = useState<string>(() => {
    return localStorage.getItem('taskHistoryFilter') || 'all';
  });
  const [projectFilter, setProjectFilter] = useState<string>(() => {
    return localStorage.getItem('projectHistoryFilter') || 'all';
  });
  const [dateFilter, setDateFilter] = useState<string>('all');

  const [projectsSnapshot] = useCollection(
    user ? query(collection(db, 'projects'), orderBy('createdAt', 'desc')) : null
  );
  const projects = projectsSnapshot?.docs.map(doc => ({ ...doc.data(), id: doc.id } as Project));

  const [tasksSnapshot] = useCollection(
    user ? query(collection(db, 'tasks'), orderBy('timestamp', 'desc')) : null
  );
  const tasks = tasksSnapshot?.docs.map(doc => ({ ...doc.data(), id: doc.id } as Task));

  const [ideasSnapshotRaw] = useCollection(
    user ? query(collection(db, 'ideas'), orderBy('createdAt', 'desc')) : null
  );
  const ideas = ideasSnapshotRaw?.docs.map(doc => ({ ...doc.data(), id: doc.id } as Idea));

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    localStorage.setItem('taskHistoryFilter', taskFilter);
  }, [taskFilter]);

  useEffect(() => {
    localStorage.setItem('projectHistoryFilter', projectFilter);
  }, [projectFilter]);

  useEffect(() => {
    document.body.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  const handleAddTask = async (projectId: string) => {
    if (!user) return;
    const currentTaskName = projectTaskNames[projectId] || '';
    if (!currentTaskName.trim()) return;

    try {
      await addDoc(collection(db, 'tasks'), {
        name: currentTaskName,
        projectId: projectId,
        timestamp: serverTimestamp(),
      });
      setProjectTaskNames(prev => ({ ...prev, [projectId]: '' }));
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleAddProject = async () => {
    if (!user || !newProjectName.trim()) return;

    const wordCount = newProjectName.trim().split(/\s+/).length;
    if (wordCount > 20) {
      alert('Project title cannot exceed 20 words');
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'projects'), {
        name: newProjectName,
        description: newProjectDescription,
        createdAt: serverTimestamp(),
      });
      setSelectedProjectId(docRef.id);
      setNewProjectName('');
      setNewProjectDescription('');
      setIsAddingProject(false);
    } catch (error) {
      console.error('Error adding project:', error);
    }
  };

  const handleToggleProjectFocus = async (id: string, isFocused: boolean) => {
    try {
      await updateDoc(doc(db, 'projects', id), { isFocused: !isFocused });
    } catch (error) {
      console.error('Error toggling project focus:', error);
    }
  };

  const handleRenameProject = async () => {
    if (!newProjectName.trim() || !selectedProjectId) return;
    const wordCount = newProjectName.trim().split(/\s+/).length;
    if (wordCount > 20) {
      alert('Project title cannot exceed 20 words');
      return;
    }

    try {
      await updateDoc(doc(db, 'projects', selectedProjectId), {
        name: newProjectName,
      });
      setNewProjectName('');
      setIsRenamingProject(false);
    } catch (error) {
      console.error('Error renaming project:', error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleCompleteTask = async (id: string) => {
    try {
      const now = Date.now();
      const taskSnap = await getDoc(doc(db, 'tasks', id));
      if (taskSnap.exists()) {
        const task = taskSnap.data() as Task;
        const startTs = task.timestamp instanceof Timestamp ? task.timestamp.toMillis() : task.timestamp;
        await updateDoc(doc(db, 'tasks', id), {
          completedAt: now,
          duration: now - startTs
        });
      }
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const handleUncompleteTask = async (id: string) => {
    try {
      await updateDoc(doc(db, 'tasks', id), {
        completedAt: null,
        duration: null
      });
    } catch (error) {
      console.error('Error uncompleting task:', error);
    }
  };

  const handleAddIdea = async () => {
    if (!user || !ideaContent.trim()) return;
    try {
      await addDoc(collection(db, 'ideas'), {
        content: ideaContent,
        createdAt: serverTimestamp(),
      });
      setIdeaContent('');
    } catch (error) {
      console.error('Error adding idea:', error);
    }
  };

  const handleUpdateIdeaNotes = async (id: string) => {
    try {
      await updateDoc(doc(db, 'ideas', id), { notes: tempNotes });
      setEditingIdeaNotesId(null);
    } catch (error) {
      console.error('Error updating idea notes:', error);
    }
  };

  const handleDeleteIdea = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'ideas', id));
    } catch (error) {
      console.error('Error deleting idea:', error);
    }
  };

  const handleCreateProjectFromIdea = async (idea: Idea) => {
    if (!user) return;
    try {
      const docRef = await addDoc(collection(db, 'projects'), {
        name: idea.content,
        description: idea.notes || '',
        createdAt: serverTimestamp(),
      });
      await deleteDoc(doc(db, 'ideas', idea.id));
      setSelectedProjectId(docRef.id);
      setActiveTab('1');
    } catch (error) {
      console.error('Error creating project from idea:', error);
    }
  };

  const startEditingTime = (task: Task, field: 'timestamp' | 'completedAt' = 'timestamp') => {
    setEditingTaskId(task.id);
    setEditingField(field);
    const ts = task[field];
    const date = ts instanceof Timestamp ? ts.toDate() : ts;
    setEditingValue(dayjs(date || Date.now()).format('HH:mm'));
    setEditingDateValue(dayjs(date || Date.now()));
  };

  const startEditingTaskName = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingField('name');
    setEditingValue(task.name);
  };

  const saveEditedTaskName = async (id: string) => {
    try {
      if (!editingValue.trim()) return;
      await updateDoc(doc(db, 'tasks', id), { name: editingValue.trim() });
      setEditingTaskId(null);
      setEditingField(null);
    } catch (error) {
      console.error('Error updating task name:', error);
    }
  };

  const saveEditedTime = async (id: string) => {
    if (!editingField) return;
    try {
      const parts = editingValue.split(':').map(Number);
      if (parts.length < 2 || parts.some(isNaN)) return;
      const [h, m] = parts;

      const taskSnap = await getDoc(doc(db, 'tasks', id));
      if (taskSnap.exists()) {
        const task = taskSnap.data() as Task;
        const baseDate = editingDateValue || dayjs();
        const newTimestamp = baseDate.hour(h).minute(m).second(0).valueOf();

        const updates: any = { [editingField]: newTimestamp };
        const startTime = editingField === 'timestamp' ? newTimestamp : (task.timestamp instanceof Timestamp ? task.timestamp.toMillis() : task.timestamp);
        const endTime = editingField === 'completedAt' ? newTimestamp : (task.completedAt instanceof Timestamp ? task.completedAt.toMillis() : (task.completedAt || null));

        if (startTime && endTime) {
          updates.duration = endTime - startTime;
        }

        await updateDoc(doc(db, 'tasks', id), updates);
        setEditingTaskId(null);
        setEditingField(null);
      }
    } catch (error) {
      console.error('Error editing time:', error);
    }
  };

  const updateToNow = async (id: string, field: 'timestamp' | 'completedAt' = 'timestamp') => {
    try {
      const now = Date.now();
      const taskSnap = await getDoc(doc(db, 'tasks', id));
      if (taskSnap.exists()) {
        const task = taskSnap.data() as Task;
        const updates: any = { [field]: now };
        const startTime = field === 'timestamp' ? now : (task.timestamp instanceof Timestamp ? task.timestamp.toMillis() : task.timestamp);
        const endTime = field === 'completedAt' ? now : (task.completedAt instanceof Timestamp ? task.completedAt.toMillis() : (task.completedAt || null));

        if (startTime && endTime) {
          updates.duration = endTime - startTime;
        }
        await updateDoc(doc(db, 'tasks', id), updates);
      }
    } catch (error) {
      console.error('Error updating time to now:', error);
    }
  };

  const exportToCSV = async () => {
    if (!tasks || tasks.length === 0) return;
    const projectMap = new Map(projects?.map((p: Project) => [p.id, p.name]));
    const headers = ['Start Time', 'End Time', 'Duration (min)', 'Project', 'Task'];
    const rows = tasks.map((task: Task) => [
      formatDate(task.timestamp, 'YYYY-MM-DD HH:mm'),
      task.completedAt ? formatDate(task.completedAt, 'YYYY-MM-DD HH:mm') : 'Pending',
      task.duration ? Math.round(task.duration / 60000).toString() : '0',
      projectMap.get(task.projectId) || 'Unknown',
      task.name
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `time-log-${dayjs().format('YYYY-MM-DD-HHmm')}.csv`;
    link.click();
  };

  const baseFilteredTasks = tasks?.filter(task => {
    const statusMatch = taskFilter === 'all' || (taskFilter === 'pending' && !task.completedAt) || (taskFilter === 'completed' && !!task.completedAt);
    const projectMatch = projectFilter === 'all' || task.projectId === projectFilter;
    return statusMatch && projectMatch;
  }) || [];

  const filteredTasks = baseFilteredTasks.filter(task => {
    const dateMatch = dateFilter === 'all' || formatDate(task.timestamp, 'YYYY-MM-DD') === dateFilter;
    return dateMatch;
  }).sort((a, b) => {
    const tA = a.timestamp instanceof Timestamp ? a.timestamp.toMillis() : (a.timestamp as number || 0);
    const tB = b.timestamp instanceof Timestamp ? b.timestamp.toMillis() : (b.timestamp as number || 0);
    return tB - tA;
  });

  const totalDurationMillis = filteredTasks.reduce((acc, task) => acc + (task.duration || 0), 0);

  const formatTotalDuration = (ms: number) => {
    const mins = Math.floor(ms / (1000 * 60));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h === 0 && m === 0 ? '0m' : `${h > 0 ? `${h}h ` : ''}${m}m`;
  };

  const dailyTotals = baseFilteredTasks.reduce((acc: Record<string, number>, task) => {
    const dateStr = formatDate(task.timestamp, 'YYYY-MM-DD');
    acc[dateStr] = (acc[dateStr] || 0) + (task.duration || 0);
    return acc;
  }, {});

  const sortedDays = Object.keys(dailyTotals).sort((a, b) => b.localeCompare(a)).slice(0, 14);

  const TaskRow = ({ record }: { record: Task }) => {
    const project = projects?.find((p: Project) => p.id === record.projectId);
    const ts = record.timestamp instanceof Timestamp ? record.timestamp.toMillis() : record.timestamp;

    const formatDuration = (ms: number) => {
      const mins = Math.floor(ms / (1000 * 60));
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${h > 0 ? `${h}h ` : ''}${m}m`;
    };

    return (
      <TableRow key={record.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
        <TableCell sx={{ minWidth: 100 }}>
          {editingTaskId === record.id && editingField === 'timestamp' ? (
            <Stack spacing={1}>
              <Typography variant="caption">{formatDate(record.timestamp, 'HH:mm')}</Typography>
              <Stack direction="row" spacing={1}>
                <IconButton size="small" onClick={() => saveEditedTime(record.id)} sx={{ color: '#10b981' }}><CheckOutlined fontSize="small" /></IconButton>
                <IconButton size="small" onClick={() => { setEditingTaskId(null); setEditingField(null); }} sx={{ color: '#ef4444' }}><CloseOutlined fontSize="small" /></IconButton>
              </Stack>
            </Stack>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, borderRadius: 'var(--border-radius)' }}>
              <Box onClick={() => startEditingTime(record, 'timestamp')} sx={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle2" sx={{ color: 'var(--text-main)', fontSize: '14px', lineHeight: 1 }}>{formatDate(ts, 'HH:mm')}</Typography>
                <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontSize: '11px' }}>{formatDate(ts, 'MMM DD')}</Typography>
              </Box>
              <IconButton size="small" onClick={() => startEditingTime(record, 'timestamp')} sx={{ p: 0.5, opacity: 0.3 }}><EditOutlined sx={{ fontSize: 10 }} /></IconButton>
              <Button size="small" onClick={() => updateToNow(record.id, 'timestamp')} sx={{ color: 'var(--text-muted)', fontSize: '12px', minWidth: 0, p: 0.5 }}>Now</Button>
            </Box>
          )}
        </TableCell>
        <TableCell sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              {editingTaskId === record.id && editingField === 'name' ? (
                <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                  <TextField size="small" fullWidth value={editingValue} onChange={e => setEditingValue(e.target.value)} onKeyPress={e => e.key === 'Enter' && saveEditedTaskName(record.id)} autoFocus />
                  <IconButton onClick={() => saveEditedTaskName(record.id)} sx={{ color: '#10b981' }}><CheckOutlined fontSize="small" /></IconButton>
                  <IconButton onClick={() => { setEditingTaskId(null); setEditingField(null); }} sx={{ color: '#ef4444' }}><CloseOutlined fontSize="small" /></IconButton>
                </Stack>
              ) : (
                <Typography variant="body1" onClick={() => startEditingTaskName(record)} sx={{ color: record.completedAt ? 'var(--text-muted)' : 'var(--text-main)', fontSize: '15px', fontWeight: 500, textDecoration: record.completedAt ? 'line-through' : 'none', cursor: 'pointer', '&:hover': { color: 'primary.main' } }}>
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
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>Ended {formatDate(record.completedAt, 'HH:mm')}</Typography>
                      <Typography sx={{ fontSize: '9px', opacity: 0.7 }}>{formatDate(record.completedAt, 'MMM DD')}</Typography>
                    </Box>
                  </Button>
                  <IconButton size="small" onClick={() => handleUncompleteTask(record.id)} sx={{ color: 'var(--text-muted)' }}><UndoOutlined fontSize="small" /></IconButton>
                </Stack>
              ) : (
                <Button size="small" variant="outlined" onClick={() => handleCompleteTask(record.id)} sx={{ color: 'primary.main', minWidth: 0, p: 0.5 }}><CheckCircleOutlined fontSize="small" /></Button>
              )}
            </Box>
          </Box>
        </TableCell>
        <TableCell align="right" sx={{ width: 50 }}>
          <IconButton size="small" onClick={() => handleDeleteTask(record.id)} sx={{ color: 'error.main', opacity: 0.5, '&:hover': { opacity: 1 } }}><DeleteOutlined fontSize="small" /></IconButton>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', background: 'transparent' }}>
        <Container maxWidth="md" sx={{ py: 5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
            {user ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip icon={<UserIcon />} label={user.displayName || user.email} variant="outlined" sx={{ borderRadius: 'var(--border-radius)', px: 1.5, background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} />
                <Button variant="text" startIcon={<LogoutIcon />} onClick={handleLogout} sx={{ color: 'var(--text-muted)' }}>Logout</Button>
              </Stack>
            ) : (
              <Button variant="contained" startIcon={<GoogleIcon />} onClick={handleLogin} sx={{ borderRadius: 'var(--border-radius)' }}>Login with Google</Button>
            )}
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontWeight: 600 }}>THEME</Typography>
              <Select value={currentTheme} onChange={(e) => setCurrentTheme(e.target.value)} size="small" sx={{ width: 120, height: 32 }}>
                <MenuItem value="default">Slate</MenuItem>
                <MenuItem value="midnight">Midnight</MenuItem>
                <MenuItem value="emerald">Emerald</MenuItem>
                <MenuItem value="rose">Rose</MenuItem>
              </Select>
            </Stack>
          </Box>

          {!user ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h2" sx={{ color: 'var(--text-main)', fontSize: { xs: '32px', md: '48px' }, fontWeight: 800, mb: 2, letterSpacing: '-1px' }}>Master Your Time <br /> <Box component="span" sx={{ color: 'primary.main' }}>Without the Clutter.</Box></Typography>
              <Typography variant="h6" sx={{ color: 'var(--text-muted)', maxWidth: '600px', mx: 'auto', mb: 4, fontWeight: 400 }}>Minimalist tracking for busy builders.</Typography>
              <Button variant="contained" size="large" onClick={handleLogin} startIcon={<GoogleIcon />} sx={{ height: '60px', px: 4 }}>Get Started with Google</Button>
            </Box>
          ) : (
            <Box sx={{ width: '100%' }}>
              <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tab value="1" icon={<ClockIcon />} iconPosition="start" label="Tracker" />
                <Tab value="2" icon={<BulbIcon />} iconPosition="start" label="Ideas" />
              </Tabs>

              {activeTab === '1' && (
                <Box>
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

                  {filteredTasks.length > 0 && (
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
                  )}

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
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '11px' }}>TIME</TableCell>
                          <TableCell sx={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '11px' }}>TASK</TableCell>
                          <TableCell align="right" sx={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '11px' }} />
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredTasks.length > 0 ? (
                          filteredTasks.map(task => <TaskRow key={task.id} record={task} />)
                        ) : (
                          <TableRow><TableCell colSpan={3} sx={{ py: 6, textAlign: 'center', color: 'var(--text-muted)' }}>No logs found.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {activeTab === '2' && (
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
              )}
            </Box>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default App;
