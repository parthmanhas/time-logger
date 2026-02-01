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
  Tabs
} from 'antd';
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
  UserOutlined
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
  serverTimestamp
} from 'firebase/firestore';
import dayjs from 'dayjs';
import { db, auth, googleProvider } from './firebase';
import type { Task, Idea, Project } from './types';

const { Content } = Layout;
const { Title, Text } = Typography;

const FAKE_PROJECTS: Project[] = [
  { id: 'p1', name: 'Development', createdAt: Date.now() },
  { id: 'p2', name: 'Personal', createdAt: Date.now() - 86400000 },
];

const FAKE_TASKS: Task[] = [
  { id: 't1', projectId: 'p1', name: 'Migration to Firebase', timestamp: Date.now() - 3600000, completedAt: Date.now() - 3000000, duration: 600000 },
  { id: 't2', projectId: 'p2', name: 'Workout session', timestamp: Date.now() - 7200000 },
  { id: 't3', projectId: 'p1', name: 'Code review', timestamp: Date.now() - 10000000 },
];

const FAKE_IDEAS: Idea[] = [
  { id: 'i1', content: 'Add dark mode theme', createdAt: Date.now() - 172800000, notes: 'Follow system settings if possible.' },
  { id: 'i2', content: 'Mobile app version', createdAt: Date.now() - 250000000 },
];

const App: React.FC = () => {
  const [user] = useAuthState(auth);
  const [projectTaskNames, setProjectTaskNames] = useState<Record<string, string>>({});
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);
  const [newProjectName, setNewProjectName] = useState('');
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [isRenamingProject, setIsRenamingProject] = useState(false);

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTime, setEditingTime] = useState<string>('');
  const [currentTheme, setCurrentTheme] = useState<string>('default');
  const [ideaContent, setIdeaContent] = useState('');
  const [editingIdeaNotesId, setEditingIdeaNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');

  const [projectsSnapshot, loadingProjects, errorProjects] = useCollection(
    user ? query(collection(db, 'projects'), orderBy('createdAt', 'desc')) : null
  );
  const projects = user
    ? projectsSnapshot?.docs.map(doc => ({ ...doc.data(), id: doc.id } as Project))
    : FAKE_PROJECTS;

  const [tasksSnapshot, loadingTasks, errorTasks] = useCollection(
    user ? query(collection(db, 'tasks'), orderBy('timestamp', 'desc')) : null
  );
  const tasks = user
    ? tasksSnapshot?.docs.map(doc => ({ ...doc.data(), id: doc.id } as Task))
    : FAKE_TASKS;

  const [ideasSnapshotRaw, loadingIdeas, errorIdeas] = useCollection(
    query(collection(db, 'ideas'), orderBy('createdAt', 'desc'))
  );
  const ideasSnapshot = ideasSnapshotRaw as { docs: { data: () => Idea; id: string }[] } | undefined;
  const ideas = user
    ? ideasSnapshot?.docs.map(doc => ({ ...doc.data(), id: doc.id } as Idea))
    : FAKE_IDEAS;

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
      // eslint-disable-next-line react-hooks/purity
      const now = Date.now();
      const taskSnap = await getDoc(doc(db, 'tasks', id));
      if (taskSnap.exists()) {
        const task = taskSnap.data() as Task;
        await updateDoc(doc(db, 'tasks', id), {
          completedAt: now,
          duration: now - task.timestamp
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

  const handleCompleteIdea = async (id: string) => {
    try {
      await updateDoc(doc(db, 'ideas', id), { completedAt: serverTimestamp() });
      message.success('Idea marked as complete');
    } catch (error) {
      console.error('Error completing idea:', error);
      message.error('Failed to complete idea');
    }
  };

  const handleUncompleteIdea = async (id: string) => {
    try {
      await updateDoc(doc(db, 'ideas', id), { completedAt: null });
      message.success('Idea marked as active');
    } catch (error) {
      console.error('Error uncompleting idea:', error);
      message.error('Failed to reactive idea');
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
  const startEditingTime = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTime(dayjs(task.timestamp).format('HH:mm'));
  };

  const saveEditedTime = async (id: string) => {
    try {
      const parts = editingTime.split(':').map(Number);
      if (parts.length < 2 || parts.some(isNaN)) {
        message.error('Invalid time format. Use HH:mm');
        return;
      }
      const [h, m] = parts;

      const taskSnap = await getDoc(doc(db, 'tasks', id));
      if (taskSnap.exists()) {
        const task = taskSnap.data() as Task;
        const newTimestamp = dayjs(task.timestamp).hour(h).minute(m).second(0).valueOf();
        await updateDoc(doc(db, 'tasks', id), { timestamp: newTimestamp });
        setEditingTaskId(null);
        message.success('Time updated');
      }
    } catch (error) {
      console.error('Error editing time:', error);
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
      dayjs(task.timestamp).format('YYYY-MM-DD HH:mm'),
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
        if (editingTaskId === record.id) {
          return (
            <Space size="small">
              <Input
                size="small"
                value={editingTime}
                onChange={e => setEditingTime(e.target.value)}
                onPressEnter={() => saveEditedTime(record.id)}
                style={{ width: '90px' }}
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
                onClick={() => setEditingTaskId(null)}
              />
            </Space>
          );
        }
        return (
          <Space
            onClick={() => startEditingTime(record)}
            style={{ cursor: 'pointer' }}
          >
            <ClockCircleOutlined style={{ color: 'var(--primary-color)' }} />
            <Title level={5} style={{ margin: 0, color: 'var(--text-main)', fontSize: '14px' }}>
              {dayjs(ts).format('HH:mm')}
            </Title>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {dayjs(ts).format('MMM DD')}
            </Text>
            <EditOutlined style={{ fontSize: '12px', opacity: 0.3 }} />
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
            <Space direction="vertical" size={0}>
              <Text style={{
                color: record.completedAt ? 'var(--text-muted)' : 'var(--text-main)',
                fontSize: '15px',
                fontWeight: 500,
                textDecoration: record.completedAt ? 'line-through' : 'none'
              }}>
                {name}
              </Text>
              <Space>
                {project && (
                  <Tag color="blue" bordered={false} style={{ fontSize: '10px', background: 'var(--bg-input)', color: 'var(--accent-color)' }}>
                    {project.name}
                  </Tag>
                )}
                {record.duration && (
                  <Tag color="success" bordered={false} style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                    {formatDuration(record.duration)}
                  </Tag>
                )}
              </Space>
            </Space>
            {record.completedAt ? (
              <Button
                type="text"
                size="small"
                icon={<UndoOutlined />}
                onClick={() => handleUncompleteTask(record.id)}
                style={{ color: 'var(--text-muted)', fontSize: '12px' }}
              >
                Undo
              </Button>
            ) : (
              <Button
                type="text"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleCompleteTask(record.id)}
                style={{ color: 'var(--primary-color)', fontSize: '12px' }}
              >
                Complete
              </Button>
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

          <Tabs
            defaultActiveKey="1"
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
                    <Card className="flat-card" style={{ marginBottom: '32px' }}>
                      <Space direction="vertical" style={{ width: '100%' }} size="large">
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                            <Text strong style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                              PROJECTS & LOGGING
                            </Text>
                            <Space size="middle">
                              {selectedProjectId && !isAddingProject && !isRenamingProject && (
                                <Button
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
                                  setIsAddingProject(!isAddingProject);
                                  setIsRenamingProject(false);
                                  setNewProjectName('');
                                }}
                                style={{ padding: 0, height: 'auto', fontSize: '12px', color: 'var(--primary-color)' }}
                              >
                                {isAddingProject || isRenamingProject ? 'Cancel' : '+ New Project'}
                              </Button>
                            </Space>
                          </div>

                          {isAddingProject || isRenamingProject ? (
                            <Input.Search
                              placeholder={isRenamingProject ? "Enter new name" : "Enter new project name"}
                              enterButton={isRenamingProject ? "Save" : <PlusOutlined />}
                              value={newProjectName}
                              onChange={(e) => setNewProjectName(e.target.value)}
                              onSearch={isRenamingProject ? handleRenameProject : handleAddProject}
                              size="large"
                            />
                          ) : (
                            <div style={{ display: 'grid', gap: '12px' }}>
                              {projects?.map((p: Project) => (
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
                                  <div style={{ minWidth: '100px', flexShrink: 0 }}>
                                    <Text
                                      strong
                                      style={{
                                        color: 'var(--text-main)',
                                        cursor: 'pointer',
                                        textDecoration: selectedProjectId === p.id ? 'underline' : 'none'
                                      }}
                                      onClick={() => setSelectedProjectId(p.id)}
                                    >
                                      {p.name}
                                    </Text>
                                  </div>
                                  <Input
                                    placeholder="What are you doing?"
                                    variant="borderless"
                                    value={projectTaskNames[p.id] || ''}
                                    onChange={(e) => setProjectTaskNames(prev => ({ ...prev, [p.id]: e.target.value }))}
                                    onPressEnter={() => handleAddTask(p.id)}
                                    style={{ color: 'var(--text-main)' }}
                                  />
                                  <Button
                                    type="primary"
                                    size="small"
                                    onClick={() => handleAddTask(p.id)}
                                    disabled={!user}
                                    style={{ borderRadius: '6px' }}
                                  >
                                    Log
                                  </Button>
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

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <Title level={4} style={{ margin: 0, color: 'var(--text-main)', fontWeight: 600 }}>History</Title>
                      <Button
                        icon={<DownloadOutlined />}
                        onClick={exportToCSV}
                        style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                      >
                        Export CSV
                      </Button>
                    </div>

                    <Card className="flat-card" styles={{ body: { padding: 0 } }}>
                      <Table
                        dataSource={tasks}
                        columns={columns}
                        rowKey="id"
                        loading={loadingTasks}
                        pagination={{ pageSize: 15, position: ['bottomCenter'] }}
                        locale={{ emptyText: <div style={{ padding: '40px', color: 'var(--text-muted)' }}>{loadingTasks ? 'Loading logs...' : 'No logs found.'}</div> }}
                      />
                    </Card>
                  </>
                )
              },
              {
                key: '2',
                label: (
                  <span>
                    <BulbOutlined />
                    Ideas
                  </span>
                ),
                children: (
                  <>
                    <Card className="flat-card" style={{ marginBottom: '32px' }}>
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

                    <div style={{ display: 'grid', gap: '16px' }}>
                      {loadingIdeas && (
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
                            opacity: idea.completedAt ? 0.6 : 1,
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1, paddingRight: '24px' }}>
                              <Text style={{
                                color: 'var(--text-main)',
                                fontSize: '16px',
                                fontWeight: 600,
                                textDecoration: idea.completedAt ? 'line-through' : 'none'
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
                                  )}
                                </div>
                              )}
                              <div style={{ marginTop: '12px' }}>
                                <Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                  Created {dayjs(idea.createdAt).format('MMM DD · HH:mm')}
                                </Text>
                              </div>
                            </div>
                            <Space>
                              {idea.completedAt ? (
                                <Button
                                  type="text"
                                  icon={<UndoOutlined />}
                                  onClick={() => handleUncompleteIdea(idea.id)}
                                  className="action-btn"
                                />
                              ) : (
                                <Button
                                  type="text"
                                  icon={<CheckCircleOutlined style={{ color: '#10b981' }} />}
                                  onClick={() => handleCompleteIdea(idea.id)}
                                  className="action-btn"
                                />
                              )}
                              <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleDeleteIdea(idea.id)}
                                className="action-btn"
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
              }
            ]}
          />
        </Content>
      </Layout>
    </ConfigProvider>
  );
};

export default App;
