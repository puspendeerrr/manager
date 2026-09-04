import React, { useEffect, useState, useCallback } from 'react';
import { Typography, Calendar as AntCalendar, Card, Button, Modal, Tag, Space, Spin, message as antMessage } from 'antd';
import {
  CalendarOutlined,
  PlusOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  FireOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { taskService } from '../services/taskService';
import { Task, TaskStatus } from '@sonam/shared';
import { useTheme } from '../context/ThemeContext';
import { ScheduleTaskModal } from '../components/ScheduleTaskModal';
import { ReminderNotificationModal } from '../components/ReminderNotificationModal';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const redPrimary = isDark ? '#ef4444' : '#dc2626';

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Edit / Snooze modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [snoozeModalOpen, setSnoozeModalOpen] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const list = await taskService.getTasks();
      setTasks(list);
    } catch (err: any) {
      antMessage.error(err.message || 'Failed to load scheduled tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleComplete = async (taskId: string) => {
    try {
      await taskService.completeTask(taskId);
      antMessage.success('Task marked completed!');
      setDetailModalOpen(false);
      fetchTasks();
    } catch (err: any) {
      antMessage.error(err.message || 'Failed to complete task');
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      await taskService.deleteTask(taskId);
      antMessage.success('Task deleted');
      setDetailModalOpen(false);
      fetchTasks();
    } catch (err: any) {
      antMessage.error(err.message || 'Failed to delete task');
    }
  };

  const handleSaveEdit = async (data: { title: string; deadlineIso: string; repeatMins: number }) => {
    if (!selectedTask) return;
    try {
      await taskService.updateTask(selectedTask.id, {
        title: data.title,
        deadline: data.deadlineIso,
        nextReminderAt: data.deadlineIso,
        repeatReminderMins: data.repeatMins,
      });
      antMessage.success('Task updated!');
      setEditModalOpen(false);
      setDetailModalOpen(false);
      fetchTasks();
    } catch (err: any) {
      antMessage.error(err.message || 'Failed to update task');
    }
  };

  const dateCellRender = (value: dayjs.Dayjs) => {
    const dateStr = value.format('YYYY-MM-DD');
    const dayTasks = tasks.filter(
      (t) => t.deadline && dayjs(t.deadline).format('YYYY-MM-DD') === dateStr
    );

    if (dayTasks.length === 0) return null;

    return (
      <div style={{ marginTop: 4 }}>
        {dayTasks.slice(0, 3).map((t) => (
          <div
            key={t.id}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTask(t);
              setDetailModalOpen(true);
            }}
            style={{
              background: t.status === TaskStatus.COMPLETED ? (isDark ? '#064e3b' : '#ecfdf5') : (isDark ? '#7f1d1d' : '#fef2f2'),
              color: t.status === TaskStatus.COMPLETED ? (isDark ? '#34d399' : '#059669') : redPrimary,
              border: `1px solid ${t.status === TaskStatus.COMPLETED ? '#10b981' : redPrimary}`,
              borderRadius: 6,
              padding: '2px 6px',
              fontSize: 11,
              fontWeight: 600,
              marginBottom: 3,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              cursor: 'pointer',
            }}
          >
            {t.status === TaskStatus.COMPLETED ? '✓ ' : '📌 '}{t.title}
          </div>
        ))}
        {dayTasks.length > 3 && (
          <Text style={{ fontSize: 10, color: isDark ? '#9ca3af' : '#64748b', fontWeight: 700 }}>
            +{dayTasks.length - 3} more
          </Text>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Top Calendar Header Banner */}
      <Card
        style={{
          background: isDark ? '#18181b' : '#ffffff',
          borderRadius: 16,
          marginBottom: 24,
          border: `1px solid ${isDark ? '#27272a' : '#e2e8f0'}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Title level={3} style={{ color: isDark ? '#f8fafc' : '#0f172a', margin: 0, fontWeight: 800 }}>
              <CalendarOutlined style={{ color: redPrimary, marginRight: 10 }} />
              Task Calendar
            </Title>
            <Text type="secondary" style={{ fontSize: 14 }}>
              View-only schedule of your personal todo tasks & persistent reminders.
            </Text>
          </div>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => navigate('/tasks')}
            style={{
              background: redPrimary,
              border: 'none',
              borderRadius: 10,
              fontWeight: 700,
            }}
          >
            Go to Tasks to Add Task
          </Button>
        </div>
      </Card>

      {/* Calendar Grid View */}
      <Card
        style={{
          background: isDark ? '#18181b' : '#ffffff',
          borderRadius: 16,
          border: `1px solid ${isDark ? '#27272a' : '#e2e8f0'}`,
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" tip="Loading calendar tasks..." />
          </div>
        ) : (
          <AntCalendar cellRender={dateCellRender} />
        )}
      </Card>

      {/* Task Details Modal */}
      {selectedTask && (
        <Modal
          open={detailModalOpen}
          onCancel={() => setDetailModalOpen(false)}
          footer={null}
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 800, fontSize: 18, color: isDark ? '#f8fafc' : '#0f172a' }}>
                {selectedTask.title}
              </span>
            </div>
          }
          style={{ borderRadius: 16 }}
        >
          <div style={{ padding: '12px 0' }}>
            <p>
              <Text type="secondary">Scheduled Date & Time:</Text>{' '}
              <Text style={{ fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a' }}>
                {selectedTask.deadline ? dayjs(selectedTask.deadline).format('MMMM D, YYYY · h:mm A') : 'No date set'}
              </Text>
            </p>
            <p>
              <Text type="secondary">Repeating Reminder:</Text>{' '}
              <Tag color="red" style={{ fontWeight: 700 }}>
                Every {selectedTask.repeatReminderMins || 30} mins
              </Tag>
            </p>
            <p>
              <Text type="secondary">Status:</Text>{' '}
              <Tag color={selectedTask.status === TaskStatus.COMPLETED ? 'green' : 'gold'} style={{ fontWeight: 700 }}>
                {selectedTask.status}
              </Tag>
            </p>

            <div style={{ marginTop: 24, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {selectedTask.status !== TaskStatus.COMPLETED && (
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => handleComplete(selectedTask.id)}
                  style={{ background: '#10b981', border: 'none', borderRadius: 8, fontWeight: 700 }}
                >
                  Done
                </Button>
              )}
              {selectedTask.status !== TaskStatus.COMPLETED && (
                <Button
                  icon={<ClockCircleOutlined />}
                  onClick={() => setSnoozeModalOpen(true)}
                  style={{ borderRadius: 8, fontWeight: 700 }}
                >
                  Snooze
                </Button>
              )}
              <Button
                icon={<EditOutlined />}
                onClick={() => setEditModalOpen(true)}
                style={{ borderRadius: 8, fontWeight: 700 }}
              >
                Edit
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(selectedTask.id)}
                style={{ borderRadius: 8, fontWeight: 700 }}
              >
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Schedule Modal */}
      {selectedTask && (
        <ScheduleTaskModal
          open={editModalOpen}
          initialTitle={selectedTask.title}
          initialDateIso={selectedTask.deadline || null}
          initialTimeStr={selectedTask.deadline ? dayjs(selectedTask.deadline).format('HH:mm') : null}
          repeatMins={selectedTask.repeatReminderMins || 30}
          onCancel={() => setEditModalOpen(false)}
          onSave={handleSaveEdit}
        />
      )}

      {/* Snooze Modal */}
      {selectedTask && (
        <ReminderNotificationModal
          open={snoozeModalOpen}
          task={selectedTask}
          onClose={() => setSnoozeModalOpen(false)}
          onDone={async () => {
            await handleComplete(selectedTask.id);
            setSnoozeModalOpen(false);
          }}
          onSnooze={async (taskId, mins) => {
            await taskService.snoozeTask(taskId, { duration: '10m', customMinutes: mins });
            antMessage.info(`Task snoozed for ${mins} minutes`);
            setSnoozeModalOpen(false);
            setDetailModalOpen(false);
            fetchTasks();
          }}
          onStopReminders={async (taskId) => {
            await taskService.updateTask(taskId, { keepReminding: false, nextReminderAt: null });
            antMessage.info('Reminders stopped for this task');
            setSnoozeModalOpen(false);
            setDetailModalOpen(false);
            fetchTasks();
          }}
        />
      )}
    </div>
  );
};
