import React, { useState } from 'react';
import { Input, Button, Select, DatePicker, Tooltip, Modal, message, Space } from 'antd';
import {
  SendOutlined,
  AudioOutlined,
  ProjectOutlined,
  ClockCircleOutlined,
  FlagOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons';
import { TaskPriority, ReminderInterval, Project } from '@sonam/shared';
import { useTheme } from '../context/ThemeContext';
import dayjs from 'dayjs';

interface QuickTaskInputProps {
  projects: Project[];
  onTaskCreated: (taskData: {
    title: string;
    description?: string;
    deadline?: string;
    priority?: TaskPriority;
    projectId?: string;
    reminderInterval?: ReminderInterval;
  }) => Promise<void>;
}

export const QuickTaskInput: React.FC<QuickTaskInputProps> = ({ projects, onTaskCreated }) => {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const redPrimary = isDark ? '#ef4444' : '#dc2626';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [deadline, setDeadline] = useState<dayjs.Dayjs | null>(null);
  const [reminderInterval, setReminderInterval] = useState<ReminderInterval | undefined>(ReminderInterval.HOUR_1);

  const [expanded, setExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      message.warning('Please enter a task title');
      return;
    }

    try {
      setSubmitting(true);
      await onTaskCreated({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        projectId: projectId || undefined,
        deadline: deadline ? deadline.toISOString() : undefined,
        reminderInterval,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setPriority(TaskPriority.MEDIUM);
      setDeadline(null);
      setExpanded(false);
      message.success('Task created successfully!');
    } catch (err: any) {
      message.error(err.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      style={{
        background: isDark ? '#18181b' : '#ffffff',
        borderRadius: 16,
        padding: '16px 20px',
        boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.4)' : '0 4px 20px rgba(0, 0, 0, 0.06)',
        border: `1px solid ${isDark ? '#27272a' : '#e2e8f0'}`,
        marginBottom: 24,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Input
          placeholder="Tell Sonam what you need to do... (Press Enter to save)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          size="large"
          variant="borderless"
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: isDark ? '#f8fafc' : '#0f172a',
            paddingLeft: 0,
          }}
          suffix={
            <Space size={8}>
              <Tooltip title="Voice task capture">
                <Button
                  type="text"
                  shape="circle"
                  icon={<AudioOutlined style={{ color: redPrimary, fontSize: 18 }} />}
                  onClick={() => setVoiceModalVisible(true)}
                />
              </Tooltip>
              <Button
                type="text"
                size="small"
                onClick={() => setExpanded(!expanded)}
                style={{ color: isDark ? '#9ca3af' : '#64748b', fontSize: 12, fontWeight: 600 }}
              >
                {expanded ? <UpOutlined /> : <DownOutlined />} More
              </Button>
            </Space>
          }
        />

        <Button
          type="primary"
          shape="circle"
          size="large"
          icon={<SendOutlined />}
          loading={submitting}
          onClick={handleSubmit}
          style={{
            background: redPrimary,
            border: 'none',
            boxShadow: `0 4px 12px ${isDark ? 'rgba(239, 68, 68, 0.4)' : 'rgba(220, 38, 38, 0.3)'}`,
          }}
        />
      </div>

      {/* Expandable Advanced Fields */}
      {expanded && (
        <div
          style={{
            marginTop: 16,
            paddingTop: 16,
            borderTop: `1px solid ${isDark ? '#27272a' : '#f1f5f9'}`,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#9ca3af' : '#64748b', marginBottom: 4 }}>
              <ProjectOutlined /> Project
            </div>
            <Select
              placeholder="Select Project"
              value={projectId}
              onChange={setProjectId}
              allowClear
              style={{ width: '100%' }}
              options={projects.map((p) => ({ label: p.name, value: p.id }))}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#9ca3af' : '#64748b', marginBottom: 4 }}>
              <FlagOutlined /> Priority
            </div>
            <Select
              value={priority}
              onChange={setPriority}
              style={{ width: '100%' }}
              options={[
                { label: 'Low', value: TaskPriority.LOW },
                { label: 'Medium', value: TaskPriority.MEDIUM },
                { label: 'High', value: TaskPriority.HIGH },
                { label: 'Urgent', value: TaskPriority.URGENT },
              ]}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#9ca3af' : '#64748b', marginBottom: 4 }}>
              <ClockCircleOutlined /> Deadline
            </div>
            <DatePicker
              showTime={{ format: 'HH:mm' }}
              format="YYYY-MM-DD HH:mm"
              value={deadline}
              onChange={setDeadline}
              style={{ width: '100%' }}
              placeholder="Select Deadline"
            />
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#9ca3af' : '#64748b', marginBottom: 4 }}>
              Reminder Interval
            </div>
            <Select
              value={reminderInterval}
              onChange={setReminderInterval}
              style={{ width: '100%' }}
              options={[
                { label: 'Every 15 mins', value: ReminderInterval.MINUTES_15 },
                { label: 'Every 30 mins', value: ReminderInterval.MINUTES_30 },
                { label: 'Every 1 hour', value: ReminderInterval.HOUR_1 },
                { label: 'Every 2 hours', value: ReminderInterval.HOURS_2 },
              ]}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <Input.TextArea
              placeholder="Add optional notes or details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              style={{ borderRadius: 8 }}
            />
          </div>
        </div>
      )}

      {/* Voice Input Modal */}
      <Modal
        title="Voice Task Input"
        open={voiceModalVisible}
        onCancel={() => setVoiceModalVisible(false)}
        footer={[
          <Button key="ok" type="primary" onClick={() => setVoiceModalVisible(false)}>
            Got it
          </Button>,
        ]}
      >
        <p style={{ fontSize: 15, color: isDark ? '#9ca3af' : '#475569', lineHeight: 1.6 }}>
          Voice task creation (e.g. <i>"Aaj 5 baje tak Ludhiana ke 5 T-shirt manufacturers ko call karna hai"</i>) is supported via Ask Sonam.
        </p>
      </Modal>
    </div>
  );
};
