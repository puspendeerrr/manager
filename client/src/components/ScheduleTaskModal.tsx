import React, { useState, useEffect } from 'react';
import { Modal, Input, DatePicker, TimePicker, Select, Button, Typography, Form, message } from 'antd';
import { CalendarOutlined, BellOutlined, CheckOutlined } from '@ant-design/icons';
import { useTheme } from '../context/ThemeContext';
import dayjs, { Dayjs } from 'dayjs';

const { Text } = Typography;

interface ScheduleTaskModalProps {
  open: boolean;
  initialTitle: string;
  initialDateIso?: string | null;
  initialTimeStr?: string | null;
  repeatMins?: number;
  onSave: (data: { title: string; deadlineIso: string; repeatMins: number }) => void;
  onCancel: () => void;
}

export const ScheduleTaskModal: React.FC<ScheduleTaskModalProps> = ({
  open,
  initialTitle,
  initialDateIso,
  initialTimeStr,
  repeatMins = 30,
  onSave,
  onCancel,
}) => {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const redPrimary = isDark ? '#ef4444' : '#dc2626';

  const [title, setTitle] = useState(initialTitle);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [selectedTime, setSelectedTime] = useState<Dayjs | null>(null);
  const [selectedRepeatMins, setSelectedRepeatMins] = useState(repeatMins);

  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      setSelectedDate(initialDateIso ? dayjs(initialDateIso) : dayjs());
      setSelectedTime(initialTimeStr ? dayjs(initialTimeStr, 'HH:mm') : null);
      setSelectedRepeatMins(repeatMins);
    }
  }, [open, initialTitle, initialDateIso, initialTimeStr, repeatMins]);

  const handleFormSubmit = () => {
    if (!title.trim()) {
      message.error('Please enter a task title.');
      return;
    }

    if (!selectedDate) {
      message.error('Please select a date.');
      return;
    }

    if (!selectedTime) {
      message.error('Please select a time for your reminder.');
      return;
    }

    const combined = selectedDate
      .hour(selectedTime.hour())
      .minute(selectedTime.minute())
      .second(0)
      .millisecond(0);

    onSave({
      title: title.trim(),
      deadlineIso: combined.toISOString(),
      repeatMins: selectedRepeatMins,
    });
  };

  const labelStyle = { fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a' };

  return (
    <Modal
      open={open}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CalendarOutlined style={{ color: redPrimary, fontSize: 20 }} />
          <span style={{ fontWeight: 800, fontSize: 18, color: isDark ? '#f8fafc' : '#0f172a' }}>Schedule Task</span>
        </div>
      }
      footer={null}
      onCancel={onCancel}
      centered
      width={460}
      style={{ borderRadius: 16 }}
      bodyStyle={{ padding: '20px 24px' }}
    >
      <Form layout="vertical" onFinish={handleFormSubmit} style={{ marginTop: 12 }}>
        {/* Task Title */}
        <Form.Item label={<Text style={labelStyle}>Task Title</Text>} required>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Call Aman regarding SIH..."
            size="large"
            style={{ borderRadius: 10 }}
          />
        </Form.Item>

        {/* Date & Time Row */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <Form.Item label={<Text style={labelStyle}>Date</Text>} style={{ flex: 1, margin: 0 }} required>
            <DatePicker
              value={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              format="MMM D, YYYY"
              size="large"
              style={{ width: '100%', borderRadius: 10 }}
              allowClear={false}
            />
          </Form.Item>

          <Form.Item label={<Text style={labelStyle}>Time</Text>} style={{ flex: 1, margin: 0 }} required>
            <TimePicker
              value={selectedTime}
              onChange={(time) => setSelectedTime(time)}
              format="h:mm A"
              use12Hours
              size="large"
              placeholder="Select Time"
              style={{ width: '100%', borderRadius: 10 }}
            />
          </Form.Item>
        </div>

        {/* Repeating Reminder Select */}
        <Form.Item label={<Text style={labelStyle}>Reminder Schedule</Text>}>
          <Select
            value={selectedRepeatMins}
            onChange={setSelectedRepeatMins}
            size="large"
            style={{ width: '100%', borderRadius: 10 }}
            suffixIcon={<BellOutlined style={{ color: redPrimary }} />}
          >
            <Select.Option value={10}>Repeat every 10 mins</Select.Option>
            <Select.Option value={15}>Repeat every 15 mins</Select.Option>
            <Select.Option value={30}>Repeat every 30 mins (Default)</Select.Option>
            <Select.Option value={60}>Repeat every 1 hour</Select.Option>
          </Select>
        </Form.Item>

        {/* Modal Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
          <Button onClick={onCancel} size="large" style={{ borderRadius: 10, fontWeight: 600 }}>
            Cancel
          </Button>

          <Button
            type="primary"
            htmlType="submit"
            icon={<CheckOutlined />}
            size="large"
            style={{
              background: redPrimary,
              border: 'none',
              borderRadius: 10,
              fontWeight: 700,
              padding: '0 24px',
            }}
          >
            Save Task
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
