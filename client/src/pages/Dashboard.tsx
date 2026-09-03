import React, { useEffect, useState, useCallback } from 'react';
import { Typography, Tabs, Empty, Spin, message } from 'antd';
import { SonamBanner } from '../components/SonamBanner';
import { QuickTaskInput } from '../components/QuickTaskInput';
import { StatsOverview } from '../components/StatsOverview';
import { TaskCard } from '../components/TaskCard';
import { statsService } from '../services/statsService';
import { taskService } from '../services/taskService';
import { projectService } from '../services/projectService';
import { SonamDashboardSummary, Project, SnoozeTaskDTO } from '@sonam/shared';
import { FireOutlined, CalendarOutlined, WarningOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useTheme } from '../context/ThemeContext';

const { Title, Text } = Typography;

export const Dashboard: React.FC = () => {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const redPrimary = isDark ? '#ef4444' : '#dc2626';

  const [summary, setSummary] = useState<SonamDashboardSummary | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [sumData, projData] = await Promise.all([
        statsService.getDashboardSummary(),
        projectService.getProjects(),
      ]);
      setSummary(sumData);
      setProjects(projData);
    } catch (err: any) {
      message.error(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateTask = async (taskData: any) => {
    await taskService.createTask(taskData);
    await fetchData();
  };

  const handleComplete = async (taskId: string) => {
    await taskService.completeTask(taskId);
    message.success('Task marked completed!');
    await fetchData();
  };

  const handleSnooze = async (taskId: string, dto: SnoozeTaskDTO) => {
    await taskService.snoozeTask(taskId, dto);
    message.info('Task reminder snoozed');
    await fetchData();
  };

  const handleReschedule = async (taskId: string, newDeadline: string) => {
    await taskService.rescheduleTask(taskId, { newDeadline });
    message.success('Task deadline updated');
    await fetchData();
  };

  const handleDelete = async (taskId: string) => {
    await taskService.deleteTask(taskId);
    message.success('Task deleted');
    await fetchData();
  };

  if (loading && !summary) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <Spin size="large" tip="Sonam is organizing your schedule..." />
      </div>
    );
  }

  const { doNowTasks = [], upcomingTasks = [], overdueTasks = [], recentlyCompletedTasks = [], stats } =
    summary || {
      stats: { todayCount: 0, completedCount: 0, pendingCount: 0, overdueCount: 0, urgentCount: 0 },
    };

  const tabItems = [
    {
      key: 'donow',
      label: (
        <span>
          <FireOutlined style={{ color: redPrimary, marginRight: 6 }} /> Do Now <span style={{ fontWeight: 700 }}>({doNowTasks.length})</span>
        </span>
      ),
      children:
        doNowTasks.length > 0 ? (
          doNowTasks.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              onComplete={handleComplete}
              onSnooze={handleSnooze}
              onReschedule={handleReschedule}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <Empty description="No urgent tasks right now. Great job!" style={{ padding: '30px 0' }} />
        ),
    },
    {
      key: 'upcoming',
      label: (
        <span>
          <CalendarOutlined style={{ color: redPrimary, marginRight: 6 }} /> Upcoming <span style={{ fontWeight: 700 }}>({upcomingTasks.length})</span>
        </span>
      ),
      children:
        upcomingTasks.length > 0 ? (
          upcomingTasks.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              onComplete={handleComplete}
              onSnooze={handleSnooze}
              onReschedule={handleReschedule}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <Empty description="No upcoming tasks." style={{ padding: '30px 0' }} />
        ),
    },
    {
      key: 'overdue',
      label: (
        <span>
          <WarningOutlined style={{ color: '#dc2626', marginRight: 6 }} /> Overdue <span style={{ fontWeight: 700, color: overdueTasks.length > 0 ? '#ef4444' : 'inherit' }}>({overdueTasks.length})</span>
        </span>
      ),
      children:
        overdueTasks.length > 0 ? (
          overdueTasks.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              onComplete={handleComplete}
              onSnooze={handleSnooze}
              onReschedule={handleReschedule}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <Empty description="No overdue tasks. All caught up!" style={{ padding: '30px 0' }} />
        ),
    },
    {
      key: 'completed',
      label: (
        <span>
          <CheckCircleOutlined style={{ color: '#10b981', marginRight: 6 }} /> Completed <span style={{ fontWeight: 700 }}>({recentlyCompletedTasks.length})</span>
        </span>
      ),
      children:
        recentlyCompletedTasks.length > 0 ? (
          recentlyCompletedTasks.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              onComplete={handleComplete}
              onSnooze={handleSnooze}
              onReschedule={handleReschedule}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <Empty description="No completed tasks yet." style={{ padding: '30px 0' }} />
        ),
    },
  ];

  return (
    <div>
      {/* Header Sonam Banner */}
      <SonamBanner summary={summary} loading={loading} />

      {/* Prominent Quick Task Input */}
      <QuickTaskInput projects={projects} onTaskCreated={handleCreateTask} />

      {/* KPI Counters */}
      <StatsOverview stats={stats} />

      {/* Segmented Task Dashboard */}
      <div
        style={{
          background: isDark ? '#18181b' : '#ffffff',
          borderRadius: 16,
          padding: '20px 24px',
          border: `1px solid ${isDark ? '#27272a' : '#e2e8f0'}`,
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 2px 10px rgba(0,0,0,0.02)',
        }}
      >
        <Tabs defaultActiveKey="donow" items={tabItems} size="large" />
      </div>
    </div>
  );
};
