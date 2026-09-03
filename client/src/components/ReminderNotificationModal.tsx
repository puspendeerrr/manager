import React, { useEffect } from 'react';
import { Modal, Button, Typography, Space } from 'antd';
import { BellOutlined, CheckOutlined, ClockCircleOutlined, BellFilled } from '@ant-design/icons';
import { Task } from '@sonam/shared';
import { useTheme } from '../context/ThemeContext';

const { Title, Text } = Typography;

interface ReminderNotificationModalProps {
  task: Task | null;
  open: boolean;
  onDone: (taskId: string) => void;
  onSnooze: (taskId: string, mins: number) => void;
  onStopReminders: (taskId: string) => void;
  onClose: () => void;
}

export const ReminderNotificationModal: React.FC<ReminderNotificationModalProps> = ({
  task,
  open,
  onDone,
  onSnooze,
  onStopReminders,
  onClose,
}) => {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const redPrimary = isDark ? '#ef4444' : '#dc2626';

  useEffect(() => {
    if (open && task && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`Sonam Reminder: ${task.title}`, {
          body: 'This task is due! Click to view details and mark Done.',
          icon: '/favicon.ico',
        });
      } catch (err) {
        console.warn('Browser notification trigger warning:', err);
      }
    }
  }, [open, task]);

  if (!task) return null;

  return (
    <Modal
      open={open}
      footer={null}
      onCancel={onClose}
      centered
      width={460}
      style={{ borderRadius: 16 }}
      bodyStyle={{ padding: '28px', textAlign: 'center' }}
    >
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: 30,
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto',
          color: 'white',
          fontSize: 30,
          boxShadow: '0 8px 24px rgba(239, 68, 68, 0.4)',
        }}
      >
        <BellOutlined />
      </div>

      <Text type="secondary" style={{ textTransform: 'uppercase', letterSpacing: 1, fontWeight: 800, fontSize: 12 }}>
        <BellOutlined style={{ marginRight: 6, color: redPrimary }} /> Sonam Persistent Reminder
      </Text>

      <Title level={3} style={{ margin: '8px 0 16px 0', color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 800 }}>
        {task.title}
      </Title>

      <Text style={{ display: 'block', color: isDark ? '#9ca3af' : '#64748b', marginBottom: 24, fontSize: 14 }}>
        This task is due. Sonam will keep reminding you every 30 mins until completed.
      </Text>

      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Button
          type="primary"
          icon={<CheckOutlined />}
          size="large"
          block
          onClick={() => onDone(task.id)}
          style={{
            background: '#10b981',
            borderColor: '#10b981',
            fontWeight: 800,
            borderRadius: 10,
            height: 48,
            fontSize: 16,
          }}
        >
          Done (Complete & Stop Reminders)
        </Button>

        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Button
            icon={<ClockCircleOutlined />}
            size="middle"
            onClick={() => onSnooze(task.id, 10)}
            style={{ borderRadius: 8, fontWeight: 700, borderColor: redPrimary, color: redPrimary }}
          >
            Snooze 10m
          </Button>

          <Button
            icon={<ClockCircleOutlined />}
            size="middle"
            onClick={() => onSnooze(task.id, 30)}
            style={{ borderRadius: 8, fontWeight: 700, borderColor: redPrimary, color: redPrimary }}
          >
            Snooze 30m
          </Button>

          <Button
            icon={<BellFilled />}
            size="middle"
            onClick={() => onStopReminders(task.id)}
            style={{ borderRadius: 8, fontWeight: 700, color: isDark ? '#9ca3af' : '#64748b' }}
          >
            Stop Reminders
          </Button>
        </Space>
      </Space>
    </Modal>
  );
};
