import React, { useState, useEffect } from 'react';
import {
  Layout,
  Typography,
  Table,
  Input,
  Button,
  Select,
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
  FolderOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import { db, type Task } from './db';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const App: React.FC = () => {
  const [taskName, setTaskName] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(undefined);
  const [newProjectName, setNewProjectName] = useState('');
  const [isAddingProject, setIsAddingProject] = useState(false);

  const projects = useLiveQuery(() => db.projects.toArray());
  const tasks = useLiveQuery(() =>
    db.tasks.reverse().toArray()
  );

  // Set default project if exists
  useEffect(() => {
    if (projects && projects.length > 0 && selectedProjectId === undefined) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects]);

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
      message.success('Task logged successfully');
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
      width: '30%',
      render: (ts: number) => (
        <Space>
          <ClockCircleOutlined style={{ color: 'var(--primary-color)' }} />
          <Text style={{ color: 'var(--text-main)' }}>
            {dayjs(ts).format('HH:mm:ss')}
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {dayjs(ts).format('MMM DD')}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Task',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Task) => {
        const project = projects?.find(p => p.id === record.projectId);
        return (
          <Space direction="vertical" size={0}>
            <Text style={{ color: 'var(--text-main)', fontSize: '16px', fontWeight: 500 }}>
              {name}
            </Text>
            {project && (
              <Tag color="blue" bordered={false} style={{ fontSize: '10px', marginTop: '4px' }}>
                {project.name}
              </Tag>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#6366f1',
          borderRadius: 12,
          fontFamily: 'Outfit, sans-serif',
        },
      }}
    >
      <Layout style={{ background: 'transparent' }}>
        <Content style={{ padding: '40px 20px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
          <div style={{ marginBottom: '40px', textAlign: 'center' }}>
            <Title level={1} style={{ margin: 0, background: 'linear-gradient(to right, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>
              Antigravity Time
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>Log your flow, track your progress.</Text>
          </div>

          <Card className="glass-card" style={{ marginBottom: '32px', border: 'none' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <Text strong style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>
                    <FileTextOutlined style={{ marginRight: '8px' }} />
                    WHAT ARE YOU WORKING ON?
                  </Text>
                  <Input
                    placeholder="E.g. Designing user profile"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    onPressEnter={handleAddTask}
                    size="large"
                  />
                </div>

                <div style={{ width: '240px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <Text strong style={{ color: 'var(--text-muted)' }}>
                      <FolderOutlined style={{ marginRight: '8px' }} />
                      PROJECT
                    </Text>
                    <Button
                      type="link"
                      size="small"
                      onClick={() => setIsAddingProject(!isAddingProject)}
                      style={{ padding: 0, height: 'auto', fontSize: '12px' }}
                    >
                      {isAddingProject ? 'Cancel' : 'New Project'}
                    </Button>
                  </div>

                  {isAddingProject ? (
                    <Input.Search
                      placeholder="Project name"
                      enterButton={<PlusOutlined />}
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      onSearch={handleAddProject}
                    />
                  ) : (
                    <Select
                      style={{ width: '100%' }}
                      placeholder="Select Project"
                      value={selectedProjectId}
                      onChange={setSelectedProjectId}
                      size="large"
                    >
                      {projects?.map((p: any) => (
                        <Option key={p.id} value={p.id}>{p.name}</Option>
                      ))}
                    </Select>
                  )}
                </div>

                <div style={{ paddingTop: '32px' }}>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddTask}
                    className="primary-button"
                  >
                    Log Job
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
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}
            >
              Export CSV
            </Button>
          </div>

          <Card className="glass-card" bodyStyle={{ padding: 0 }} style={{ border: 'none' }}>
            <Table
              dataSource={tasks}
              columns={columns}
              rowKey="id"
              pagination={{ pageSize: 10, position: ['bottomCenter'] }}
              locale={{ emptyText: <div style={{ padding: '40px', color: 'var(--text-muted)' }}>No tasks logged yet. Start working!</div> }}
            />
          </Card>
        </Content>
      </Layout>
    </ConfigProvider>
  );
};

export default App;
