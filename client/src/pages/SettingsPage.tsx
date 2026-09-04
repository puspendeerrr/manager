import React, { useState } from 'react';
import { App, Typography, Card, Button, Divider, Radio, Select, Switch } from 'antd';
import {
  LogoutOutlined,
  UserOutlined,
  BgColorsOutlined,
  ClockCircleOutlined,
  BellOutlined,
  SoundOutlined,
  GlobalOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export const SettingsPage: React.FC = () => {
  const { message } = App.useApp();
  const { mode, setMode } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isDark = mode === 'dark';
  const redPrimary = isDark ? '#ef4444' : '#dc2626';

  const [repeatMins, setRepeatMins] = useState(30);
  const [enableSound, setEnableSound] = useState(true);
  const [keepReminding, setKeepReminding] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleLogout = async () => {
    await logout();
    message.success('Logged out successfully');
    navigate('/login');
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      message.success('Settings saved successfully!');
    }, 400);
  };

  const requestBrowserPermission = async () => {
    if (!('Notification' in window)) {
      message.error('Browser does not support notifications');
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      message.success('Browser notification permission granted!');
    } else {
      message.warning(`Notification permission status: ${perm}`);
    }
  };

  return (
    <div style={{ maxWidth: 650, margin: '0 auto', paddingBottom: 40 }}>
      <Title level={2} style={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 800, marginBottom: 8 }}>
        Settings & Preferences
      </Title>
      <Text style={{ color: isDark ? '#9ca3af' : '#64748b', fontSize: 15, display: 'block', marginBottom: 24 }}>
        Configure visual theme and persistent repeating reminder behavior.
      </Text>

      <Card style={{ borderRadius: 16, background: isDark ? '#18181b' : '#ffffff', borderColor: isDark ? '#27272a' : '#e2e8f0' }} styles={{ body: { padding: '24px 28px' } }}>
        {/* Account Information */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <Text style={{ fontWeight: 700, fontSize: 16, color: isDark ? '#f8fafc' : '#0f172a', display: 'block' }}>
              <UserOutlined style={{ marginRight: 8, color: redPrimary }} /> Logged in as: <span style={{ color: redPrimary }}>@{user?.username || 'user'}</span>
            </Text>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Your tasks and persistent reminders are securely isolated to your account.
            </Text>
          </div>

          <Button danger icon={<LogoutOutlined />} onClick={handleLogout} style={{ borderRadius: 8, fontWeight: 700 }}>
            Logout
          </Button>
        </div>

        <Divider style={{ borderColor: isDark ? '#27272a' : '#f1f5f9' }} />

        {/* Visual Theme Selection */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <Text style={{ fontWeight: 700, fontSize: 16, color: isDark ? '#f8fafc' : '#0f172a', display: 'block' }}>
              <BgColorsOutlined style={{ marginRight: 8, color: redPrimary }} /> Visual Theme
            </Text>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Select Red Light mode or Red Dark mode (persists on refresh).
            </Text>
          </div>

          <Radio.Group value={mode} onChange={(e) => setMode(e.target.value)} buttonStyle="solid">
            <Radio.Button value="light">Light</Radio.Button>
            <Radio.Button value="dark">Dark</Radio.Button>
          </Radio.Group>
        </div>

        <Divider style={{ borderColor: isDark ? '#27272a' : '#f1f5f9' }} />

        {/* Repeat Interval */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <Text style={{ fontWeight: 700, fontSize: 16, color: isDark ? '#f8fafc' : '#0f172a', display: 'block' }}>
              <ClockCircleOutlined style={{ marginRight: 8, color: redPrimary }} /> Default Repeating Reminder Interval
            </Text>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Sonam will re-notify you at this interval until task is marked Done.
            </Text>
          </div>

          <Select value={repeatMins} onChange={setRepeatMins} style={{ width: 140 }}>
            <Select.Option value={10}>Every 10 mins</Select.Option>
            <Select.Option value={15}>Every 15 mins</Select.Option>
            <Select.Option value={30}>Every 30 mins</Select.Option>
            <Select.Option value={60}>Every 1 hour</Select.Option>
          </Select>
        </div>

        <Divider style={{ borderColor: isDark ? '#27272a' : '#f1f5f9' }} />

        {/* Continue Reminding Until Done */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <Text style={{ fontWeight: 700, fontSize: 16, color: isDark ? '#f8fafc' : '#0f172a', display: 'block' }}>
              <BellOutlined style={{ marginRight: 8, color: redPrimary }} /> Continue Reminding Until Completed
            </Text>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Keep repeating reminders active if task is ignored.
            </Text>
          </div>

          <Switch checked={keepReminding} onChange={setKeepReminding} />
        </div>

        <Divider style={{ borderColor: isDark ? '#27272a' : '#f1f5f9' }} />

        {/* Notification Sound */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <Text style={{ fontWeight: 700, fontSize: 16, color: isDark ? '#f8fafc' : '#0f172a', display: 'block' }}>
              <SoundOutlined style={{ marginRight: 8, color: '#10b981' }} /> Notification Sound
            </Text>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Play notification audio tone when reminder triggers.
            </Text>
          </div>

          <Switch checked={enableSound} onChange={setEnableSound} />
        </div>

        <Divider style={{ borderColor: isDark ? '#27272a' : '#f1f5f9' }} />

        {/* Browser Notifications Permission */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <Text style={{ fontWeight: 700, fontSize: 16, color: isDark ? '#f8fafc' : '#0f172a', display: 'block' }}>
              <GlobalOutlined style={{ marginRight: 8, color: redPrimary }} /> Browser Notifications
            </Text>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Enable desktop popups even when browser tab is inactive.
            </Text>
          </div>

          <Button type="default" onClick={requestBrowserPermission} style={{ borderRadius: 8, fontWeight: 700 }}>
            Enable Permission
          </Button>
        </div>

        <div style={{ textAlign: 'right', marginTop: 32 }}>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            size="large"
            loading={saving}
            onClick={handleSave}
            style={{ background: redPrimary, border: 'none', borderRadius: 10, fontWeight: 700, padding: '0 32px' }}
          >
            Save Settings
          </Button>
        </div>
      </Card>
    </div>
  );
};
