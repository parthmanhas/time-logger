import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Tabs,
  Tab,
  Container,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  AccessTime as ClockIcon,
  Lightbulb as BulbIcon,
  Google as GoogleIcon,
  PlayArrow as PlayIcon,
} from '@mui/icons-material';
import { signInWithPopup, signOut } from 'firebase/auth';
import {
  updateDoc,
  doc,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import dayjs from 'dayjs';

import { db, auth, googleProvider } from './firebase';
import type { Task, Idea, Project } from './types';
import { themes } from './constants/themes';
import { formatDate } from './utils/dateUtils';
import { useTrackerData } from './hooks/useTrackerData';
import { useTrackerActions } from './hooks/useTrackerActions';

import { Header, SettingsMenu } from './components/Header';
import { ProjectSection } from './components/ProjectSection';
import { DurationSummary } from './components/DurationSummary';
import { HistorySection } from './components/HistorySection';
import { IdeasSection } from './components/IdeasSection';
import { TimelineGraph } from './components/TimelineGraph';

const App: React.FC = () => {
  const { user, projects, tasks, ideas, loading } = useTrackerData();
  const actions = useTrackerActions();

  // Local UI State
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(() => localStorage.getItem('isFocusMode') === 'true');
  const [editingProjectName, setEditingProjectName] = useState('');
  const [editingProjectType, setEditingProjectType] = useState<'everyday' | 'finishing'>('everyday');
  const [isRenamingProject, setIsRenamingProject] = useState(false);
  const [newProjectType, setNewProjectType] = useState<'everyday' | 'finishing'>('everyday');

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'timestamp' | 'completedAt' | 'name' | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  const [currentTheme, setCurrentTheme] = useState<string>('default');
  const [ideaContent, setIdeaContent] = useState('');
  const [editingIdeaNotesId, setEditingIdeaNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  const [activeTab, setActiveTab] = useState('1');

  // Filters
  const [taskFilter, setTaskFilter] = useState<string>('pending');
  const [projectFilter, setProjectFilter] = useState<string>(() => localStorage.getItem('projectHistoryFilter') || 'all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [isRecentSorted, setIsRecentSorted] = useState<boolean>(() => localStorage.getItem('isRecentSorted') === 'true');
  const [soloProjectId, setSoloProjectId] = useState<string | null>(null);

  const selectedTheme = themes[currentTheme] || themes.default;

  const muiTheme = useMemo(() => createTheme({
    palette: {
      mode: 'dark',
      primary: { main: selectedTheme.primary },
      background: { default: selectedTheme.background, paper: selectedTheme.paper },
      text: { primary: selectedTheme.text, secondary: selectedTheme.textMuted },
    },
    typography: { fontFamily: 'Inter, sans-serif' },
    shape: { borderRadius: 'var(--border-radius)' as any },
    components: {
      MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } },
      MuiToggleButton: { styleOverrides: { root: { textTransform: 'none' } } },
      MuiCard: { styleOverrides: { root: { backgroundImage: 'none', border: '1px solid rgba(255, 255, 255, 0.1)' } } },
    },
  }), [selectedTheme]);

  useEffect(() => {
    localStorage.setItem('taskHistoryFilter', taskFilter);
    localStorage.setItem('projectHistoryFilter', projectFilter);
    localStorage.setItem('isRecentSorted', String(isRecentSorted));
    localStorage.setItem('isFocusMode', String(isFocusMode));
    document.body.setAttribute('data-theme', currentTheme);
  }, [taskFilter, projectFilter, currentTheme, isRecentSorted, isFocusMode]);

  // Auth
  const handleLogin = async () => {
    try { await signInWithPopup(auth, googleProvider); } catch (error) { console.error('Login error:', error); }
  };
  const handleLogout = async () => {
    try { await signOut(auth); } catch (error) { console.error('Logout error:', error); }
  };

  // Wrapped Actions
  const handleAddTask = (projectId: string, taskName: string, complexity?: 'simple' | 'complex', startTracking: boolean = false) => {
    const nextId = tasks && tasks.length > 0
      ? Math.max(...tasks.map(t => parseInt(t.taskId || '0') || 0)) + 1
      : 1;
    actions.handleAddTask(projectId, taskName, user?.uid, complexity, startTracking, String(nextId));
  };

  const handleCreateProject = async () => {
    const wordCount = newProjectName.trim().split(/\s+/).length;
    if (wordCount > 20) return alert('Project title cannot exceed 20 words');
    const docRef = await actions.handleAddProject(newProjectName, newProjectDescription, user?.uid, newProjectType);
    if (docRef) {
      setSelectedProjectId(docRef.id);
      setNewProjectName('');
      setNewProjectDescription('');
      setIsAddingProject(false);
    }
  };

  const handleUpdateProject = async () => {
    if (!editingProjectName.trim() || !selectedProjectId) return;
    if (editingProjectName.trim().split(/\s+/).length > 20) return alert('Project title cannot exceed 20 words');
    await actions.handleUpdateProject(selectedProjectId, { name: editingProjectName.trim(), projectType: editingProjectType });
    setEditingProjectName('');
    setIsRenamingProject(false);
    setSelectedProjectId(undefined);
  };

  const handleUpdateIdeaNotes = async (id: string) => {
    await actions.handleUpdateIdeaNotes(id, tempNotes);
    setEditingIdeaNotesId(null);
  };

  const handleCreateProjectFromIdea = async (idea: Idea) => {
    const docRef = await actions.handleAddProject(idea.content, idea.notes || '', user?.uid);
    if (docRef) {
      await actions.handleDeleteIdea(idea.id);
      setSelectedProjectId(docRef.id);
      setActiveTab('1');
    }
  };

  const handleToggleFocusMode = (override?: boolean) => {
    const nextValue = typeof override === 'boolean' ? override : !isFocusMode;
    if (nextValue === isFocusMode && !soloProjectId) return;

    setIsFocusMode(nextValue);
    if (!nextValue) setSoloProjectId(null); // Clear solo selection when exiting focus mode
  };

  // Editing logic
  const startEditingTime = (task: Task, field: 'timestamp' | 'completedAt' = 'timestamp') => {
    setEditingTaskId(task.id);
    setEditingField(field);
    const ts = task[field];
    const date = ts instanceof Timestamp ? ts.toDate() : ts;
    setEditingValue(dayjs(date || Date.now()).format('YYYY-MM-DDTHH:mm'));
  };

  const startEditingTaskName = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingField('name');
    setEditingValue(task.name);
  };

  const saveEditedTaskName = async (id: string) => {
    if (!editingValue.trim()) return;
    await updateDoc(doc(db, 'tasks', id), { name: editingValue.trim() });
    setEditingTaskId(null);
    setEditingField(null);
  };

  const saveEditedTime = async (id: string) => {
    if (!editingField) return;
    try {
      const newTimestamp = dayjs(editingValue).valueOf();
      if (isNaN(newTimestamp)) return;
      const taskSnap = await getDoc(doc(db, 'tasks', id));
      if (taskSnap.exists()) {
        const task = taskSnap.data() as Task;
        const updates: any = { [editingField]: newTimestamp };
        const startTime = editingField === 'timestamp' ? newTimestamp : (task.timestamp instanceof Timestamp ? task.timestamp.toMillis() : task.timestamp);
        const endTime = editingField === 'completedAt' ? newTimestamp : (task.completedAt instanceof Timestamp ? task.completedAt.toMillis() : (task.completedAt || null));
        if (startTime && endTime) updates.duration = Number(endTime) - Number(startTime);
        await updateDoc(doc(db, 'tasks', id), updates);
        setEditingTaskId(null);
        setEditingField(null);
      }
    } catch (error) { console.error('Error editing time:', error); }
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
        if (startTime && endTime) updates.duration = Number(endTime) - Number(startTime);
        await updateDoc(doc(db, 'tasks', id), updates);
      }
    } catch (error) { console.error('Error updating time to now:', error); }
  };

  const exportToCSV = async () => {
    if (!tasks || tasks.length === 0) return;
    const projectMap = new Map(projects?.map((p: Project) => [p.id, p.name]));
    const headers = ['Start Time', 'End Time', 'Duration (min)', 'Project', 'Task ID', 'Task'];
    const rows = tasks.map((task: Task) => [
      formatDate(task.timestamp, 'YYYY-MM-DD HH:mm'),
      task.completedAt ? formatDate(task.completedAt, 'YYYY-MM-DD HH:mm') : 'Pending',
      task.duration ? Math.round(task.duration / 60000).toString() : '0',
      projectMap.get(task.projectId) || 'Unknown',
      task.taskId || '',
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

  // Calculations
  const baseFilteredTasks = useMemo(() => {
    if (!tasks) return [];
    const focusedProjectIds = new Set(projects?.filter(p => p.isFocused).map(p => p.id) || []);

    return tasks.filter(task => {
      const statusMatch = taskFilter === 'all' || (taskFilter === 'pending' && !task.completedAt) || (taskFilter === 'completed' && !!task.completedAt);
      const projectMatch = projectFilter === 'all' || task.projectId === projectFilter;
      const focusMatch = !isFocusMode || (soloProjectId ? task.projectId === soloProjectId : focusedProjectIds.has(task.projectId));
      return statusMatch && projectMatch && focusMatch;
    });
  }, [tasks, taskFilter, projectFilter, isFocusMode, projects, soloProjectId]);

  const filteredTasks = useMemo(() => baseFilteredTasks.filter(task => {
    const dateMatch = dateFilter === 'all' || formatDate(task.timestamp, 'YYYY-MM-DD') === dateFilter;
    return dateMatch;
  }).sort((a, b) => {
    // 1. Active task always at the top
    if (a.isTracking) return -1;
    if (b.isTracking) return 1;

    // 2. Pending tasks: Oldest first (based on createdAt)
    if (!a.completedAt && !b.completedAt) {
      const tA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : (a.createdAt as number || 0);
      const tB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : (b.createdAt as number || 0);
      return tA - tB;
    }

    // 3. Completed tasks: Newest first (based on timestamp/startTime)
    const tA = a.timestamp instanceof Timestamp ? a.timestamp.toMillis() : (a.timestamp as number || 0);
    const tB = b.timestamp instanceof Timestamp ? b.timestamp.toMillis() : (b.timestamp as number || 0);
    return tB - tA;
  }), [baseFilteredTasks, dateFilter]);
  const activeTask = useMemo(() => tasks?.find(t => t.isTracking), [tasks]);

  // Auto-exit Focus Mode if no projects are focused
  useEffect(() => {
    if (isFocusMode && !soloProjectId && projects && projects.length > 0 && !projects.some(p => p.isFocused)) {
      setIsFocusMode(false);
    }
  }, [projects, isFocusMode, soloProjectId]);

  const graphTasks = useMemo(() => {
    if (dateFilter !== 'all') return filteredTasks;
    const today = dayjs().format('YYYY-MM-DD');
    return filteredTasks.filter(task => formatDate(task.timestamp, 'YYYY-MM-DD') === today);
  }, [filteredTasks, dateFilter]);

  const totalDurationMillis = useMemo(() => filteredTasks.reduce((acc, task) => acc + (task.duration || 0), 0), [filteredTasks]);

  const dailyTotals = useMemo(() => baseFilteredTasks.reduce((acc: Record<string, number>, task) => {
    const dateStr = formatDate(task.timestamp, 'YYYY-MM-DD');
    acc[dateStr] = (acc[dateStr] || 0) + (task.duration || 0);
    return acc;
  }, {}), [baseFilteredTasks]);

  const projectLastWorkedOn = useMemo(() => {
    const map = new Map<string, number>();
    if (!tasks) return map;
    tasks.forEach(task => {
      const ts = task.completedAt || task.timestamp;
      const millis = ts instanceof Timestamp ? ts.toMillis() : (ts as number || 0);
      const current = map.get(task.projectId) || 0;
      if (millis > current) {
        map.set(task.projectId, millis);
      }
    });
    return map;
  }, [tasks]);

  const projectPendingCounts = useMemo(() => {
    const map = new Map<string, number>();
    if (!tasks) return map;
    tasks.forEach(task => {
      if (!task.completedAt) {
        map.set(task.projectId, (map.get(task.projectId) || 0) + 1);
      }
    });
    return map;
  }, [tasks]);

  const sortedDays = useMemo(() => Object.keys(dailyTotals).sort((a, b) => b.localeCompare(a)).slice(0, 14), [dailyTotals]);

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', background: 'transparent' }}>
        <Container maxWidth="md" sx={{ pt: user && !loading ? { xs: 8, sm: 10 } : 0 }}>
          <Header
            user={user}
            handleLogin={handleLogin}
          />

          {!user ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h2" sx={{ color: 'var(--text-main)', fontSize: { xs: '32px', md: '48px' }, fontWeight: 800, mb: 2, letterSpacing: '-1px' }}>Master Your Time <br /> <Box component="span" sx={{ color: 'primary.main' }}>Without the Clutter.</Box></Typography>
              <Typography variant="h6" sx={{ color: 'var(--text-muted)', maxWidth: '600px', mx: 'auto', mb: 4, fontWeight: 400 }}>Minimalist tracking for busy builders.</Typography>
              <Button variant="contained" size="large" onClick={handleLogin} startIcon={<GoogleIcon />} sx={{ height: '60px', px: 4 }}>Get Started with Google</Button>
            </Box>
          ) : (
            <Box sx={{ width: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
                  <Tab value="1" icon={<ClockIcon />} iconPosition="start" label="Tracker" />
                  <Tab value="2" icon={<BulbIcon />} iconPosition="start" label="Ideas" />
                </Tabs>
                <SettingsMenu
                  user={user}
                  handleLogout={handleLogout}
                  currentTheme={currentTheme}
                  setCurrentTheme={setCurrentTheme}
                />
              </Box>

              {loading && (!projects || projects.length === 0) && (!tasks || tasks.length === 0) ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  {activeTab === '1' && (
                    <Box>
                      <ProjectSection
                        projects={projects}
                        projectLastWorkedOn={projectLastWorkedOn}
                        projectPendingCounts={projectPendingCounts}
                        tasks={tasks || []}
                        isFocusMode={isFocusMode}
                        setIsFocusMode={handleToggleFocusMode}
                        isAddingProject={isAddingProject}
                        setIsAddingProject={setIsAddingProject}
                        newProjectName={newProjectName}
                        setNewProjectName={setNewProjectName}
                        newProjectType={newProjectType}
                        setNewProjectType={setNewProjectType}
                        editingProjectName={editingProjectName}
                        setEditingProjectName={setEditingProjectName}
                        editingProjectType={editingProjectType}
                        setEditingProjectType={setEditingProjectType}
                        newProjectDescription={newProjectDescription}
                        setNewProjectDescription={setNewProjectDescription}
                        handleAddProject={handleCreateProject}
                        handleToggleProjectFocus={actions.handleToggleProjectFocus}
                        isRenamingProject={isRenamingProject}
                        setIsRenamingProject={setIsRenamingProject}
                        selectedProjectId={selectedProjectId}
                        setSelectedProjectId={setSelectedProjectId}
                        handleUpdateProject={handleUpdateProject}
                        handleAddTask={handleAddTask}
                        handleToggleEverydayTask={(projectId: string, date: Date) => actions.handleToggleEverydayTask(projectId, date, user?.uid, tasks || [])}
                        isRecentSorted={isRecentSorted}
                        setIsRecentSorted={setIsRecentSorted}
                        soloProjectId={soloProjectId}
                        setSoloProjectId={setSoloProjectId}
                      />

                      <TimelineGraph tasks={graphTasks} />

                      {filteredTasks.length > 0 && <DurationSummary totalDurationMillis={totalDurationMillis} />}

                      <HistorySection
                        filteredTasks={filteredTasks}
                        taskFilter={taskFilter}
                        setTaskFilter={setTaskFilter}
                        exportToCSV={exportToCSV}
                        projectFilter={projectFilter}
                        setProjectFilter={setProjectFilter}
                        dateFilter={dateFilter}
                        setDateFilter={setDateFilter}
                        projects={projects}
                        sortedDays={sortedDays}
                        dailyTotals={dailyTotals}
                        editingTaskId={editingTaskId}
                        editingField={editingField}
                        editingValue={editingValue}
                        startEditingTime={startEditingTime}
                        startEditingTaskName={startEditingTaskName}
                        saveEditedTime={saveEditedTime}
                        saveEditedTaskName={saveEditedTaskName}
                        updateToNow={updateToNow}
                        handleCompleteTask={actions.handleCompleteTask}
                        handleCompleteAndDuplicateTask={(id: string) => actions.handleCompleteAndDuplicateTask(id, user?.uid)}
                        handleUncompleteTask={actions.handleUncompleteTask}
                        handleDeleteTask={actions.handleDeleteTask}
                        handleUpdateTask={actions.handleUpdateTask}
                        handleSetTaskActive={(id: string, active: boolean) => actions.handleSetTaskActive(id, active, user?.uid, tasks || [])}
                        setEditingTaskId={setEditingTaskId}
                        setEditingField={setEditingField}
                        setEditingValue={setEditingValue}
                      />
                    </Box>
                  )}

                  {activeTab === '2' && (
                    <IdeasSection
                      ideaContent={ideaContent}
                      setIdeaContent={setIdeaContent}
                      handleAddIdea={() => actions.handleAddIdea(ideaContent, user?.uid).then(() => setIdeaContent(''))}
                      ideas={ideas}
                      editingIdeaNotesId={editingIdeaNotesId}
                      setEditingIdeaNotesId={setEditingIdeaNotesId}
                      tempNotes={tempNotes}
                      setTempNotes={setTempNotes}
                      handleUpdateIdeaNotes={handleUpdateIdeaNotes}
                      handleCreateProjectFromIdea={handleCreateProjectFromIdea}
                      handleDeleteIdea={actions.handleDeleteIdea}
                    />
                  )}
                </>
              )}
            </Box>
          )}
        </Container>

        {/* Spacer to prevent content overlap with the sticky top and bottom bars */}
        {user && !loading && <Box sx={{ height: { xs: 80, sm: 120 } }} />}

        {activeTask && user && !loading && (
          <>
            {/* Top Notification */}
            <Box
              sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bgcolor: 'rgba(16, 185, 129, 0.1)',
                backdropFilter: 'blur(15px)',
                borderBottom: '2px solid',
                borderColor: '#10b981',
                py: 2.5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2000,
                boxShadow: '0 10px 40px rgba(16, 185, 129, 0.2)',
                animation: 'popInTop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
                <PlayIcon sx={{ color: '#10b981', fontSize: 32, animation: 'pulse 2s infinite' }} />
                <Typography variant="h4" sx={{
                  color: 'white',
                  fontWeight: 900,
                  letterSpacing: '-0.5px',
                  fontSize: { xs: '20px', sm: '28px' },
                  textShadow: '0 0 20px rgba(16, 185, 129, 0.5)'
                }}>
                  TASK IN PROGRESS
                </Typography>
              </Box>
            </Box>

            {/* Bottom Notification */}
            <Box
              sx={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                bgcolor: 'rgba(16, 185, 129, 0.1)',
                backdropFilter: 'blur(15px)',
                borderTop: '2px solid',
                borderColor: '#10b981',
                py: 2.5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2000,
                boxShadow: '0 -10px 40px rgba(16, 185, 129, 0.2)',
                animation: 'popInBottom 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
                <PlayIcon sx={{ color: '#10b981', fontSize: 32, animation: 'pulse 2s infinite' }} />
                <Typography variant="h4" sx={{
                  color: 'white',
                  fontWeight: 900,
                  letterSpacing: '-0.5px',
                  fontSize: { xs: '20px', sm: '28px' },
                  textShadow: '0 0 20px rgba(16, 185, 129, 0.5)'
                }}>
                  {activeTask.name.toUpperCase()}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', fontSize: '10px' }}>
                Currently tracking your progress. Stay focused.
              </Typography>
            </Box>
          </>
        )}

        {!activeTask && user && !loading && (
          <>
            {/* Top Notification */}
            <Box
              sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bgcolor: 'rgba(211, 47, 47, 0.1)',
                backdropFilter: 'blur(15px)',
                borderBottom: '2px solid',
                borderColor: 'error.main',
                py: 2.5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2000,
                boxShadow: '0 10px 40px rgba(211, 47, 47, 0.2)',
                animation: 'popInTop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                '@keyframes popInTop': {
                  from: { transform: 'translateY(-100%)' },
                  to: { transform: 'translateY(0)' },
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
                <ClockIcon sx={{ color: 'error.main', fontSize: 32, animation: 'pulse 2s infinite' }} />
                <Typography variant="h4" sx={{
                  color: 'white',
                  fontWeight: 900,
                  letterSpacing: '-0.5px',
                  fontSize: { xs: '20px', sm: '28px' },
                  textShadow: '0 0 20px rgba(211, 47, 47, 0.5)'
                }}>
                  NO ACTIVE TASK
                </Typography>
              </Box>
            </Box>

            {/* Bottom Notification */}
            <Box
              sx={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                bgcolor: 'rgba(211, 47, 47, 0.1)',
                backdropFilter: 'blur(15px)',
                borderTop: '2px solid',
                borderColor: 'error.main',
                py: 2.5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2000,
                boxShadow: '0 -10px 40px rgba(211, 47, 47, 0.2)',
                animation: 'popInBottom 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                '@keyframes popInBottom': {
                  from: { transform: 'translateY(100%)' },
                  to: { transform: 'translateY(0)' },
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
                <ClockIcon sx={{ color: 'error.main', fontSize: 32, animation: 'pulse 2s infinite' }} />
                <Typography variant="h4" sx={{
                  color: 'white',
                  fontWeight: 900,
                  letterSpacing: '-0.5px',
                  fontSize: { xs: '20px', sm: '28px' },
                  textShadow: '0 0 20px rgba(211, 47, 47, 0.5)'
                }}>
                  NO ACTIVE TASK
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', fontSize: '10px' }}>
                Select a project and log a task to start tracking
              </Typography>
            </Box>

            <style>
              {`
                @keyframes pulse {
                  0% { transform: scale(1); opacity: 1; }
                  50% { transform: scale(1.1); opacity: 0.8; }
                  100% { transform: scale(1); opacity: 1; }
                }
              `}
            </style>
          </>
        )}
      </Box >
    </ThemeProvider >
  );
};

export default App;
