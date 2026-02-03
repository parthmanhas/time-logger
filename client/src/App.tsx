import React, { useState, useEffect } from 'react';
import {
  Layout,
  Typography,
  Table,
  Input,
  Button,
  Space,
  Card,
  Tag,
  message,
  ConfigProvider,
  theme,
  Select,
  Tabs,
  Tour,
  Alert,
  Tooltip
} from 'antd';
import type { TourProps } from 'antd';
import {
  PlusOutlined,
  DownloadOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  CheckCircleOutlined,
  UndoOutlined,
  BulbOutlined,
  GoogleOutlined,
  LogoutOutlined,
  UserOutlined,
  RocketOutlined,
  InfoCircleOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  PushpinOutlined,
  PushpinFilled
} from '@ant-design/icons';
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
import type { Task, Idea, Project, FirestoreDate } from './types';

const { Content } = Layout;
const { Title, Text } = Typography;

const formatDate = (ts: Timestamp | number | undefined, format: string) => {
  if (!ts) return 'Pending...';
  const date = ts instanceof Timestamp ? ts.toDate() : ts;
  return dayjs(date).format(format);
};

// No static fake data anymore, using state for dynamic demo

const App: React.FC = () => {
  const [user] = useAuthState(auth);
  const [projectTaskNames, setProjectTaskNames] = useState<Record<string, string>>({});
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);
  const [newProjectName, setNewProjectName] = useState('');
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isRenamingProject, setIsRenamingProject] = useState(false);

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'timestamp' | 'completedAt' | 'name' | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [currentTheme, setCurrentTheme] = useState<string>('default');
  const [ideaContent, setIdeaContent] = useState('');
  const [editingIdeaNotesId, setEditingIdeaNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [currentTourStep, setCurrentTourStep] = useState(0);

  // Demo state for Tutorial
  const [demoProjects, setDemoProjects] = useState<Project[]>([]);
  const [demoTasks, setDemoTasks] = useState<Task[]>([]);
  const [demoIdeas, setDemoIdeas] = useState<Idea[]>([]);
  const [activeTab, setActiveTab] = useState('1');
  const [taskFilter, setTaskFilter] = useState<string>(() => {
    return localStorage.getItem('taskHistoryFilter') || 'all';
  });


  const tourRefs = {
    projects: React.useRef<HTMLDivElement>(null),
    projectsTitle: React.useRef<HTMLDivElement>(null),
    history: React.useRef<HTMLDivElement>(null),
    ideas: React.useRef<HTMLDivElement>(null),
    login: React.useRef<any>(null),
    nowButton: React.useRef<any>(null),
    complete: React.useRef<any>(null),
    ideaInput: React.useRef<any>(null),
    ideaStore: React.useRef<HTMLDivElement>(null),
    ideaNoteBtn: React.useRef<any>(null),
    pencil: React.useRef<any>(null),
    eduAlert: React.useRef<HTMLDivElement>(null),
    rename: React.useRef<any>(null),
    export: React.useRef<any>(null),
    deleteRow: React.useRef<any>(null),
    rocketBtn: React.useRef<any>(null),
  };

  const [projectsSnapshot, loadingProjects, errorProjects] = useCollection(
    user ? query(collection(db, 'projects'), orderBy('createdAt', 'desc')) : null
  );
  const projects = user
    ? projectsSnapshot?.docs.map(doc => ({ ...doc.data(), id: doc.id } as Project))
    : demoProjects;

  const [tasksSnapshot, loadingTasks, errorTasks] = useCollection(
    user ? query(collection(db, 'tasks'), orderBy('timestamp', 'desc')) : null
  );
  const tasks = user
    ? tasksSnapshot?.docs.map(doc => ({ ...doc.data(), id: doc.id } as Task))
    : demoTasks;

  const [ideasSnapshotRaw, loadingIdeas, errorIdeas] = useCollection(
    query(collection(db, 'ideas'), orderBy('createdAt', 'desc'))
  );
  const ideasSnapshot = ideasSnapshotRaw as { docs: { data: () => Idea; id: string }[] } | undefined;
  const ideas = user
    ? ideasSnapshot?.docs.map(doc => ({ ...doc.data(), id: doc.id } as Idea))
    : demoIdeas;

  // Show errors from firebase
  useEffect(() => {
    const error = errorProjects || errorTasks || errorIdeas;
    if (error) {
      console.error('Firestore error:', error);
      if (error.code === 'permission-denied') {
        message.error('Access denied. Please check your login.');
      } else {
        message.error('Data error: ' + error.message);
      }
    }
  }, [errorProjects, errorTasks, errorIdeas]);

  const tourSteps: TourProps['steps'] = [
    {
      title: 'Welcome',
      description: 'You are in educational mode. Features unlock as you go.',
      target: () => tourRefs.eduAlert.current,
    },
    {
      title: 'Projects',
      description: 'Group your work into project categories.',
      target: () => tourRefs.projectsTitle.current,
    },
    {
      title: 'Log Task',
      description: 'Enter what you are doing and click Log to start tracking.',
      target: () => tourRefs.projects.current,
    },
    {
      title: 'History',
      description: 'See every session you have logged in a clean timeline.',
      target: () => tourRefs.history.current,
    },
    {
      title: 'Edit Time',
      description: 'Click the pencil to manually adjust timestamps if needed.',
      target: () => tourRefs.pencil.current,
    },
    {
      title: 'Sync Time',
      description: 'Hit "Now" to reset the start time to the current moment.',
      target: () => tourRefs.nowButton.current,
    },
    {
      title: 'Finish Task',
      description: 'Click "Complete" to stop the timer and save the session.',
      target: () => tourRefs.complete.current,
    },
    {
      title: 'Delete Task',
      description: 'Remove mistakes or old entries with a single click.',
      target: () => tourRefs.deleteRow.current,
    },
    {
      title: 'Export',
      description: 'Download your entire time history as a CSV file.',
      target: () => tourRefs.export.current,
    },
    {
      title: 'Rename',
      description: 'Click to change project names whenever you need to.',
      target: () => tourRefs.rename.current,
    },
    {
      title: 'Explore Ideas',
      description: 'Switch to the Ideas tab to store quick notes and future plans.',
      target: () => tourRefs.ideas.current,
    },
    {
      title: 'Quick Capture',
      description: 'Jot down business ideas or future tasks here.',
      target: () => tourRefs.ideaInput.current,
    },
    {
      title: 'Idea Log',
      description: 'Your stored ideas appear here in a clean list.',
      target: () => tourRefs.ideaStore.current,
    },
    {
      title: 'Add Detail',
      description: 'Expand any idea with detailed notes and plans.',
      target: () => tourRefs.ideaNoteBtn.current,
    },
    {
      title: 'Project Conversion',
      description: 'Liking an idea? Turn it into a real project with one click.',
      target: () => tourRefs.rocketBtn.current,
    },
    {
      title: 'Save Data',
      description: 'Login with Google to sync your logs across all devices.',
      target: () => tourRefs.login.current,
    },
  ];

  const handleTourChange = (current: number) => {
    setCurrentTourStep(current);

    // Tab Management
    if (current >= 11 && current <= 14) {
      setActiveTab('2'); // Ideas content
    } else {
      setActiveTab('1'); // Tracker
    }

    // Demo Data Management (Cumulative)
    const newDemoProjects = current >= 1 ? [{ id: 'demo-p1', name: (current >= 9 ? 'Work' : 'Personal'), createdAt: Date.now() }] : [];
    const newDemoTasks = (current >= 2 && current <= 9) ? [{ id: 'demo-t1', projectId: 'demo-p1', name: 'UI Design', timestamp: Date.now() - 3600000 }] : [];
    const newDemoIdeas = (current >= 11 && current <= 14) ? [{ id: 'demo-i1', content: 'New App Concept', createdAt: Date.now() }] : [];

    setDemoProjects(newDemoProjects);
    setDemoTasks(newDemoTasks);
    setDemoIdeas(newDemoIdeas);

    if (newDemoProjects.length > 0) {
      setSelectedProjectId('demo-p1');
    } else {
      setSelectedProjectId(undefined);
    }
  };

  const startTutorial = () => {
    setDemoProjects([]);
    setDemoTasks([]);
    setDemoIdeas([]);
    setCurrentTourStep(0);
    setIsTourOpen(true);
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      message.success('Logged in successfully');
    } catch (error) {
      console.error('Login error:', error);
      message.error('Failed to login');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      message.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      message.error('Failed to logout');
    }
  };

  useEffect(() => {
    localStorage.setItem('taskHistoryFilter', taskFilter);
  }, [taskFilter]);

  useEffect(() => {
    document.body.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);


  useEffect(() => {
    if (projects && projects.length > 0 && selectedProjectId === undefined) {
      const firstId = projects[0].id;
      setTimeout(() => setSelectedProjectId(firstId), 0);
    }
  }, [projects, selectedProjectId]);

  const handleAddTask = async (projectId: string) => {
    if (!user) {
      message.error('Please login to add tasks');
      return;
    }
    const currentTaskName = projectTaskNames[projectId] || '';
    if (!currentTaskName.trim()) {
      message.error('Please enter a task name');
      return;
    }

    try {
      await addDoc(collection(db, 'tasks'), {
        name: currentTaskName,
        projectId: projectId,
        timestamp: serverTimestamp(),
      });
      setProjectTaskNames(prev => ({ ...prev, [projectId]: '' }));
      message.success('Task logged');
    } catch (error) {
      console.error('Error adding task:', error);
      message.error('Failed to log task');
    }
  };

  const handleAddProject = async () => {
    if (!user) {
      message.error('Please login to create projects');
      return;
    }
    if (!newProjectName.trim()) {
      message.error('Please enter a project name');
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'projects'), {
        name: newProjectName,
        createdAt: serverTimestamp(),
      });
      setSelectedProjectId(docRef.id);
      setNewProjectName('');
      setIsAddingProject(false);
      message.success('Project created');
    } catch (error) {
      console.error('Error adding project:', error);
      message.error('Failed to create project');
    }
  };

  const handleToggleProjectFocus = async (id: string, isFocused: boolean) => {
    try {
      await updateDoc(doc(db, 'projects', id), { isFocused: !isFocused });
    } catch (error) {
      console.error('Error toggling project focus:', error);
      message.error('Failed to update focus status');
    }
  };

  const handleRenameProject = async () => {
    if (!newProjectName.trim() || !selectedProjectId) {
      message.error('Please enter a valid project name');
      return;
    }

    try {
      await updateDoc(doc(db, 'projects', selectedProjectId), {
        name: newProjectName,
      });
      setNewProjectName('');
      setIsRenamingProject(false);
      message.success('Project renamed');
    } catch (error) {
      console.error('Error renaming project:', error);
      message.error('Failed to rename project');
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', id));
      message.success('Task deleted');
    } catch (error) {
      console.error('Error deleting task:', error);
      message.error('Failed to delete task');
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
        message.success('Task completed');
      }
    } catch (error) {
      console.error('Error completing task:', error);
      message.error('Failed to complete task');
    }
  };

  const handleUncompleteTask = async (id: string) => {
    try {
      await updateDoc(doc(db, 'tasks', id), {
        completedAt: null,
        duration: null
      });
      message.success('Task uncompleted');
    } catch (error) {
      console.error('Error uncompleting task:', error);
      message.error('Failed to uncomplete task');
    }
  };

  const handleAddIdea = async () => {
    if (!user) {
      message.error('Please login to save ideas');
      return;
    }
    if (!ideaContent.trim()) {
      message.error('Please enter an idea');
      return;
    }

    try {
      await addDoc(collection(db, 'ideas'), {
        content: ideaContent,
        createdAt: serverTimestamp(),
      });
      setIdeaContent('');
      message.success('Idea saved');
    } catch (error) {
      console.error('Error adding idea:', error);
      message.error('Failed to save idea');
    }
  };

  const handleUpdateIdeaNotes = async (id: string) => {
    try {
      await updateDoc(doc(db, 'ideas', id), { notes: tempNotes });
      setEditingIdeaNotesId(null);
      message.success('Notes updated');
    } catch (error) {
      console.error('Error updating idea notes:', error);
      message.error('Failed to update notes');
    }
  };



  const handleDeleteIdea = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'ideas', id));
      message.success('Idea deleted');
    } catch (error) {
      console.error('Error deleting idea:', error);
      message.error('Failed to delete idea');
    }
  };

  const handleCreateProjectFromIdea = async (idea: Idea) => {
    if (!user) {
      message.error('Please login to create projects');
      return;
    }
    try {
      const docRef = await addDoc(collection(db, 'projects'), {
        name: idea.content,
        description: idea.notes || '',
        createdAt: serverTimestamp(),
      });
      // Delete the idea after creating a project from it
      await deleteDoc(doc(db, 'ideas', idea.id));

      setSelectedProjectId(docRef.id);
      setActiveTab('1'); // Switch to Tracker tab
      message.success('Project created from idea');
    } catch (error) {
      console.error('Error creating project from idea:', error);
      message.error('Failed to create project');
    }
  };
  const startEditingTime = (task: Task, field: 'timestamp' | 'completedAt' = 'timestamp') => {
    setEditingTaskId(task.id);
    setEditingField(field);
    const ts = task[field];
    if (!ts && field === 'completedAt') {
      // If setting a completedAt for the first time, default to now or start time + 1 hour
      const date = task.timestamp instanceof Timestamp ? task.timestamp.toDate() : task.timestamp;
      setEditingValue(dayjs(date).add(1, 'hour').format('HH:mm'));
    } else {
      const date = ts instanceof Timestamp ? ts.toDate() : ts;
      setEditingValue(dayjs(date).format('HH:mm'));
    }
  };

  const startEditingTaskName = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingField('name');
    setEditingValue(task.name);
  };

  const saveEditedTaskName = async (id: string) => {
    try {
      if (!editingValue.trim()) {
        message.warning('Task name cannot be empty');
        return;
      }
      await updateDoc(doc(db, 'tasks', id), { name: editingValue.trim() });
      setEditingTaskId(null);
      setEditingField(null);
      message.success('Task updated');
    } catch (error) {
      console.error('Error updating task name:', error);
      message.error('Failed to update task');
    }
  };

  const saveEditedTime = async (id: string) => {
    if (!editingField) return;
    try {
      const parts = editingValue.split(':').map(Number);
      if (parts.length < 2 || parts.some(isNaN)) {
        message.error('Invalid time format. Use HH:mm');
        return;
      }
      const [h, m] = parts;

      const taskSnap = await getDoc(doc(db, 'tasks', id));
      if (taskSnap.exists()) {
        const task = taskSnap.data() as Task;
        const ts = task[editingField];
        const baseDate = ts instanceof Timestamp ? ts.toDate() : (ts || (task.timestamp instanceof Timestamp ? task.timestamp.toDate() : task.timestamp));
        const newTimestamp = dayjs(baseDate).hour(h).minute(m).second(0).valueOf();

        const updates: Record<string, FirestoreDate | number> = { [editingField]: newTimestamp };

        // Recalculate duration
        const startTime = editingField === 'timestamp' ? newTimestamp : (task.timestamp instanceof Timestamp ? task.timestamp.toMillis() : task.timestamp);
        const endTime = editingField === 'completedAt' ? newTimestamp : (task.completedAt instanceof Timestamp ? task.completedAt.toMillis() : (task.completedAt || null));

        if (startTime && endTime) {
          updates.duration = endTime - startTime;
        }

        await updateDoc(doc(db, 'tasks', id), updates as Record<string, unknown>);
        setEditingTaskId(null);
        setEditingField(null);
        message.success('Time updated');
      }
    } catch (error) {
      console.error('Error editing time:', error);
      message.error('Failed to update time');
    }
  };

  const updateToNow = async (id: string, field: 'timestamp' | 'completedAt' = 'timestamp') => {
    try {
      const now = Date.now();
      const taskSnap = await getDoc(doc(db, 'tasks', id));
      if (taskSnap.exists()) {
        const task = taskSnap.data() as Task;
        const updates: Record<string, FirestoreDate | number> = { [field]: now };

        // Recalculate duration
        const startTime = field === 'timestamp' ? now : (task.timestamp instanceof Timestamp ? task.timestamp.toMillis() : task.timestamp);
        const endTime = field === 'completedAt' ? now : (task.completedAt instanceof Timestamp ? task.completedAt.toMillis() : (task.completedAt || null));

        if (startTime && endTime) {
          updates.duration = endTime - startTime;
        }

        await updateDoc(doc(db, 'tasks', id), updates as Record<string, unknown>);
        message.success(`${field === 'timestamp' ? 'Start' : 'End'} time updated to now`);
      }
    } catch (error) {
      console.error('Error updating time to now:', error);
      message.error('Failed to update time');
    }
  };

  const exportToCSV = async () => {
    if (!tasks || tasks.length === 0) {
      message.warning('No tasks to export');
      return;
    }

    const projectMap = new Map(projects?.map((p: Project) => [p.id, p.name]));

    const headers = ['Timestamp', 'Project', 'Task'];
    const rows = tasks.map((task: Task) => [
      formatDate(task.timestamp, 'YYYY-MM-DD HH:mm'),
      projectMap.get(task.projectId) || 'Unknown',
      task.name
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `time-log-${dayjs().format('YYYY-MM-DD-HHmm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: '35%',
      render: (ts: number, record: Task) => {
        if (editingTaskId === record.id && editingField === 'timestamp') {
          return (
            <Space size="small">
              <Input
                size="small"
                value={editingValue}
                onChange={e => setEditingValue(e.target.value)}
                onPressEnter={() => saveEditedTime(record.id)}
                style={{ width: '80px' }}
                autoFocus
              />
              <Button
                size="small"
                type="text"
                icon={<CheckOutlined style={{ color: '#10b981' }} />}
                onClick={() => saveEditedTime(record.id)}
              />
              <Button
                size="small"
                type="text"
                icon={<CloseOutlined style={{ color: '#ef4444' }} />}
                onClick={() => {
                  setEditingTaskId(null);
                  setEditingField(null);
                }}
              />
            </Space>
          );
        }
        return (
          <Space size="small">
            <Space
              onClick={() => startEditingTime(record, 'timestamp')}
              style={{ cursor: 'pointer' }}
            >
              <Title level={5} style={{ margin: 0, color: 'var(--text-main)', fontSize: '14px' }}>
                {formatDate(ts, 'HH:mm')}
              </Title>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {formatDate(ts, 'MMM DD')}
              </Text>
              <span ref={record.id === 'demo-t1' ? tourRefs.pencil : undefined}>
                <EditOutlined style={{ fontSize: '10px', opacity: 0.3 }} />
              </span>
            </Space>
            <Button
              ref={record.id === 'demo-t1' ? tourRefs.nowButton : undefined}
              type="text"
              size="small"
              icon={<ClockCircleOutlined />}
              onClick={() => updateToNow(record.id, 'timestamp')}
              style={{ color: 'var(--text-muted)', fontSize: '12px' }}
              title="Update start time to now"
            >
              Now
            </Button>
          </Space>
        );
      },
    },
    {
      title: 'Task',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Task) => {
        const project = projects?.find((p: Project) => p.id === record.projectId);

        const formatDuration = (ms: number) => {
          const mins = Math.floor(ms / (1000 * 60));
          const h = Math.floor(mins / 60);
          const m = mins % 60;
          return `${h > 0 ? `${h}h ` : ''}${m}m`;
        };

        return (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space direction="vertical" size={0} style={{ flex: 1 }}>
              {editingTaskId === record.id && editingField === 'name' ? (
                <Space size="small" style={{ width: '100%' }}>
                  <Input
                    size="small"
                    value={editingValue}
                    onChange={e => setEditingValue(e.target.value)}
                    onPressEnter={() => saveEditedTaskName(record.id)}
                    style={{ background: 'var(--bg-input)', color: 'var(--text-main)', border: '1px solid var(--primary-color)' }}
                    autoFocus
                  />
                  <Button
                    size="small"
                    type="text"
                    icon={<CheckOutlined style={{ color: '#10b981' }} />}
                    onClick={() => saveEditedTaskName(record.id)}
                  />
                  <Button
                    size="small"
                    type="text"
                    icon={<CloseOutlined style={{ color: '#ef4444' }} />}
                    onClick={() => {
                      setEditingTaskId(null);
                      setEditingField(null);
                    }}
                  />
                </Space>
              ) : (
                <Text
                  onClick={() => startEditingTaskName(record)}
                  style={{
                    color: record.completedAt ? 'var(--text-muted)' : 'var(--text-main)',
                    fontSize: '15px',
                    fontWeight: 500,
                    textDecoration: record.completedAt ? 'line-through' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  {name} <EditOutlined style={{ fontSize: '10px', opacity: 0.3, marginLeft: '4px' }} />
                </Text>
              )}
              <Space>
                {project && (
                  <Tooltip title={project.description}>
                    <Tag color="blue" bordered={false} style={{ fontSize: '10px', background: 'var(--bg-input)', color: 'var(--accent-color)', cursor: project.description ? 'help' : 'default' }}>
                      {project.name}
                    </Tag>
                  </Tooltip>
                )}
                {record.duration && (
                  <Tag color="success" bordered={false} style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                    {formatDuration(record.duration)}
                  </Tag>
                )}
              </Space>
            </Space>
            {record.completedAt ? (
              <Space>
                {editingTaskId === record.id && editingField === 'completedAt' ? (
                  <Space size="small">
                    <Input
                      size="small"
                      value={editingValue}
                      onChange={e => setEditingValue(e.target.value)}
                      onPressEnter={() => saveEditedTime(record.id)}
                      style={{ width: '80px' }}
                      autoFocus
                    />
                    <Button
                      size="small"
                      type="text"
                      icon={<CheckOutlined style={{ color: '#10b981' }} />}
                      onClick={() => saveEditedTime(record.id)}
                    />
                    <Button
                      size="small"
                      type="text"
                      icon={<CloseOutlined style={{ color: '#ef4444' }} />}
                      onClick={() => {
                        setEditingTaskId(null);
                        setEditingField(null);
                      }}
                    />
                  </Space>
                ) : (
                  <Button
                    type="link"
                    size="small"
                    onClick={() => startEditingTime(record, 'completedAt')}
                    style={{ padding: 0, height: 'auto', fontSize: '12px', color: 'var(--text-muted)' }}
                  >
                    Ended {formatDate(record.completedAt, 'HH:mm')}
                  </Button>
                )}
                <Button
                  type="text"
                  size="small"
                  icon={<UndoOutlined />}
                  onClick={() => handleUncompleteTask(record.id)}
                  style={{ color: 'var(--text-muted)', fontSize: '12px' }}
                >
                  Undo
                </Button>
              </Space>
            ) : (
              <Space>
                <Button
                  ref={record.id === 'demo-t1' ? tourRefs.complete : undefined}
                  type="text"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleCompleteTask(record.id)}
                  style={{ color: 'var(--primary-color)', fontSize: '12px' }}
                >
                  Complete
                </Button>
              </Space>
            )}
          </div>
        );
      },
    },
    {
      title: '',
      key: 'action',
      width: '60px',
      render: (_: unknown, record: Task) => (
        <Button
          ref={record.id === 'demo-t1' ? tourRefs.deleteRow : undefined}
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteTask(record.id)}
        />
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#2563eb',
          borderRadius: 8,
          fontFamily: 'Inter, sans-serif',
        },
      }}
    >
      <Layout style={{ background: 'transparent' }}>
        <Content style={{ padding: '40px 20px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' }}>
            <div>
              {user ? (
                <Space>
                  <Tag
                    icon={<UserOutlined />}
                    color="blue"
                    style={{ borderRadius: '16px', padding: '4px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                  >
                    {user.displayName || user.email}
                  </Tag>
                  <Button
                    type="text"
                    icon={<LogoutOutlined />}
                    onClick={handleLogout}
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Logout
                  </Button>
                </Space>
              ) : (
                <Button
                  ref={tourRefs.login}
                  type="primary"
                  icon={<GoogleOutlined />}
                  onClick={handleLogin}
                  style={{ borderRadius: '8px' }}
                >
                  Login with Google
                </Button>
              )}
            </div>
            <Space>
              <Text style={{ color: 'var(--text-muted)', fontSize: '12px' }}>THEME</Text>
              <Select
                defaultValue="default"
                style={{ width: 120 }}
                onChange={setCurrentTheme}
                size="small"
              >
                <Select.Option value="default">Slate</Select.Option>
                <Select.Option value="midnight">Midnight</Select.Option>
                <Select.Option value="emerald">Emerald</Select.Option>
                <Select.Option value="rose">Rose</Select.Option>
              </Select>
            </Space>
          </div>

          {!user && !isTourOpen ? (
            <div style={{ textAlign: 'center', padding: '60px 0', animation: 'fadeIn 0.8s ease-out' }}>
              <div style={{ marginBottom: '40px' }}>
                <Title style={{ color: 'var(--text-main)', fontSize: '48px', fontWeight: 800, marginBottom: '16px', letterSpacing: '-1px' }}>
                  Master Your Time <br /> <span style={{ color: 'var(--primary-color)' }}>Without the Clutter.</span>
                </Title>
                <Text style={{ color: 'var(--text-muted)', fontSize: '18px', maxWidth: '600px', display: 'inline-block', lineHeight: 1.6 }}>
                  Stop guessing where your day went. Time Logg provides a minimalist, high-speed interface to log projects, track deep work, and capture future ideas effortlessly.
                </Text>
              </div>

              <Space size="large" direction="vertical">
                <Button
                  type="primary"
                  size="large"
                  onClick={startTutorial}
                  className="primary-button"
                  style={{ width: '280px', height: '60px !important', fontSize: '18px' }}
                >
                  Start Interactive Tutorial
                </Button>
                <div>
                  <Text style={{ color: 'var(--text-muted)' }}>or </Text>
                  <Button type="link" onClick={handleLogin} style={{ color: 'var(--primary-color)', fontWeight: 600 }}>
                    Login with Google to start logging
                  </Button>
                </div>
              </Space>
            </div>
          ) : (
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              className="custom-tabs"
              items={[
                {
                  key: '1',
                  label: (
                    <span>
                      <ClockCircleOutlined />
                      Tracker
                    </span>
                  ),
                  children: (
                    <>
                      {isTourOpen && (
                        <div ref={tourRefs.eduAlert}>
                          <Alert
                            message="Active Educational Mode"
                            description="You are exploring Time Logg. Features are being unlocked as you progress through the tour steps."
                            type="info"
                            showIcon
                            style={{ marginBottom: '24px', borderRadius: '12px', background: 'rgba(37, 99, 235, 0.05)', border: '1px solid rgba(37, 99, 235, 0.2)' }}
                          />
                        </div>
                      )}
                      <Card ref={tourRefs.projects} className="flat-card" style={{ marginBottom: '32px' }}>
                        <Space direction="vertical" style={{ width: '100%' }} size="large">
                          <div id="project-section">
                            <div ref={tourRefs.projectsTitle} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                              <Text strong style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                                PROJECTS & LOGGING
                              </Text>
                              <Space size="middle">
                                {projects?.some(p => p.isFocused) && !isAddingProject && !isRenamingProject && (
                                  <Button
                                    type="link"
                                    size="small"
                                    onClick={() => setIsFocusMode(!isFocusMode)}
                                    style={{ padding: 0, height: 'auto', fontSize: '12px', color: isFocusMode ? 'var(--primary-color)' : 'var(--text-main)' }}
                                    icon={isFocusMode ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                                    title={isFocusMode ? "Show all projects" : "Show focus list"}
                                  >
                                    {isFocusMode ? 'Show All' : 'Focus Mode'}
                                  </Button>
                                )}
                                {selectedProjectId && !isAddingProject && !isRenamingProject && (
                                  <Button
                                    ref={tourRefs.rename}
                                    type="link"
                                    size="small"
                                    onClick={() => {
                                      const p = projects?.find(proj => proj.id === selectedProjectId);
                                      if (p) {
                                        setNewProjectName(p.name);
                                        setIsRenamingProject(true);
                                      }
                                    }}
                                    style={{ padding: 0, height: 'auto', fontSize: '12px', color: 'var(--text-muted)' }}
                                  >
                                    Rename Selected
                                  </Button>
                                )}
                                <Button
                                  type="link"
                                  size="small"
                                  onClick={() => {
                                    if (isAddingProject || isRenamingProject) {
                                      setIsAddingProject(false);
                                      setIsRenamingProject(false);
                                      setNewProjectName('');
                                    } else {
                                      setIsAddingProject(true);
                                    }
                                  }}
                                  style={{ padding: 0, height: 'auto', fontSize: '12px', color: 'var(--primary-color)' }}
                                >
                                  {isAddingProject || isRenamingProject ? 'Cancel' : '+ New Project'}
                                </Button>
                              </Space>
                            </div>

                            {isAddingProject || isRenamingProject ? (
                              <Space.Compact style={{ width: '100%', marginBottom: '16px' }}>
                                <Input
                                  placeholder={isRenamingProject ? "Enter new name" : "Enter new project name"}
                                  value={newProjectName}
                                  onChange={(e) => setNewProjectName(e.target.value)}
                                  onPressEnter={isRenamingProject ? handleRenameProject : handleAddProject}
                                  size="large"
                                />
                                <Button
                                  type="primary"
                                  size="large"
                                  onClick={isRenamingProject ? handleRenameProject : handleAddProject}
                                  icon={isRenamingProject ? undefined : <PlusOutlined />}
                                >
                                  {isRenamingProject ? "Save" : ""}
                                </Button>
                              </Space.Compact>
                            ) : (
                              <div id="project-section" style={{ display: 'grid', gap: '12px' }}>
                                {projects?.filter(p => !isFocusMode || p.isFocused).map((p: Project) => (
                                  <div
                                    key={p.id}
                                    style={{
                                      display: 'flex',
                                      gap: '12px',
                                      alignItems: 'center',
                                      padding: '8px 12px',
                                      background: 'var(--bg-input)',
                                      borderRadius: '8px',
                                      border: '1px solid var(--border-color)'
                                    }}
                                  >
                                    <Button
                                      type="text"
                                      size="small"
                                      icon={p.isFocused ? <PushpinFilled style={{ color: 'var(--primary-color)' }} /> : <PushpinOutlined />}
                                      onClick={() => handleToggleProjectFocus(p.id, !!p.isFocused)}
                                      style={{ color: p.isFocused ? 'var(--primary-color)' : 'var(--text-muted)', padding: 0, minWidth: '24px' }}
                                      title={p.isFocused ? "Remove from focus list" : "Add to focus list"}
                                    />
                                    <div style={{ width: '150px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <Text
                                        strong
                                        ellipsis={{ tooltip: p.name }}
                                        style={{
                                          color: 'var(--text-main)',
                                          cursor: 'pointer',
                                          textDecoration: selectedProjectId === p.id ? 'underline' : 'none',
                                          flex: 1
                                        }}
                                        onClick={() => setSelectedProjectId(p.id)}
                                      >
                                        {p.name}
                                      </Text>
                                      {p.description && (
                                        <Tooltip title={p.description}>
                                          <InfoCircleOutlined style={{ fontSize: '12px', color: 'var(--text-muted)', cursor: 'help' }} />
                                        </Tooltip>
                                      )}
                                    </div>
                                    <Space.Compact style={{ flex: 1 }}>
                                      <Input
                                        placeholder="What are you doing?"
                                        value={projectTaskNames[p.id] || ''}
                                        onChange={(e) => setProjectTaskNames(prev => ({ ...prev, [p.id]: e.target.value }))}
                                        onPressEnter={() => handleAddTask(p.id)}
                                        style={{
                                          color: 'var(--text-main)',
                                          background: 'rgba(0, 0, 0, 0.2)',
                                          borderColor: 'var(--border-color)'
                                        }}
                                      />
                                      <Button
                                        type="primary"
                                        onClick={() => handleAddTask(p.id)}
                                        disabled={!user && !isTourOpen}
                                        style={{
                                          background: (isTourOpen || user) ? 'var(--primary-color)' : 'var(--bg-card)',
                                          borderColor: (isTourOpen || user) ? (isFocusMode ? 'var(--primary-color)' : 'var(--border-color)') : 'var(--border-color)'
                                        }}
                                      >
                                        Log
                                      </Button>
                                    </Space.Compact>
                                  </div>
                                ))}
                                {(!projects || projects.length === 0) && (
                                  <Text type="secondary" style={{ fontSize: '12px' }}>
                                    {loadingProjects ? 'Loading projects...' : 'No projects yet. Create one!'}
                                  </Text>
                                )}
                              </div>
                            )}
                          </div>
                        </Space>
                      </Card>

                      {(user || (isTourOpen && currentTourStep >= 2)) && (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <Space size="middle">
                              <Title level={4} style={{ margin: 0, color: 'var(--text-main)', fontWeight: 600 }}>History</Title>
                              <Select
                                value={taskFilter}
                                onChange={setTaskFilter}
                                size="small"
                                style={{ width: 120 }}
                                className="filter-select"
                              >
                                <Select.Option value="all">All Tasks</Select.Option>
                                <Select.Option value="pending">Pending</Select.Option>
                                <Select.Option value="completed">Completed</Select.Option>
                              </Select>
                            </Space>
                            <Button
                              ref={tourRefs.export}
                              icon={<DownloadOutlined />}
                              onClick={exportToCSV}
                              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                            >
                              Export CSV
                            </Button>
                          </div>

                          <Card ref={tourRefs.history} className="flat-card" styles={{ body: { padding: 0 } }}>
                            <Table
                              dataSource={tasks?.filter((task: Task) => {
                                if (taskFilter === 'pending') return !task.completedAt;
                                if (taskFilter === 'completed') return !!task.completedAt;
                                return true;
                              })}
                              columns={columns}
                              rowKey="id"
                              loading={loadingTasks && !!user}
                              pagination={{ pageSize: 15, position: ['bottomCenter'] }}
                              locale={{ emptyText: <div style={{ padding: '40px', color: 'var(--text-muted)' }}>{loadingTasks ? 'Loading logs...' : 'No logs found.'}</div> }}
                            />
                          </Card>
                        </>
                      )}
                    </>
                  )
                },
                (user || (isTourOpen && currentTourStep >= 8)) ? {
                  key: '2',
                  label: (
                    <span ref={tourRefs.ideas}>
                      <BulbOutlined />
                      Ideas
                    </span>
                  ),
                  children: (
                    <>
                      <Card ref={tourRefs.ideaInput} className="flat-card" style={{ marginBottom: '32px' }}>
                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                          <div>
                            <Text strong style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '12px' }}>
                              IDEA TITLE
                            </Text>
                            <Input
                              placeholder="What's your idea? (Press Enter to save)"
                              value={ideaContent}
                              onChange={(e) => setIdeaContent(e.target.value)}
                              onPressEnter={handleAddIdea}
                              size="large"
                              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                            />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button type="primary" onClick={handleAddIdea} icon={<PlusOutlined />}>Save Idea</Button>
                          </div>
                        </Space>
                      </Card>

                      <Title level={4} style={{ marginBottom: '16px', color: 'var(--text-main)', fontWeight: 600 }}>Stored Ideas</Title>

                      <div ref={tourRefs.ideaStore} style={{ display: 'grid', gap: '16px' }}>
                        {loadingIdeas && !!user && (
                          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            Loading ideas...
                          </div>
                        )}
                        {ideas?.map((idea: Idea) => (
                          <Card
                            key={idea.id}
                            className="flat-card"
                            size="small"
                            style={{
                              position: 'relative',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div style={{ flex: 1, paddingRight: '24px' }}>
                                <Text style={{
                                  color: 'var(--text-main)',
                                  fontSize: '16px',
                                  fontWeight: 600
                                }}>
                                  {idea.content}
                                </Text>
                                {editingIdeaNotesId === idea.id ? (
                                  <div style={{ marginTop: '12px' }}>
                                    <Input.TextArea
                                      autoFocus
                                      placeholder="Add notes..."
                                      value={tempNotes}
                                      onChange={(e) => setTempNotes(e.target.value)}
                                      autoSize={{ minRows: 2, maxRows: 4 }}
                                      style={{ background: 'var(--bg-input)', color: 'var(--text-main)', border: '1px solid var(--primary-color)' }}
                                    />
                                    <Space style={{ marginTop: '8px' }}>
                                      <Button size="small" type="primary" onClick={() => handleUpdateIdeaNotes(idea.id)}>Save Notes</Button>
                                      <Button size="small" type="text" onClick={() => setEditingIdeaNotesId(null)} style={{ color: 'var(--text-muted)' }}>Cancel</Button>
                                    </Space>
                                  </div>
                                ) : (
                                  <div style={{ marginTop: '8px' }}>
                                    {idea.notes ? (
                                      <div
                                        onClick={() => {
                                          setEditingIdeaNotesId(idea.id);
                                          setTempNotes(idea.notes || '');
                                        }}
                                        style={{ cursor: 'pointer' }}
                                      >
                                        <Text style={{ color: 'var(--text-muted)', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                                          {idea.notes}
                                        </Text>
                                      </div>
                                    ) : (
                                      <span ref={idea.id === 'demo-i1' ? tourRefs.ideaNoteBtn : undefined}>
                                        <Button
                                          type="link"
                                          size="small"
                                          icon={<EditOutlined />}
                                          onClick={() => {
                                            setEditingIdeaNotesId(idea.id);
                                            setTempNotes('');
                                          }}
                                          style={{ padding: 0, height: 'auto', fontSize: '12px' }}
                                        >
                                          Add Notes
                                        </Button>
                                      </span>
                                    )}
                                  </div>
                                )}
                                <div style={{ marginTop: '12px' }}>
                                  <Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Created {formatDate(idea.createdAt, 'MMM DD · HH:mm')}
                                  </Text>
                                </div>
                              </div>
                              <Space>
                                <Button
                                  ref={idea.id === 'demo-i1' ? tourRefs.rocketBtn : undefined}
                                  type="text"
                                  icon={<RocketOutlined style={{ color: 'var(--primary-color)' }} />}
                                  onClick={() => handleCreateProjectFromIdea(idea)}
                                  className="action-btn"
                                  title="Create Project"
                                />
                                <Button
                                  type="text"
                                  danger
                                  icon={<DeleteOutlined />}
                                  onClick={() => handleDeleteIdea(idea.id)}
                                  className="action-btn"
                                  title="Delete Idea"
                                />
                              </Space>
                            </div>
                          </Card>
                        ))}
                        {(!loadingIdeas && (!ideas || ideas.length === 0)) && (
                          <Card className="flat-card">
                            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                              No ideas yet. Capture your first one above!
                            </div>
                          </Card>
                        )}
                      </div>
                    </>
                  )
                } : null
              ].filter(Boolean) as any}
            />
          )}
        </Content>
        <Tour
          open={isTourOpen}
          current={currentTourStep}
          onClose={() => setIsTourOpen(false)}
          onChange={handleTourChange}
          steps={tourSteps}
          mask={{
            color: 'rgba(0, 0, 0, 0.85)',
          }}
          gap={{ offset: 6 }}
        />
      </Layout>
    </ConfigProvider>
  );
};

export default App;
