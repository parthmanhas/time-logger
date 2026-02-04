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
} from '@mui/material';
import {
  AccessTime as ClockIcon,
  Lightbulb as BulbIcon,
  Google as GoogleIcon,
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

const App: React.FC = () => {
  const { user, projects, tasks, ideas } = useTrackerData();
  const actions = useTrackerActions();

  // Local UI State
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

  // Filters
  const [taskFilter, setTaskFilter] = useState<string>(() => localStorage.getItem('taskHistoryFilter') || 'all');
  const [projectFilter, setProjectFilter] = useState<string>(() => localStorage.getItem('projectHistoryFilter') || 'all');
  const [dateFilter, setDateFilter] = useState<string>('all');

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
      MuiCard: { styleOverrides: { root: { backgroundImage: 'none', border: '1px solid rgba(255, 255, 255, 0.1)' } } },
    },
  }), [selectedTheme]);

  useEffect(() => {
    localStorage.setItem('taskHistoryFilter', taskFilter);
    localStorage.setItem('projectHistoryFilter', projectFilter);
    document.body.setAttribute('data-theme', currentTheme);
  }, [taskFilter, projectFilter, currentTheme]);

  // Auth
  const handleLogin = async () => {
    try { await signInWithPopup(auth, googleProvider); } catch (error) { console.error('Login error:', error); }
  };
  const handleLogout = async () => {
    try { await signOut(auth); } catch (error) { console.error('Logout error:', error); }
  };

  // Wrapped Actions
  const handleAddTask = (projectId: string) => {
    actions.handleAddTask(projectId, projectTaskNames[projectId], user?.uid);
    setProjectTaskNames(prev => ({ ...prev, [projectId]: '' }));
  };

  const handleCreateProject = async () => {
    const wordCount = newProjectName.trim().split(/\s+/).length;
    if (wordCount > 20) return alert('Project title cannot exceed 20 words');
    const docRef = await actions.handleAddProject(newProjectName, newProjectDescription, user?.uid);
    if (docRef) {
      setSelectedProjectId(docRef.id);
      setNewProjectName('');
      setNewProjectDescription('');
      setIsAddingProject(false);
    }
  };

  const handleRenameProject = async () => {
    if (!newProjectName.trim() || !selectedProjectId) return;
    if (newProjectName.trim().split(/\s+/).length > 20) return alert('Project title cannot exceed 20 words');
    await actions.handleRenameProject(selectedProjectId, newProjectName);
    setNewProjectName('');
    setIsRenamingProject(false);
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

  // Editing logic
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
    if (!editingValue.trim()) return;
    await updateDoc(doc(db, 'tasks', id), { name: editingValue.trim() });
    setEditingTaskId(null);
    setEditingField(null);
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

  // Calculations
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
  const dailyTotals = baseFilteredTasks.reduce((acc: Record<string, number>, task) => {
    const dateStr = formatDate(task.timestamp, 'YYYY-MM-DD');
    acc[dateStr] = (acc[dateStr] || 0) + (task.duration || 0);
    return acc;
  }, {});
  const sortedDays = Object.keys(dailyTotals).sort((a, b) => b.localeCompare(a)).slice(0, 14);

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', background: 'transparent' }}>
        <Container maxWidth="md">
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

              {activeTab === '1' && (
                <Box>
                  <ProjectSection
                    projects={projects}
                    isFocusMode={isFocusMode}
                    setIsFocusMode={setIsFocusMode}
                    isAddingProject={isAddingProject}
                    setIsAddingProject={setIsAddingProject}
                    newProjectName={newProjectName}
                    setNewProjectName={setNewProjectName}
                    newProjectDescription={newProjectDescription}
                    setNewProjectDescription={setNewProjectDescription}
                    handleAddProject={handleCreateProject}
                    handleToggleProjectFocus={actions.handleToggleProjectFocus}
                    isRenamingProject={isRenamingProject}
                    setIsRenamingProject={setIsRenamingProject}
                    selectedProjectId={selectedProjectId}
                    setSelectedProjectId={setSelectedProjectId}
                    handleRenameProject={handleRenameProject}
                    projectTaskNames={projectTaskNames}
                    setProjectTaskNames={setProjectTaskNames}
                    handleAddTask={handleAddTask}
                  />

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
                    handleUncompleteTask={actions.handleUncompleteTask}
                    handleDeleteTask={actions.handleDeleteTask}
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
            </Box>
          )}
        </Container>
      </Box >
    </ThemeProvider >
  );
};

export default App;
