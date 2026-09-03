import React from 'react';
import { Card, Row, Col } from 'antd';
import { TaskStats } from '@sonam/shared';
import { useTheme } from '../context/ThemeContext';

interface StatsOverviewProps {
  stats: TaskStats;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  const cardBg = isDark ? '#18181b' : '#ffffff';
  const borderCol = isDark ? '#27272a' : '#e2e8f0';

  return (
    <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
      <Col xs={12} sm={6}>
        <Card
          bodyStyle={{ padding: '16px' }}
          style={{
            borderRadius: 14,
            border: `1px solid ${borderCol}`,
            background: cardBg,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: isDark ? '#9ca3af' : '#64748b', textTransform: 'uppercase' }}>
            Today
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: isDark ? '#ef4444' : '#dc2626', marginTop: 4 }}>
            {stats.todayCount} <span style={{ fontSize: 13, fontWeight: 600, color: isDark ? '#71717a' : '#94a3b8' }}>tasks</span>
          </div>
        </Card>
      </Col>

      <Col xs={12} sm={6}>
        <Card
          bodyStyle={{ padding: '16px' }}
          style={{
            borderRadius: 14,
            border: `1px solid ${borderCol}`,
            background: cardBg,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>
            Completed
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981', marginTop: 4 }}>
            {stats.completedCount}
          </div>
        </Card>
      </Col>

      <Col xs={12} sm={6}>
        <Card
          bodyStyle={{ padding: '16px' }}
          style={{
            borderRadius: 14,
            border: `1px solid ${borderCol}`,
            background: cardBg,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: '#0ea5e9', textTransform: 'uppercase' }}>
            Pending
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0ea5e9', marginTop: 4 }}>
            {stats.pendingCount}
          </div>
        </Card>
      </Col>

      <Col xs={12} sm={6}>
        <Card
          bodyStyle={{ padding: '16px' }}
          style={{
            borderRadius: 14,
            border: isDark ? '1px solid #7f1d1d' : '1px solid #fee2e2',
            background: cardBg,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: isDark ? '#ef4444' : '#dc2626', textTransform: 'uppercase' }}>
            Overdue
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: isDark ? '#ef4444' : '#dc2626', marginTop: 4 }}>
            {stats.overdueCount}
          </div>
        </Card>
      </Col>
    </Row>
  );
};
