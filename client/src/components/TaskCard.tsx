import React, { useState } from 'react';
import { Card, Tag, Button, Popover, Modal, DatePicker, Space, Typography, Dropdown, MenuProps } from 'antd';
import {
  CheckOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  MoreOutlined,
  DeleteOutlined,
  FolderOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  HourglassOutlined,
} from '@ant-design/icons';
import { Task, TaskPriority, TaskStatus, SnoozeTaskDTO } from '@sonam/shared';
import { useTheme } from '../context/ThemeContext';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text } = Typography;

interface TaskCardProps {
  task: Task;
  onComplete: (taskId: string) => Promise<void>;
  onSnooze: (taskId: string, dto: SnoozeTaskDTO) => Promise<void>;
  onReschedule: (taskId: string, newDeadline: string) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onComplete,
  onSnooze,
  onReschedule,
  onDelete,
}) => {
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [newDeadline, setNewDeadline] = useState<dayjs.Dayjs | null>(
    task.deadline ? dayjs(task.deadline) : null
  );
  const [loading, setLoading] = useState(false);

  const isCompleted = task.status === TaskStatus.COMPLETED;
  const isOverdue = task.status === TaskStatus.OVERDUE;

  const getPriorityTag = (p: TaskPriority) => {
    switch (p) {
      case TaskPriority.URGENT:
        return <Tag color="error" style={{ fontWeight: 700 }}>URGENT</Tag>;
      case TaskPriority.HIGH:
        return <Tag color="warning" style={{ fontWeight: 700 }}>HIGH</Tag>;
      case TaskPriority.MEDIUM:
        return <Tag color="processing" style={{ fontWeight: 600 }}>MEDIUM</Tag>;
      case TaskPriority.LOW:
      default:
        return <Tag color="default">LOW</Tag>;
    }
  };

  const getStatusBadge = (s: TaskStatus) => {
    switch (s) {
      case TaskStatus.COMPLETED:
        return <Tag color="success" icon={<CheckCircleOutlined />} style={{ borderRadius: 12 }}>Completed</Tag>;
      case TaskStatus.OVERDUE:
        return <Tag color="error" icon={<WarningOutlined />} style={{ borderRadius: 12 }}>Overdue</Tag>;
      case TaskStatus.SNOOZED:
        return <Tag color="purple" icon={<ClockCircleOutlined />} style={{ borderRadius: 12 }}>Snoozed</Tag>;
      case TaskStatus.IN_PROGRESS:
        return <Tag color="processing" icon={<HourglassOutlined />} style={{ borderRadius: 12 }}>In Progress</Tag>;
      case TaskStatus.PENDING:
      default:
        return <Tag color="blue" style={{ borderRadius: 12 }}>Pending</Tag>;
    }
  };

  const handleDone = async () => {
    try {
      setLoading(true);
      await onComplete(task.id);
    } finally {
      setLoading(false);
    }
  };

  const handleSnoozeOption = async (duration: '15m' | '30m' | '1h' | '2h' | 'tomorrow') => {
    try {
      setLoading(true);
      await onSnooze(task.id, { duration });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReschedule = async () => {
    if (!newDeadline) return;
    try {
      setLoading(true);
      await onReschedule(task.id, newDeadline.toISOString());
      setRescheduleModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const snoozeContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 140 }}>
      <Button type="text" size="small" icon={<ClockCircleOutlined />} onClick={() => handleSnoozeOption('15m')}>15 Minutes</Button>
      <Button type="text" size="small" icon={<ClockCircleOutlined />} onClick={() => handleSnoozeOption('30m')}>30 Minutes</Button>
      <Button type="text" size="small" icon={<ClockCircleOutlined />} onClick={() => handleSnoozeOption('1h')}>1 Hour</Button>
      <Button type="text" size="small" icon={<ClockCircleOutlined />} onClick={() => handleSnoozeOption('2h')}>2 Hours</Button>
      <Button type="text" size="small" icon={<CalendarOutlined />} onClick={() => handleSnoozeOption('tomorrow')}>Tomorrow (9:00 AM)</Button>
    </div>
  );

  const moreMenu: MenuProps = {
    items: [
      {
        key: 'delete',
        label: 'Delete Task',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => onDelete(task.id),
      },
    ],
  };

  return (
    <Card
      style={{
        borderRadius: 14,
        marginBottom: 12,
        border: isOverdue ? (isDark ? '1px solid #7f1d1d' : '1px solid #fca5a5') : `1px solid ${isDark ? '#27272a' : '#e2e8f0'}`,
        background: isCompleted ? (isDark ? '#111113' : '#f8fafc') : isDark ? '#18181b' : '#ffffff',
        boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.03)',
        opacity: isCompleted ? 0.75 : 1,
      }}
      bodyStyle={{ padding: '16px 20px' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <Space size={6} wrap style={{ marginBottom: 6 }}>
            {getStatusBadge(task.status)}
            {getPriorityTag(task.priority)}
            {task.project && (
              <Tag icon={<FolderOutlined />} color={task.project.color || 'default'} style={{ borderRadius: 6 }}>
                {task.project.name}
              </Tag>
            )}
          </Space>

          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: isCompleted ? (isDark ? '#6b7280' : '#64748b') : isDark ? '#f8fafc' : '#0f172a',
              textDecoration: isCompleted ? 'line-through' : 'none',
              marginBottom: 4,
            }}
          >
            {task.title}
          </div>

          {task.description && (
            <Text style={{ color: isDark ? '#9ca3af' : '#64748b', fontSize: 13, display: 'block', marginBottom: 8 }}>
              {task.description}
            </Text>
          )}

          {task.deadline && (
            <div style={{ fontSize: 12, fontWeight: 600, color: isOverdue ? '#ef4444' : isDark ? '#9ca3af' : '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
              <ClockCircleOutlined />
              <span>
                Deadline: {dayjs(task.deadline).format('MMM D, YYYY h:mm A')} ({dayjs(task.deadline).fromNow()})
              </span>
            </div>
          )}
        </div>

        <Dropdown menu={moreMenu} trigger={['click']}>
          <Button type="text" shape="circle" icon={<MoreOutlined style={{ color: isDark ? '#9ca3af' : '#64748b' }} />} />
        </Dropdown>
      </div>

      {/* Touch-Friendly Actions Toolbar */}
      {!isCompleted && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: `1px solid ${isDark ? '#27272a' : '#f1f5f9'}`,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <Button
            type="primary"
            icon={<CheckOutlined />}
            size="middle"
            loading={loading}
            onClick={handleDone}
            style={{
              background: '#10b981',
              borderColor: '#10b981',
              borderRadius: 8,
              fontWeight: 700,
            }}
          >
            Done
          </Button>

          <Popover content={snoozeContent} title="Snooze Reminder" trigger="click" placement="top">
            <Button icon={<ClockCircleOutlined />} size="middle" style={{ borderRadius: 8, fontWeight: 600 }}>
              Snooze
            </Button>
          </Popover>

          <Button
            icon={<CalendarOutlined />}
            size="middle"
            onClick={() => setRescheduleModalOpen(true)}
            style={{ borderRadius: 8, fontWeight: 600 }}
          >
            Reschedule
          </Button>
        </div>
      )}

      {/* Reschedule Modal */}
      <Modal
        title="Reschedule Task"
        open={rescheduleModalOpen}
        onOk={handleConfirmReschedule}
        onCancel={() => setRescheduleModalOpen(false)}
        okText="Update Deadline"
        confirmLoading={loading}
      >
        <p style={{ marginBottom: 12, color: isDark ? '#9ca3af' : '#475569' }}>Select a new deadline date and time for this task:</p>
        <DatePicker
          showTime={{ format: 'HH:mm' }}
          format="YYYY-MM-DD HH:mm"
          value={newDeadline}
          onChange={setNewDeadline}
          style={{ width: '100%' }}
        />
      </Modal>
    </Card>
  );
};
