import React, { useState } from 'react';
import { Card, Input, Button, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, CheckSquareOutlined, UserAddOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const { Title, Text } = Typography;

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const redPrimary = isDark ? '#ef4444' : '#dc2626';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim();
    if (!cleanUsername) {
      message.error('Username is required.');
      return;
    }
    if (!password) {
      message.error('Password is required.');
      return;
    }
    if (password !== confirmPassword) {
      message.error('Passwords do not match.');
      return;
    }

    try {
      setSubmitting(true);
      await signup({ username: cleanUsername, password, confirmPassword });
      message.success('Account created successfully!');
      navigate('/tasks');
    } catch (err: any) {
      message.error(err.message || 'Signup failed.');
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
        bodyStyle={{ padding: '36px 32px' }}
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
            Create your account
          </Title>
          <Text type="secondary" style={{ fontSize: 14, marginTop: 4, display: 'block' }}>
            Get started with Sonam Todo & Reminders
          </Text>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <Text style={{ fontWeight: 700, fontSize: 13, color: isDark ? '#f8fafc' : '#0f172a', display: 'block', marginBottom: 6 }}>
              Username
            </Text>
            <Input
              prefix={<UserOutlined style={{ color: isDark ? '#9ca3af' : '#64748b' }} />}
              placeholder="Choose a username"
              size="large"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ borderRadius: 10 }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <Text style={{ fontWeight: 700, fontSize: 13, color: isDark ? '#f8fafc' : '#0f172a', display: 'block', marginBottom: 6 }}>
              Password
            </Text>
            <Input.Password
              prefix={<LockOutlined style={{ color: isDark ? '#9ca3af' : '#64748b' }} />}
              placeholder="Choose a password"
              size="large"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ borderRadius: 10 }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <Text style={{ fontWeight: 700, fontSize: 13, color: isDark ? '#f8fafc' : '#0f172a', display: 'block', marginBottom: 6 }}>
              Confirm Password
            </Text>
            <Input.Password
              prefix={<LockOutlined style={{ color: isDark ? '#9ca3af' : '#64748b' }} />}
              placeholder="Confirm your password"
              size="large"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ borderRadius: 10 }}
            />
          </div>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={submitting}
            icon={<UserAddOutlined />}
            style={{
              background: redPrimary,
              border: 'none',
              borderRadius: 12,
              fontWeight: 800,
              height: 46,
              fontSize: 16,
            }}
          >
            Create Account
          </Button>
        </form>

        {/* Footer link */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: redPrimary, fontWeight: 700 }}>
              Login
            </Link>
          </Text>
        </div>
      </Card>
    </div>
  );
};
