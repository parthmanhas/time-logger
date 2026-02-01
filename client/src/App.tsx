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
  theme
} from 'antd';
import {
  PlusOutlined,
  DownloadOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import { db, type Task } from './db';

const { Content } = Layout;
const { Title, Text } = Typography;

const App: React.FC = () => {
  const [taskName, setTaskName] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(undefined);
  const [newProjectName, setNewProjectName] = useState('');
  const [isAddingProject, setIsAddingProject] = useState(false);

  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingTime, setEditingTime] = useState<string>('');

  const projects = useLiveQuery(() => db.projects.toArray());
  const tasks = useLiveQuery(() =>
    db.tasks.reverse().toArray()
  );

  useEffect(() => {
    if (projects && projects.length > 0 && selectedProjectId === undefined) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const handleAddTask = async () => {
    if (!taskName.trim()) {
      message.error('Please enter a task name');
      return;
    }
    if (!selectedProjectId) {
      message.error('Please select a project');
      return;
    }

    try {
      await db.tasks.add({
        name: taskName,
        projectId: selectedProjectId,
        timestamp: Date.now(),
      });
      setTaskName('');
      message.success('Task logged');
    } catch (error) {
      message.error('Failed to log task');
    }
  };

  const handleAddProject = async () => {
    if (!newProjectName.trim()) {
      message.error('Please enter a project name');
      return;
    }

    try {
      const id = await db.projects.add({
        name: newProjectName,
        createdAt: Date.now(),
      });
      setSelectedProjectId(id as number);
      setNewProjectName('');
      setIsAddingProject(false);
      message.success('Project created');
    } catch (error) {
      message.error('Failed to create project');
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      await db.tasks.delete(id);
      message.success('Task deleted');
    } catch (error) {
      message.error('Failed to delete task');
    }
  };

  const startEditingTime = (task: Task) => {
    setEditingTaskId(task.id!);
    setEditingTime(dayjs(task.timestamp).format('HH:mm:ss'));
  };

  const saveEditedTime = async (id: number) => {
    try {
      const [h, m, s] = editingTime.split(':').map(Number);
      if (isNaN(h) || isNaN(m) || isNaN(s)) {
        message.error('Invalid time format. Use HH:mm:ss');
        return;
      }

      const task = await db.tasks.get(id);
      if (task) {
        const newTimestamp = dayjs(task.timestamp).hour(h).minute(m).second(s).valueOf();
        await db.tasks.update(id, { timestamp: newTimestamp });
        setEditingTaskId(null);
        message.success('Time updated');
      }
    } catch (error) {
      message.error('Failed to update time');
    }
  };

  const exportToCSV = async () => {
    if (!tasks || tasks.length === 0) {
      message.warning('No tasks to export');
      return;
    }

    const projectMap = new Map(projects?.map((p: any) => [p.id, p.name]));

    const headers = ['Timestamp', 'Project', 'Task'];
    const rows = tasks.map((task: Task) => [
      dayjs(task.timestamp).format('YYYY-MM-DD HH:mm:ss'),
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
                style={{ width: '90px' }}
                autoFocus
              />
              <Button
                size="small"
                type="text"
                icon={<CheckOutlined style={{ color: '#10b981' }} />}
                onClick={() => saveEditedTime(record.id!)}
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
            <Text style={{ color: 'var(--text-main)' }}>
              {dayjs(ts).format('HH:mm:ss')}
            </Text>
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
        const project = projects?.find((p: any) => p.id === record.projectId);
        return (
          <Space direction="vertical" size={0}>
            <Text style={{ color: 'var(--text-main)', fontSize: '15px', fontWeight: 500 }}>
              {name}
            </Text>
            {project && (
              <Tag color="blue" bordered={false} style={{ fontSize: '10px', marginTop: '4px', background: '#334155', color: '#818cf8' }}>
                {project.name}
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: '',
      key: 'action',
      width: '60px',
      render: (_: any, record: Task) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteTask(record.id!)}
        />
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#4f46e5',
          borderRadius: 8,
          fontFamily: 'Inter, sans-serif',
        },
      }}
    >
      <Layout style={{ background: 'transparent' }}>
        <Content style={{ padding: '40px 20px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
          <div style={{ marginBottom: '40px' }}>
            <Title level={2} style={{ margin: 0, color: 'var(--text-main)', fontWeight: 700 }}>
              Time Tracker
            </Title>
            <Text style={{ color: 'var(--text-muted)' }}>Simple and efficient logging.</Text>
          </div>

          <Card className="flat-card" style={{ marginBottom: '32px' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                  <Text strong style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                    PROJECT
                  </Text>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => setIsAddingProject(!isAddingProject)}
                    style={{ padding: 0, height: 'auto', fontSize: '12px', color: 'var(--primary-color)' }}
                  >
                    {isAddingProject ? 'Back' : '+ New Project'}
                  </Button>
                </div>

                {isAddingProject ? (
                  <Input.Search
                    placeholder="Enter new project name"
                    enterButton="Create"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    onSearch={handleAddProject}
                    size="large"
                  />
                ) : (
                  <Space wrap size={[8, 8]}>
                    {projects?.map((p: any) => (
                      <Button
                        key={p.id}
                        type={selectedProjectId === p.id ? 'primary' : 'default'}
                        onClick={() => setSelectedProjectId(p.id)}
                        style={{
                          borderRadius: '8px',
                          background: selectedProjectId === p.id ? 'var(--primary-color)' : 'var(--bg-input)',
                          border: selectedProjectId === p.id ? 'none' : '1px solid var(--border-color)',
                          color: 'white'
                        }}
                      >
                        {p.name}
                      </Button>
                    ))}
                    {(!projects || projects.length === 0) && (
                      <Text type="secondary" style={{ fontSize: '12px' }}>No projects yet. Create one!</Text>
                    )}
                  </Space>
                )}
              </div>

              <div>
                <Text strong style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '12px' }}>
                  TASK NAME
                </Text>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Input
                    placeholder="What are you doing?"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    onPressEnter={handleAddTask}
                    size="large"
                    style={{ flex: 1 }}
                  />
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddTask}
                    className="primary-button"
                    disabled={!selectedProjectId}
                  >
                    Log Task
                  </Button>
                </div>
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
              pagination={{ pageSize: 15, position: ['bottomCenter'] }}
              locale={{ emptyText: <div style={{ padding: '40px', color: 'var(--text-muted)' }}>No logs found.</div> }}
            />
          </Card>
        </Content>
      </Layout>
    </ConfigProvider>
  );
};

export default App;
