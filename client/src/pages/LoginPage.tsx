import React, { useState } from 'react';
import { App, Card, Input, Button, Typography } from 'antd';
import { UserOutlined, LockOutlined, CheckSquareOutlined, LoginOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const { Title, Text } = Typography;

export const LoginPage: React.FC = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const redPrimary = isDark ? '#ef4444' : '#dc2626';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      message.error('Username and password are required.');
      return;
    }

    try {
      setSubmitting(true);
      await login({ username, password });
      message.success('Logged in successfully!');
      navigate('/tasks');
    } catch (err: any) {
      message.error(err.message || 'Invalid username or password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 20,
          background: isDark ? '#18181b' : '#ffffff',
          borderColor: isDark ? '#27272a' : '#e2e8f0',
          boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.04)',
        }}
        styles={{ body: { padding: '36px 32px' } }}
      >
        {/* Logo & Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: redPrimary,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 28,
              marginBottom: 16,
              boxShadow: `0 8px 20px ${redPrimary}40`,
            }}
          >
            <CheckSquareOutlined />
          </div>
          <Title level={3} style={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 800, margin: 0 }}>
            Welcome back
          </Title>
          <Text type="secondary" style={{ fontSize: 14, marginTop: 4, display: 'block' }}>
            Login to your Personal Manager
          </Text>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <Text style={{ fontWeight: 700, fontSize: 13, color: isDark ? '#f8fafc' : '#0f172a', display: 'block', marginBottom: 6 }}>
              Username
            </Text>
            <Input
              prefix={<UserOutlined style={{ color: isDark ? '#9ca3af' : '#64748b' }} />}
              placeholder="Enter your username"
              size="large"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ borderRadius: 10 }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <Text style={{ fontWeight: 700, fontSize: 13, color: isDark ? '#f8fafc' : '#0f172a', display: 'block', marginBottom: 6 }}>
              Password
            </Text>
            <Input.Password
              prefix={<LockOutlined style={{ color: isDark ? '#9ca3af' : '#64748b' }} />}
              placeholder="Enter your password"
              size="large"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ borderRadius: 10 }}
            />
          </div>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={submitting}
            icon={<LoginOutlined />}
            style={{
              background: redPrimary,
              border: 'none',
              borderRadius: 12,
              fontWeight: 800,
              height: 46,
              fontSize: 16,
            }}
          >
            Login
          </Button>
        </form>

        {/* Footer link */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: redPrimary, fontWeight: 700 }}>
              Sign up
            </Link>
          </Text>
        </div>
      </Card>
    </div>
  );
};
