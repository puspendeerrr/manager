import React, { useState } from 'react';
import { App, Card, Tag, Button, Space, Typography } from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  CalendarOutlined,
  FlagOutlined,
  CheckCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { AiActionCardPayload } from '@sonam/shared';
import { taskService } from '../services/taskService';
import { useTheme } from '../context/ThemeContext';
import dayjs from 'dayjs';

const { Text } = Typography;

interface ActionCardProps {
  action: AiActionCardPayload;
  onActionComplete?: () => void;
}

export const ActionCard: React.FC<ActionCardProps> = ({ action, onActionComplete }) => {
  const { message: antMessage } = App.useApp();
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const redPrimary = isDark ? '#ef4444' : '#dc2626';

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>(action.status || 'PENDING_CONFIRMATION');

  const handleConfirm = async () => {
    setLoading(true);
    try {
      if (action.type === 'CREATE_TASK' && action.data.taskTitle) {
        await taskService.createTask({
          title: action.data.taskTitle,
          description: action.data.description,
          deadline: action.data.deadline || undefined,
          priority: action.data.priority,
        });
        antMessage.success('Task created successfully!');
      } else if (action.type === 'COMPLETE_TASK' && action.data.taskId) {
        await taskService.completeTask(action.data.taskId);
        antMessage.success('Task marked completed!');
      } else if (action.type === 'SNOOZE_TASK' && action.data.taskId) {
        await taskService.snoozeTask(action.data.taskId, {
          duration: 'custom',
          customMinutes: action.data.snoozeMinutes || 30,
        });
        antMessage.success('Task snoozed!');
      } else if (action.type === 'RESCHEDULE_TASK' && action.data.taskId && action.data.newDeadline) {
        await taskService.rescheduleTask(action.data.taskId, { newDeadline: action.data.newDeadline });
        antMessage.success('Task rescheduled!');
      } else if (action.type === 'STOP_REMINDERS' && action.data.taskId) {
        await taskService.updateTask(action.data.taskId, { keepReminding: false, nextReminderAt: null });
        antMessage.success('Reminders stopped!');
      } else {
        antMessage.info('Action processed!');
      }

      setStatus('SUCCESS');
      if (onActionComplete) onActionComplete();
    } catch (err: any) {
      antMessage.error(err.message || 'Action failed');
      setStatus('FAILED');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setStatus('CANCELLED');
    antMessage.info('Action cancelled');
  };

  const renderStatusBadge = () => {
    switch (status) {
      case 'SUCCESS':
        return <Tag color="success" icon={<CheckCircleOutlined />}>DONE</Tag>;
      case 'FAILED':
        return <Tag color="error">FAILED</Tag>;
      case 'CANCELLED':
        return <Tag color="default">CANCELLED</Tag>;
      case 'EXECUTING':
        return <Tag color="processing" icon={<SyncOutlined spin />}>EXECUTING</Tag>;
      default:
        return <Tag color="warning">CONFIRMATION REQUIRED</Tag>;
    }
  };

  return (
    <Card
      size="small"
      style={{
        borderRadius: 12,
        borderColor: status === 'PENDING_CONFIRMATION' ? redPrimary : isDark ? '#27272a' : '#e2e8f0',
        background: status === 'PENDING_CONFIRMATION' ? (isDark ? '#450a0a' : '#fef2f2') : (isDark ? '#18181b' : '#ffffff'),
        marginTop: 8,
        marginBottom: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a' }}>{action.title}</Text>
        {renderStatusBadge()}
      </div>

      {action.description && (
        <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
          {action.description}
        </Text>
      )}

      <Space wrap style={{ marginBottom: 12, fontSize: 12 }}>
        {action.data.taskTitle && (
          <Tag color="red">{action.data.taskTitle}</Tag>
        )}
        {action.data.deadline && (
          <Tag icon={<CalendarOutlined />} color="blue">
            {dayjs(action.data.deadline).format('MMM D, YYYY h:mm A')}
          </Tag>
        )}
        {action.data.priority && (
          <Tag icon={<FlagOutlined />} color={action.data.priority === 'HIGH' || action.data.priority === 'URGENT' ? 'red' : 'blue'}>
            {action.data.priority}
          </Tag>
        )}
      </Space>

      {status === 'PENDING_CONFIRMATION' && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <Button size="small" icon={<CloseOutlined />} onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            loading={loading}
            onClick={handleConfirm}
            style={{ background: redPrimary, border: 'none', borderRadius: 6, fontWeight: 700 }}
          >
            Confirm & Execute
          </Button>
        </div>
      )}
    </Card>
  );
};
