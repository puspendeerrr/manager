import React, { useState, useEffect } from 'react';
import { Input, Button, Card, Tag, Typography, Space, Spin, Modal, message as antMessage } from 'antd';
import {
  SendOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  FireOutlined,
  CalendarOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { taskService as taskClientService } from '../services/taskService';
import { aiService as aiClientService } from '../services/aiService';
import { ReminderNotificationModal } from '../components/ReminderNotificationModal';
import { ScheduleTaskModal } from '../components/ScheduleTaskModal';
import { Task, TaskStatus } from '@sonam/shared';
import { useTheme } from '../context/ThemeContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export const TasksPage: React.FC = () => {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const redPrimary = isDark ? '#ef4444' : '#dc2626';
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [naturalInput, setNaturalInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Active Reminder Alert state
  const [dueTaskAlert, setDueTaskAlert] = useState<Task | null>(null);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);

  // Schedule Task Modal state (for new task creation and edit)
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [pendingCleanTitle, setPendingCleanTitle] = useState('');
  const [pendingSuggestedDate, setPendingSuggestedDate] = useState<string | null>(null);
  const [pendingSuggestedTime, setPendingSuggestedTime] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const list = await taskClientService.getTasks();
      setTasks(list);

      const now = dayjs();
      const dueTask = list.find(
        (t) =>
          t.status !== TaskStatus.COMPLETED &&
          t.status !== TaskStatus.CANCELLED &&
          t.nextReminderAt &&
          dayjs(t.nextReminderAt).isBefore(now)
      );

      if (dueTask && !reminderModalOpen) {
        setDueTaskAlert(dueTask);
        setReminderModalOpen(true);
      }
    } catch (err: any) {
      antMessage.error(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleNaturalSubmit = async () => {
    if (!naturalInput.trim()) return;
    try {
      setSubmitting(true);
      const res = await aiClientService.parseTask(naturalInput);
      setPendingCleanTitle(res.cleanedTitle || naturalInput);
      setPendingSuggestedDate(res.suggestedDateIso || dayjs().format('YYYY-MM-DD'));
      setPendingSuggestedTime(res.suggestedTimeStr || null);
      setEditingTask(null);
      setScheduleModalOpen(true);
    } catch (err: any) {
      antMessage.error(err.message || 'Failed to parse task input');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveScheduledTask = async (data: { title: string; deadlineIso: string; repeatMins: number }) => {
    try {
      if (editingTask) {
        await taskClientService.updateTask(editingTask.id, {
          title: data.title,
          deadline: data.deadlineIso,
          nextReminderAt: data.deadlineIso,
          repeatReminderMins: data.repeatMins,
        });
        antMessage.success(`Task "${data.title}" updated!`);
      } else {
        await taskClientService.createTask({
          title: data.title,
          deadline: data.deadlineIso,
          nextReminderAt: data.deadlineIso,
          repeatReminderMins: data.repeatMins,
          keepReminding: true,
        });
        antMessage.success(
          `Task added: ${data.title} | ${dayjs(data.deadlineIso).format('MMM D · h:mm A')} | Reminding every ${data.repeatMins}m until finished.`
        );
      }
      setScheduleModalOpen(false);
      setNaturalInput('');
      fetchTasks();
    } catch (err: any) {
      antMessage.error(err.message || 'Failed to save task');
    }
  };

  const handleComplete = async (taskId: string) => {
    try {
      await taskClientService.completeTask(taskId);
      antMessage.success('Task marked COMPLETED!');
      setReminderModalOpen(false);
      fetchTasks();
    } catch (err: any) {
      antMessage.error(err.message || 'Failed to complete task');
    }
  };

  const handleSnooze = async (taskId: string, mins: number = 10) => {
    try {
      await taskClientService.snoozeTask(taskId, { duration: '10m', customMinutes: mins });
      antMessage.info(`Remind scheduled in ${mins} minutes!`);
      setReminderModalOpen(false);
      fetchTasks();
    } catch (err: any) {
      antMessage.error(err.message || 'Failed to snooze task');
    }
  };

  const handleStopReminders = async (taskId: string) => {
    try {
      await taskClientService.updateTask(taskId, { keepReminding: false, nextReminderAt: null });
      antMessage.info('Repeating reminders stopped for this task.');
      setReminderModalOpen(false);
      fetchTasks();
    } catch (err: any) {
      antMessage.error(err.message || 'Failed to stop reminders');
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      await taskClientService.deleteTask(taskId);
      antMessage.success('Task deleted');
      fetchTasks();
    } catch (err: any) {
      antMessage.error(err.message || 'Failed to delete task');
    }
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setPendingCleanTitle(task.title);
    setPendingSuggestedDate(task.deadline ? dayjs(task.deadline).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'));
    setPendingSuggestedTime(task.deadline ? dayjs(task.deadline).format('HH:mm') : null);
    setScheduleModalOpen(true);
  };

  // Categorize tasks
  const now = dayjs();
  const todayTasks = tasks.filter(
    (t) =>
      t.status !== TaskStatus.COMPLETED &&
      t.status !== TaskStatus.CANCELLED &&
      t.deadline &&
      dayjs(t.deadline).isSame(now, 'day')
  );

  const upcomingTasks = tasks.filter(
    (t) =>
      t.status !== TaskStatus.COMPLETED &&
      t.status !== TaskStatus.CANCELLED &&
      (!t.deadline || dayjs(t.deadline).isAfter(now, 'day'))
  );

  const overdueTasks = tasks.filter(
    (t) =>
      t.status !== TaskStatus.COMPLETED &&
      t.status !== TaskStatus.CANCELLED &&
      t.deadline &&
      dayjs(t.deadline).isBefore(now, 'day')
  );

  const completedTasks = tasks.filter((t) => t.status === TaskStatus.COMPLETED).slice(0, 10);

  const renderTaskCard = (task: Task) => (
    <Card
      key={task.id}
      style={{
        borderRadius: 12,
        marginBottom: 12,
        border: `1px solid ${isDark ? '#27272a' : '#e2e8f0'}`,
        background: isDark ? '#18181b' : '#ffffff',
        boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.03)',
      }}
      bodyStyle={{ padding: '16px 20px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1, marginRight: 16 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: task.status === TaskStatus.COMPLETED ? (isDark ? '#6b7280' : '#94a3b8') : isDark ? '#f8fafc' : '#0f172a',
              textDecoration: task.status === TaskStatus.COMPLETED ? 'line-through' : 'none',
              display: 'block',
            }}
          >
            {task.title}
          </Text>

          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {task.deadline && (
              <Tag color={dayjs(task.deadline).isBefore(now) && task.status !== TaskStatus.COMPLETED ? 'red' : 'blue'}>
                Due: {dayjs(task.deadline).format('MMM D, h:mm A')}
              </Tag>
            )}

            {task.priority === 'HIGH' || task.priority === 'URGENT' ? <Tag color="volcano">HIGH</Tag> : null}
            {task.nextReminderAt && task.status !== TaskStatus.COMPLETED && (
              <Text type="secondary" style={{ fontSize: 12, color: isDark ? '#9ca3af' : '#64748b' }}>
                <ClockCircleOutlined style={{ marginRight: 4, color: redPrimary }} /> Repeats every 30m
              </Text>
            )}
          </div>
        </div>

        <Space size="small">
          {task.status !== TaskStatus.COMPLETED && (
            <>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                size="small"
                onClick={() => handleComplete(task.id)}
                style={{ background: '#10b981', borderColor: '#10b981', borderRadius: 6, fontWeight: 700 }}
              >
                Done
              </Button>

              <Button icon={<ClockCircleOutlined />} size="small" onClick={() => handleSnooze(task.id, 10)} style={{ borderRadius: 6 }}>
                Snooze 10m
              </Button>
            </>
          )}

          <Button icon={<EditOutlined />} size="small" onClick={() => handleOpenEdit(task)} style={{ borderRadius: 6 }} />

          <Button icon={<DeleteOutlined />} danger size="small" onClick={() => handleDelete(task.id)} style={{ borderRadius: 6 }} />
        </Space>
      </div>
    </Card>
  );

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', paddingBottom: 40 }}>
      {/* Top Header & Input Bar */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <Title level={2} style={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 800, margin: 0 }}>
          Hi, what do you need to do?
        </Title>
        <Text style={{ color: isDark ? '#9ca3af' : '#64748b', fontSize: 15 }}>
          Enter work title below. You choose exact date & time in the schedule popup!
        </Text>
      </div>

      <div
        style={{
          background: isDark ? '#18181b' : '#ffffff',
          borderRadius: 16,
          padding: '6px 6px 6px 12px',
          boxShadow: isDark ? '0 10px 25px -5px rgba(239, 68, 68, 0.2)' : '0 10px 25px -5px rgba(220, 38, 38, 0.12)',
          marginBottom: 32,
          border: `2px solid ${redPrimary}`,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Input
          placeholder="e.g. Aaj qcskt k vendor final krna h tshirt ka..."
          variant="borderless"
          size="large"
          value={naturalInput}
          onChange={(e) => setNaturalInput(e.target.value)}
          onPressEnter={handleNaturalSubmit}
          style={{
            flex: 1,
            fontSize: 15,
            outline: 'none',
            color: isDark ? '#f8fafc' : '#0f172a',
          }}
        />
        <Button
          type="primary"
          loading={submitting}
          icon={<SendOutlined />}
          onClick={handleNaturalSubmit}
          style={{
            height: 46,
            background: redPrimary,
            border: 'none',
            borderRadius: 12,
            fontWeight: 700,
            padding: '0 24px',
            fontSize: 15,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          Add Task
        </Button>
      </div>

      {/* Task Sections */}
      {loading ? (
        <Card style={{ textAlign: 'center', padding: '40px 0', borderRadius: 16, background: isDark ? '#18181b' : '#ffffff' }}>
          <Spin size="large" tip="Loading your tasks & active reminders..." />
        </Card>
      ) : (
        <>
          {/* TODAY */}
          <div style={{ marginBottom: 28 }}>
            <Title level={4} style={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 800, marginBottom: 12 }}>
              <FireOutlined style={{ color: '#ef4444', marginRight: 8 }} /> TODAY ({todayTasks.length})
            </Title>
            {todayTasks.length === 0 ? (
              <Text type="secondary" style={{ display: 'block', padding: '12px 0' }}>
                No tasks scheduled for today. Enter work above to add one!
              </Text>
            ) : (
              todayTasks.map(renderTaskCard)
            )}
          </div>

          {/* OVERDUE */}
          {overdueTasks.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <Title level={4} style={{ color: '#dc2626', fontWeight: 800, marginBottom: 12 }}>
                <WarningOutlined style={{ color: '#dc2626', marginRight: 8 }} /> OVERDUE ({overdueTasks.length})
              </Title>
              {overdueTasks.map(renderTaskCard)}
            </div>
          )}

          {/* UPCOMING */}
          <div style={{ marginBottom: 28 }}>
            <Title level={4} style={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 800, marginBottom: 12 }}>
              <CalendarOutlined style={{ color: redPrimary, marginRight: 8 }} /> UPCOMING ({upcomingTasks.length})
            </Title>
            {upcomingTasks.length === 0 ? (
              <Text type="secondary" style={{ display: 'block', padding: '12px 0' }}>
                No upcoming tasks scheduled.
              </Text>
            ) : (
              upcomingTasks.map(renderTaskCard)
            )}
          </div>

          {/* COMPLETED */}
          {completedTasks.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <Title level={4} style={{ color: '#64748b', fontWeight: 800, marginBottom: 12 }}>
                <CheckCircleOutlined style={{ color: '#10b981', marginRight: 8 }} /> COMPLETED ({completedTasks.length})
              </Title>
              {completedTasks.map(renderTaskCard)}
            </div>
          )}
        </>
      )}

      {/* Explicit Schedule Task Modal */}
      <ScheduleTaskModal
        open={scheduleModalOpen}
        initialTitle={pendingCleanTitle}
        initialDateIso={pendingSuggestedDate}
        initialTimeStr={pendingSuggestedTime}
        repeatMins={editingTask?.repeatReminderMins || 30}
        onSave={handleSaveScheduledTask}
        onCancel={() => setScheduleModalOpen(false)}
      />

      {/* Reminder Alert Popup */}
      <ReminderNotificationModal
        open={reminderModalOpen}
        task={dueTaskAlert}
        onDone={handleComplete}
        onSnooze={handleSnooze}
        onStopReminders={handleStopReminders}
        onClose={() => setReminderModalOpen(false)}
      />
    </div>
  );
};
