import React from 'react';
import { Typography, Card, Tag, Button, Space } from 'antd';
import {
  RobotOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  AudioOutlined,
  ArrowLeftOutlined,
  CheckSquareOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const { Title, Text } = Typography;

export const SonamPage: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const redPrimary = isDark ? '#ef4444' : '#dc2626';

  return (
    <div style={{ maxWidth: 720, margin: '40px auto 60px auto', textAlign: 'center', padding: '0 16px' }}>
      {/* Coming Soon Tag */}
      <Tag
        color="volcano"
        icon={<ClockCircleOutlined />}
        style={{
          fontSize: 13,
          fontWeight: 800,
          borderRadius: 20,
          padding: '6px 16px',
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          marginBottom: 20,
          border: 'none',
          boxShadow: '0 4px 14px rgba(239, 68, 68, 0.25)',
        }}
      >
        Coming Soon
      </Tag>

      {/* Main Icon */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 24,
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px auto',
          color: 'white',
          fontSize: 40,
          boxShadow: '0 12px 30px rgba(239, 68, 68, 0.35)',
        }}
      >
        <RobotOutlined />
      </div>

      <Title level={2} style={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 800, marginBottom: 12 }}>
        Ask Sonam (AI Assistant)
      </Title>

      <Text
        style={{
          color: isDark ? '#9ca3af' : '#64748b',
          fontSize: 16,
          display: 'block',
          maxWidth: 580,
          margin: '0 auto 36px auto',
          lineHeight: 1.6,
        }}
      >
        We're building an intelligent AI assistant. Soon you'll be able to create, reschedule, snooze, and converse with your Personal Manager using natural voice and chat commands!
      </Text>

      {/* Feature Teasers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 36, textAlign: 'left' }}>
        <Card
          style={{
            background: isDark ? '#18181b' : '#ffffff',
            borderRadius: 16,
            borderColor: isDark ? '#27272a' : '#e2e8f0',
            boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.03)',
          }}
          styles={{ body: { padding: '20px' } }}
        >
          <AudioOutlined style={{ fontSize: 24, color: redPrimary, marginBottom: 10 }} />
          <Text style={{ fontWeight: 800, fontSize: 15, display: 'block', color: isDark ? '#f8fafc' : '#0f172a', marginBottom: 4 }}>
            Voice Task Creation
          </Text>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Simply speak to schedule tasks & set repeating reminders automatically.
          </Text>
        </Card>

        <Card
          style={{
            background: isDark ? '#18181b' : '#ffffff',
            borderRadius: 16,
            borderColor: isDark ? '#27272a' : '#e2e8f0',
            boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.03)',
          }}
          styles={{ body: { padding: '20px' } }}
        >
          <ThunderboltOutlined style={{ fontSize: 24, color: redPrimary, marginBottom: 10 }} />
          <Text style={{ fontWeight: 800, fontSize: 15, display: 'block', color: isDark ? '#f8fafc' : '#0f172a', marginBottom: 4 }}>
            Natural Language Parsing
          </Text>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Understands phrases like "Kal 5 PM ko Aman ko call reminder lagao".
          </Text>
        </Card>

        <Card
          style={{
            background: isDark ? '#18181b' : '#ffffff',
            borderRadius: 16,
            borderColor: isDark ? '#27272a' : '#e2e8f0',
            boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.03)',
          }}
          styles={{ body: { padding: '20px' } }}
        >
          <CheckSquareOutlined style={{ fontSize: 24, color: '#10b981', marginBottom: 10 }} />
          <Text style={{ fontWeight: 800, fontSize: 15, display: 'block', color: isDark ? '#f8fafc' : '#0f172a', marginBottom: 4 }}>
            Smart Reminders Engine
          </Text>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Seamlessly integrated with your primary Personal Manager schedule.
          </Text>
        </Card>
      </div>

      {/* Return Button */}
      <Button
        type="primary"
        icon={<ArrowLeftOutlined />}
        size="large"
        onClick={() => navigate('/tasks')}
        style={{
          background: redPrimary,
          border: 'none',
          borderRadius: 12,
          fontWeight: 700,
          padding: '0 28px',
          height: 48,
          fontSize: 15,
        }}
      >
        Go to Tasks
      </Button>
    </div>
  );
};
