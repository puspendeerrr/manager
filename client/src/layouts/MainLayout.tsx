import React, { useState, useEffect } from 'react';
import { Layout, Menu, Typography, Button, Tooltip } from 'antd';
import {
  CheckSquareOutlined,
  CalendarOutlined,
  RobotOutlined,
  SettingOutlined,
  MessageOutlined,
  SunOutlined,
  MoonOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toggleMode } = useTheme();

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isDark = mode === 'dark';
  const redPrimary = isDark ? '#ef4444' : '#dc2626';
  const bgLayout = isDark ? '#09090b' : '#fafafa';
  const bgCard = isDark ? '#18181b' : '#ffffff';
  const borderCol = isDark ? '#27272a' : '#e2e8f0';

  const menuItems = [
    { key: '/tasks', icon: <CheckSquareOutlined style={{ color: redPrimary, fontSize: 18 }} />, label: 'Tasks' },
    { key: '/calendar', icon: <CalendarOutlined style={{ color: redPrimary, fontSize: 18 }} />, label: 'Calendar' },
    { key: '/sonam', icon: <RobotOutlined style={{ color: redPrimary, fontSize: 18 }} />, label: 'Ask Sonam' },
    { key: '/settings', icon: <SettingOutlined style={{ color: isDark ? '#9ca3af' : '#64748b', fontSize: 18 }} />, label: 'Settings' },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: bgLayout }}>
      {/* Desktop Sider */}
      {!isMobile && (
        <Sider
          width={220}
          style={{
            background: bgCard,
            borderRight: `1px solid ${borderCol}`,
            position: 'sticky',
            top: 0,
            height: '100vh',
          }}
        >
          <div
            style={{
              padding: '24px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              borderBottom: `1px solid ${borderCol}`,
              cursor: 'pointer',
            }}
            onClick={() => navigate('/tasks')}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: redPrimary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 20,
              }}
            >
              <CheckSquareOutlined />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: isDark ? '#f8fafc' : '#0f172a', lineHeight: 1.2 }}>
                Sonam
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: isDark ? '#9ca3af' : '#64748b' }}>
                AI Personal Todo
              </div>
            </div>
          </div>

          <Menu
            mode="inline"
            selectedKeys={[location.pathname === '/' ? '/tasks' : location.pathname]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            style={{
              borderRight: 0,
              paddingTop: 16,
              fontSize: 15,
              fontWeight: 600,
              background: 'transparent',
            }}
          />
        </Sider>
      )}

      <Layout style={{ background: bgLayout }}>
        {/* Header */}
        <Header
          style={{
            background: isDark ? 'rgba(24, 24, 27, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${borderCol}`,
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => navigate('/tasks')}>
                <CheckSquareOutlined style={{ fontSize: 24, color: redPrimary }} />
                <span style={{ fontWeight: 800, fontSize: 18, color: isDark ? '#f8fafc' : '#0f172a' }}>Sonam AI Todo</span>
              </div>
            )}
            {!isMobile && (
              <Text style={{ fontWeight: 700, color: isDark ? '#9ca3af' : '#64748b', fontSize: 14 }}>
                Personal Todo & Persistent Repeating Reminders Active
              </Text>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Tooltip title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}>
              <Button
                type="text"
                icon={isDark ? <SunOutlined style={{ color: '#f59e0b', fontSize: 18 }} /> : <MoonOutlined style={{ color: '#64748b', fontSize: 18 }} />}
                onClick={toggleMode}
                style={{ borderRadius: 8 }}
              />
            </Tooltip>

            <Button
              type="primary"
              size="small"
              icon={<MessageOutlined />}
              onClick={() => navigate('/sonam')}
              style={{
                background: redPrimary,
                border: 'none',
                fontWeight: 700,
                borderRadius: 8,
              }}
            >
              Ask Sonam
            </Button>
          </div>
        </Header>

        {/* Main Content Area */}
        <Content
          style={{
            padding: isMobile ? '16px 12px 80px 12px' : '24px 32px',
            maxWidth: 1000,
            width: '100%',
            margin: '0 auto',
          }}
        >
          {children}
        </Content>
      </Layout>

      {/* Mobile Bottom Fixed Navigation */}
      {isMobile && (
        <div className="mobile-bottom-nav" style={{ background: bgCard, borderTop: `1px solid ${borderCol}` }}>
          <a className={`mobile-nav-item ${location.pathname === '/tasks' || location.pathname === '/' ? 'active' : ''}`} onClick={() => navigate('/tasks')}>
            <CheckSquareOutlined style={{ color: location.pathname === '/tasks' ? redPrimary : undefined }} />
            <span>Tasks</span>
          </a>

          <a className={`mobile-nav-item ${location.pathname === '/calendar' ? 'active' : ''}`} onClick={() => navigate('/calendar')}>
            <CalendarOutlined style={{ color: location.pathname === '/calendar' ? redPrimary : undefined }} />
            <span>Calendar</span>
          </a>

          <a className={`mobile-nav-item ${location.pathname === '/sonam' ? 'active' : ''}`} onClick={() => navigate('/sonam')}>
            <RobotOutlined style={{ color: location.pathname === '/sonam' ? redPrimary : undefined }} />
            <span>Ask Sonam</span>
          </a>

          <a className={`mobile-nav-item ${location.pathname === '/settings' ? 'active' : ''}`} onClick={() => navigate('/settings')}>
            <SettingOutlined style={{ color: location.pathname === '/settings' ? redPrimary : undefined }} />
            <span>Settings</span>
          </a>
        </div>
      )}
    </Layout>
  );
};
